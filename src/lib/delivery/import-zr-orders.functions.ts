import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
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

      // Call ZRExpress.
      const url = `${ZR_BASE}/api/v1/parcels/search`;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${secretKey}`,
        "X-Tenant": tenantId,
        "X-Api-Key": secretKey,
        "Content-Type": "application/json",
      };
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });
      const bodyText = await res.text();
      console.log(`[importZR] status=${res.status} bytes=${bodyText.length}`);
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

      // Tolerate multiple envelope shapes: array | { data } | { parcels } | { items } | { results }.
      const arr: unknown[] = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as Record<string, unknown>).data)
          ? ((parsed as Record<string, unknown>).data as unknown[])
          : Array.isArray((parsed as Record<string, unknown>).parcels)
            ? ((parsed as Record<string, unknown>).parcels as unknown[])
            : Array.isArray((parsed as Record<string, unknown>).items)
              ? ((parsed as Record<string, unknown>).items as unknown[])
              : Array.isArray((parsed as Record<string, unknown>).results)
                ? ((parsed as Record<string, unknown>).results as unknown[])
                : [];

      if (arr.length === 0) {
        return {
          ok: true,
          message: "No orders found at ZRExpress.",
          imported: 0,
          updated: 0,
          total: 0,
        };
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

      for (const raw of arr) {
        if (!raw || typeof raw !== "object") continue;
        const p = raw as Record<string, unknown>;

        const tracking = pickStr(p, [
          "tracking",
          "tracking_number",
          "trackingNumber",
          "trackingId",
          "Tracking",
          "code",
        ]);
        if (!tracking) continue;

        const name = pickStr(p, ["client", "customer_name", "customerName", "recipient", "Client", "name"]);
        const phone = pickStr(p, ["mobile_a", "mobileA", "phone", "telephone", "MobileA", "Tel"]);
        const wilaya = pickStr(p, ["wilaya", "Wilaya", "wilaya_name", "destination_wilaya", "to_wilaya"]);
        const address = pickStr(p, ["address", "Adresse", "adresse", "delivery_address", "street"]);
        const commune = pickStr(p, ["commune", "Commune", "city", "town"]);
        const total = pickNum(p, ["total", "montant", "Montant", "amount", "price", "value", "TProduit"]);
        const status = pickStr(p, ["status", "situation", "state", "Situation", "etat"]) || "pending";
        const createdAt = pickDate(p, ["created_at", "createdAt", "date", "Date", "Date_Creation"]);

        const row: TablesInsert<"orders"> = {
          store_owner_id: userId,
          store_slug: storeSlug,
          customer_name: name || "ZRExpress customer",
          customer_email: "",
          shipping_address: phone, // existing convention: phone lives in shipping_address
          shipping_city: commune || address || "",
          shipping_postal_code: wilaya,
          shipping_country: "DZ",
          notes: address ? `ZRExpress import — ${address}` : "ZRExpress import",
          subtotal: total,
          total,
          status: status.toLowerCase(),
          delivery_type: "domicile",
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
              total: row.total,
              subtotal: row.subtotal,
              status: row.status,
            },
          });
        } else {
          toInsert.push(row);
        }
      }

      let imported = 0;
      let updated = 0;

      if (toInsert.length) {
        const { error: insErr, count } = await supabase
          .from("orders")
          .insert(toInsert as never[], { count: "exact" });
        if (insErr) {
          return { ok: false, message: `Insert failed: ${insErr.message}` };
        }
        imported = count ?? toInsert.length;
      }

      for (const u of toUpdate) {
        const { error: upErr } = await supabase
          .from("orders")
          .update(u.patch)
          .eq("id", u.id);
        if (!upErr) updated += 1;
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
