import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAdapterCtor, normalizeProviderKey } from "./registry";
import type { TrackingResult } from "./types";

const InputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  orderId: z.string().uuid(),
});

export type TrackOrderResult =
  | { ok: true; tracking: TrackingResult; provider: string }
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
      const { data: companies } = await supabase
        .from("delivery_companies")
        .select("id, name");
      const zr = (companies ?? []).find(
        (c) => normalizeProviderKey(c.name) === "zr_express",
      );
      const companyId = zr?.id;
      if (!companyId) return { ok: false, message: "ZRExpress is not configured." };

      const { data: link } = await supabase
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

      const tracking = await adapter.trackShipment(order.tracking_number);

      // Persist last status to shipments + orders.
      await supabaseAdmin
        .from("shipments")
        .update({
          status: tracking.status,
          last_sync_at: new Date().toISOString(),
          last_error: null,
          provider_response: (tracking.raw ?? null) as never,
        })
        .eq("order_id", data.orderId);

      const { raw: _raw, ...safe } = tracking;
      return { ok: true, tracking: safe as TrackingResult, provider: zr!.name };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Tracking request failed.",
      };
    }
  });
