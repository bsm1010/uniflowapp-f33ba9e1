import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeProviderKey } from "./registry";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

const InputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  companyId: z.string().uuid(),
});

export type ImportZROrdersResult =
  | { ok: true; message: string; imported: number; updated: number; total: number }
  | { ok: false; message: string };

const ZR_BASE = "https://api.zrexpress.app";

/** Best-effort string extraction from arbitrary upstream shapes. */
function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}
function pickNum(obj: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return 0;
}
function pickDate(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
  }
  return null;
}

export const importZRExpressOrders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ImportZROrdersResult> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }
      const { client: supabase, userId } = auth;

      // Resolve company + creds.
      const { data: company } = await supabase
        .from("delivery_companies")
        .select("id, name, is_active")
        .eq("id", data.companyId)
        .maybeSingle();
      if (!company) return { ok: false, message: "Delivery company not found." };
      const provider = normalizeProviderKey(company.name);
      if (provider !== "zr_express" && provider !== "zrexpress") {
        return { ok: false, message: `Order import is only supported for ZRExpress.` };
      }

      const { data: link } = await supabase
        .from("store_delivery_companies")
        .select("api_key, api_secret, enabled")
        .eq("store_id", userId)
        .eq("company_id", data.companyId)
        .maybeSingle();
      if (!link?.api_key?.trim()) {
        return { ok: false, message: "Connect ZRExpress first." };
      }
      const secretKey = link.api_key.trim();
      const tenantId = (link.api_secret ?? "").trim();

      // Need a store_slug for orders rows.
      const { data: store } = await supabase
        .from("store_settings")
        .select("slug")
        .eq("user_id", userId)
        .maybeSingle();
      const storeSlug = store?.slug ?? "";
      if (!storeSlug) {
        return { ok: false, message: "Create your store first (no store slug found)." };
      }

      // Call ZRExpress with pagination.
      const url = `${ZR_BASE}/api/v1/parcels/search`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${secretKey}`,
        "X-Tenant": tenantId,
        "X-Api-Key": secretKey,
        "Content-Type": "application/json",
      };

      const arr: Record<string, unknown>[] = [];
      const PAGE_SIZE = 200;
      let pageNumber = 1;
      const MAX_PAGES = 100;
      while (pageNumber <= MAX_PAGES) {
        const res = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({ pageNumber, pageSize: PAGE_SIZE }),
        });
        const bodyText = await res.text();
        if (!res.ok) {
          return {
            ok: false,
            message: `ZRExpress returned ${res.status}: ${bodyText.slice(0, 200)}`,
          };
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          return { ok: false, message: "ZRExpress returned non-JSON response." };
        }
        const obj = (parsed && typeof parsed === "object" ? parsed : {}) as Record<string, unknown>;
        const items: unknown[] = Array.isArray(parsed)
          ? (parsed as unknown[])
          : Array.isArray(obj.items) ? (obj.items as unknown[])
          : Array.isArray(obj.data) ? (obj.data as unknown[])
          : Array.isArray(obj.parcels) ? (obj.parcels as unknown[])
          : Array.isArray(obj.results) ? (obj.results as unknown[])
          : [];
        for (const it of items) {
          if (it && typeof it === "object") arr.push(it as Record<string, unknown>);
        }
        const hasNext = obj.hasNext === true;
        const totalPages = typeof obj.totalPages === "number" ? obj.totalPages : null;
        console.log(`[importZR] page=${pageNumber} got=${items.length} total=${obj.totalCount ?? "?"} hasNext=${hasNext}`);
        if (items.length === 0) break;
        if (!hasNext && (totalPages === null || pageNumber >= totalPages)) break;
        if (Array.isArray(parsed)) break; // not paginated
        pageNumber += 1;
      }

      if (arr.length === 0) {
        return { ok: true, message: "No orders found at ZRExpress.", imported: 0, updated: 0, total: 0 };
      }

      // Existing imports for this store (match by tracking_number).
      const { data: existingRows } = await supabase
        .from("orders")
        .select("id, tracking_number")
        .eq("store_owner_id", userId)
        .eq("source", "zrexpress");
      const existingMap = new Map<string, string>();
      for (const r of existingRows ?? []) {
        if (r.tracking_number) existingMap.set(r.tracking_number, r.id);
      }

      const toInsert: TablesInsert<"orders">[] = [];
      const toUpdate: Array<{ id: string; patch: TablesUpdate<"orders"> }> = [];

      const asObj = (v: unknown): Record<string, unknown> =>
        v && typeof v === "object" ? (v as Record<string, unknown>) : {};

      for (const p of arr) {
        const customer = asObj(p.customer);
        const phoneObj = asObj(customer.phone);
        const addr = asObj(p.deliveryAddress);
        const state = asObj(p.state);

        const tracking =
          pickStr(p, ["trackingNumber", "tracking", "tracking_number", "trackingId", "code"]) ||
          pickStr(asObj(p.id ? { v: p.id } : {}), ["v"]);
        if (!tracking) continue;

        const name = pickStr(customer, ["name", "fullName"]) || pickStr(p, ["customerName", "client", "name"]);
        const phone =
          pickStr(phoneObj, ["number1", "number2", "number3"]) ||
          pickStr(p, ["phone", "mobile_a", "mobileA", "telephone", "Tel"]);
        const street = pickStr(addr, ["street", "address", "line1"]);
        const city = pickStr(addr, ["city", "district"]);
        const wilayaCode = pickNum(addr, ["cityTerritoryCode", "wilayaCode"]);
        const postalCode = pickStr(addr, ["postalCode", "zip"]);
        const wilaya = wilayaCode
          ? String(wilayaCode).padStart(2, "0")
          : pickStr(addr, ["wilaya"]) || (postalCode ? postalCode.slice(0, 2) : "");

        const total = pickNum(p, ["amount", "total", "montant", "price", "value", "TProduit"]);
        const status =
          pickStr(state, ["name", "description"]) ||
          pickStr(p, ["status", "situation", "etat"]) ||
          "pending";
        const createdAt = pickDate(p, ["createdAt", "created_at", "date", "Date_Creation"]);
        const productDesc = pickStr(p, ["productsDescription", "description"]);
        const deliveryTypeRaw = pickStr(p, ["deliveryType", "delivery_type"]).toLowerCase();
        const deliveryType =
          deliveryTypeRaw.includes("pickup") || deliveryTypeRaw.includes("stop")
            ? "stopdesk"
            : "domicile";

        const notesParts: string[] = ["ZRExpress import"];
        if (street) notesParts.push(`Address: ${street}`);
        if (city) notesParts.push(`Commune: ${city}`);
        if (productDesc) notesParts.push(`Product: ${productDesc}`);

        const row: TablesInsert<"orders"> = {
          store_owner_id: userId,
          store_slug: storeSlug,
          customer_name: name || "ZRExpress customer",
          customer_email: "",
          shipping_address: phone || street || "",
          shipping_city: city || "",
          shipping_postal_code: wilaya,
          shipping_country: "DZ",
          notes: notesParts.join(" • "),
          subtotal: total,
          total,
          status: status.toLowerCase(),
          delivery_type: deliveryType,
          tracking_number: tracking,
          source: "zrexpress",
        };
        if (createdAt) row.created_at = createdAt;

        const existingId = existingMap.get(tracking);
        if (existingId) {
          toUpdate.push({
            id: existingId,
            patch: {
              customer_name: row.customer_name,
              shipping_address: row.shipping_address,
              shipping_city: row.shipping_city,
              shipping_postal_code: row.shipping_postal_code,
              notes: row.notes,
              total: row.total,
              subtotal: row.subtotal,
              status: row.status,
              delivery_type: row.delivery_type,
            },
          });
        } else {
          toInsert.push(row);
        }
      }

      let imported = 0;
      let updated = 0;

      console.log(`[importZR] toInsert=${toInsert.length} toUpdate=${toUpdate.length}`);

      if (toInsert.length) {
        // orders RLS restricts INSERT to service_role; use admin client (caller already verified above).
        const { error: insErr, count } = await supabaseAdmin
          .from("orders")
          .insert(toInsert, { count: "exact" });
        if (insErr) {
          console.error("[importZR] insert error", insErr);
          return { ok: false, message: `Insert failed: ${insErr.message}` };
        }
        imported = count ?? toInsert.length;
      }

      for (const u of toUpdate) {
        const { error: upErr } = await supabaseAdmin
          .from("orders")
          .update(u.patch)
          .eq("id", u.id);
        if (upErr) console.error("[importZR] update error", upErr);
        else updated += 1;
      }

      return {
        ok: true,
        message: `${imported} order${imported === 1 ? "" : "s"} imported from ZRExpress${updated ? `, ${updated} updated` : ""}.`,
        imported,
        updated,
        total: arr.length,
      };
    } catch (e) {
      console.error("[importZRExpressOrders] error", e);
      return { ok: false, message: e instanceof Error ? e.message : "Unexpected error." };
    }
  });
