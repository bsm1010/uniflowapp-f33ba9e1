import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAdapterCtor, normalizeProviderKey } from "./registry";

const InputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  orderId: z.string().uuid(),
});

export type TrackingHistoryEntry = {
  status: string;
  date: string;
  location?: string;
  city?: string;
  wilaya?: string;
};
export type TrackingDTO = {
  trackingNumber: string;
  status: string;
  rawStatus?: string;
  lastUpdate?: string;
  history: TrackingHistoryEntry[];
  /** Raw provider response JSON string for debugging / fallback display. */
  providerResponseJson?: string;
};

export type TrackOrderResult =
  | { ok: true; tracking: TrackingDTO; provider: string }
  | { ok: false; message: string };

export const trackOrderShipment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<TrackOrderResult> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }
      const { client: supabase, userId } = auth;

      const { data: order } = await supabase
        .from("orders")
        .select("id, store_owner_id, tracking_number, source")
        .eq("id", data.orderId)
        .maybeSingle();
      if (!order || order.store_owner_id !== userId) {
        return { ok: false, message: "Order not found." };
      }
      if (!order.tracking_number) {
        return { ok: false, message: "No tracking number yet." };
      }

      // Resolve company: prefer ZRExpress if order is from zrexpress, else any enabled.
      const { data: companies } = await supabase.from("delivery_companies").select("id, name");
      const zr = (companies ?? []).find((c) => normalizeProviderKey(c.name) === "zr_express");
      const companyId = zr?.id;
      if (!companyId) return { ok: false, message: "ZRExpress is not configured." };

      const { data: link } = await supabaseAdmin
        .from("store_delivery_companies")
        .select("api_key, api_secret")
        .eq("store_id", userId)
        .eq("company_id", companyId)
        .maybeSingle();
      if (!link?.api_key?.trim()) {
        return { ok: false, message: "Connect ZRExpress first." };
      }

      const Ctor = getAdapterCtor(zr!.name);
      if (!Ctor) return { ok: false, message: "No adapter available." };
      const adapter = new Ctor({
        apiKey: link.api_key.trim(),
        apiSecret: (link.api_secret ?? "").trim(),
      });

      let tracking = await adapter.trackShipment(order.tracking_number);
      let providerResponse = (tracking.raw ?? null) as Record<string, unknown> | null;

      // If the API returned no history, try to extract it from provider_response
      // stored in the shipments table (from a previous successful sync).
      if (!tracking.history || tracking.history.length === 0) {
        const { data: shipment } = await supabaseAdmin
          .from("shipments")
          .select("provider_response")
          .eq("order_id", data.orderId)
          .maybeSingle();
        if (shipment?.provider_response && typeof shipment.provider_response === "object") {
          const savedResponse = shipment.provider_response as Record<string, unknown>;
          providerResponse = providerResponse ?? savedResponse;
          // Try to extract history from the saved response
          const extracted = extractHistoryFromResponse(savedResponse);
          if (extracted.length > 0) {
            tracking = {
              ...tracking,
              history: extracted.map((h) => ({
                status: h.status,
                date: h.date,
                location: h.location,
                city: h.city,
                wilaya: h.wilaya,
              })),
            };
          }
        }
      }

      // Persist last status to shipments + orders.
      await supabaseAdmin
        .from("shipments")
        .update({
          status: tracking.status,
          last_sync_at: new Date().toISOString(),
          last_error: null,
          provider_response: (providerResponse ?? null) as never,
        })
        .eq("order_id", data.orderId);

      const dto: TrackingDTO = {
        trackingNumber: tracking.trackingNumber,
        status: tracking.status,
        rawStatus: tracking.rawStatus,
        lastUpdate: tracking.lastUpdate,
        history: (tracking.history ?? []).map((h) => ({
          status: h.status,
          date: h.date,
          location: h.location,
          city: h.city,
          wilaya: h.wilaya,
        })),
        providerResponseJson: providerResponse ? JSON.stringify(providerResponse) : undefined,
      };
      return { ok: true, tracking: dto, provider: zr!.name };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Tracking request failed.",
      };
    }
  });

/** Deep-search a response object for arrays that look like tracking history. */
function extractHistoryFromResponse(
  obj: Record<string, unknown>,
): Array<{ status: string; date: string; location?: string; city?: string; wilaya?: string }> {
  const results: Array<{
    status: string;
    date: string;
    location?: string;
    city?: string;
    wilaya?: string;
  }> = [];

  function lookForArrays(o: Record<string, unknown>, depth: number) {
    if (depth > 4) return;
    for (const [key, val] of Object.entries(o)) {
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === "object" && val[0] !== null) {
        // This looks like it could be a history array — check if items have status/date fields
        const first = val[0] as Record<string, unknown>;
        const hasStatus =
          "status" in first || "name" in first || "label" in first || "description" in first;
        const hasDate =
          "date" in first ||
          "createdAt" in first ||
          "created_at" in first ||
          "at" in first ||
          "timestamp" in first;
        if (hasStatus || hasDate) {
          for (const item of val) {
            const e = (item ?? {}) as Record<string, unknown>;
            const st = (e.state ?? {}) as Record<string, unknown>;
            const status =
              pickStr(e, ["status", "name", "label", "description", "statusText", "event"]) ||
              pickStr(st, ["name", "description"]);
            const date = pickStr(e, [
              "date",
              "createdAt",
              "created_at",
              "at",
              "timestamp",
              "eventDate",
              "statusDate",
            ]);
            const location = pickStr(e, ["location", "address"]) || undefined;
            const city = pickStr(e, ["city", "commune", "cityName"]) || undefined;
            const wilaya = pickStr(e, ["wilaya", "wilayaName", "state", "region"]) || undefined;
            if (status || date) {
              results.push({ status, date: date || "", location, city, wilaya });
            }
          }
          return;
        }
      }
      if (val && typeof val === "object" && !Array.isArray(val)) {
        lookForArrays(val as Record<string, unknown>, depth + 1);
      }
    }
  }

  lookForArrays(obj, 0);
  return results;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}
