import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { getAdapterCtor } from "./registry";

const InputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  orderId: z.string().uuid(),
  companyId: z.string().uuid().optional(),
});

export type PushOrderResult =
  | { ok: true; message: string; trackingNumber: string }
  | { ok: false; message: string };

/**
 * Push an existing order to its delivery provider (ZR Express, Yalidine…).
 * Used both as a manual "send" button and as the auto-push step on order
 * creation. Errors are persisted to `shipments.last_error` so the dashboard
 * can show the user exactly what failed.
 */
export const pushOrderToProvider = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<PushOrderResult> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }
      const { client: supabase, userId } = auth;
      return await pushOrderInternal(supabase, userId, data.orderId, data.companyId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected server error.";
      return { ok: false, message: msg };
    }
  });

/**
 * Shared push logic — also called from createOrder (with an admin client and
 * the resolved storeOwnerId) so order creation never blocks on provider push.
 */
export async function pushOrderInternal(
  // accept either an admin or auth'd client — same surface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  storeOwnerId: string,
  orderId: string,
  companyIdOverride?: string,
): Promise<PushOrderResult> {
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select(
      "id, store_owner_id, customer_name, shipping_address, shipping_city, shipping_postal_code, total, notes, delivery_type, tracking_number",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (orderErr || !order) return { ok: false, message: "Order not found." };
  if (order.store_owner_id !== storeOwnerId) {
    return { ok: false, message: "Not authorized for this order." };
  }
  if (order.tracking_number) {
    return {
      ok: true,
      message: "Already sent to provider.",
      trackingNumber: order.tracking_number,
    };
  }

  // Pull product name from first item for the provider label.
  const { data: items } = await supabase
    .from("order_items")
    .select("product_name, quantity")
    .eq("order_id", orderId)
    .limit(1);
  const firstItem = items?.[0];
  const productName = firstItem
    ? `${firstItem.product_name}${firstItem.quantity > 1 ? ` x${firstItem.quantity}` : ""}`
    : "Order";

  // Resolve company: explicit > store default > any enabled with credentials.
  let companyId = companyIdOverride;
  if (!companyId) {
    const { data: def } = await supabase
      .from("store_delivery_companies")
      .select("company_id")
      .eq("store_id", storeOwnerId)
      .eq("enabled", true)
      .eq("is_default", true)
      .maybeSingle();
    companyId = def?.company_id ?? undefined;
  }
  if (!companyId) {
    const { data: any } = await supabase
      .from("store_delivery_companies")
      .select("company_id")
      .eq("store_id", storeOwnerId)
      .eq("enabled", true)
      .limit(1)
      .maybeSingle();
    companyId = any?.company_id ?? undefined;
  }
  if (!companyId) {
    return {
      ok: false,
      message: "No delivery company is connected. Connect ZR Express first.",
    };
  }

  const { data: company } = await supabase
    .from("delivery_companies")
    .select("id, name, is_active")
    .eq("id", companyId)
    .maybeSingle();
  if (!company || !company.is_active) {
    return { ok: false, message: "Delivery company is not active." };
  }

  const { data: link } = await supabase
    .from("store_delivery_companies")
    .select("api_key, api_secret, enabled")
    .eq("store_id", storeOwnerId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!link?.enabled) return { ok: false, message: "This carrier is disabled." };
  if (!link.api_key?.trim()) {
    return { ok: false, message: "Missing credentials for this carrier." };
  }

  const Ctor = getAdapterCtor(company.name);
  if (!Ctor) {
    return { ok: false, message: `No adapter for ${company.name}.` };
  }
  const adapter = new Ctor({
    apiKey: link.api_key.trim(),
    apiSecret: (link.api_secret ?? "").trim(),
  });

  try {
    const result = await adapter.createShipment({
      orderId: order.id,
      customerName: order.customer_name,
      customerPhone: order.shipping_address, // checkout stores phone here
      wilaya: order.shipping_postal_code,
      commune: order.shipping_city,
      address: order.shipping_address,
      productName,
      totalPrice: Number(order.total),
      notes: order.notes ?? undefined,
    });

    // Upsert shipment row.
    const { data: existing } = await supabase
      .from("shipments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    const shipmentPayload = {
      store_id: storeOwnerId,
      order_id: orderId,
      company_id: companyId,
      tracking_number: result.trackingNumber,
      status: result.status,
      delivery_type: order.delivery_type ?? "domicile",
      last_error: null,
      last_sync_at: new Date().toISOString(),
      provider_response: (result.raw ?? null) as never,
    };
    if (existing?.id) {
      await supabase.from("shipments").update(shipmentPayload).eq("id", existing.id);
    } else {
      await supabase.from("shipments").insert(shipmentPayload);
    }

    await supabase
      .from("orders")
      .update({ tracking_number: result.trackingNumber, status: "confirmed" })
      .eq("id", orderId);

    return {
      ok: true,
      message: `Sent to ${company.name}. Tracking: ${result.trackingNumber}`,
      trackingNumber: result.trackingNumber,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Provider request failed.";
    // Persist last_error so the user can see what went wrong.
    const { data: existing } = await supabase
      .from("shipments")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();
    const errorPayload = {
      store_id: storeOwnerId,
      order_id: orderId,
      company_id: companyId,
      status: "pending",
      delivery_type: order.delivery_type ?? "domicile",
      last_error: msg.slice(0, 1000),
      last_sync_at: new Date().toISOString(),
    };
    if (existing?.id) {
      await supabase.from("shipments").update(errorPayload).eq("id", existing.id);
    } else {
      await supabase.from("shipments").insert(errorPayload);
    }
    return { ok: false, message: msg };
  }
}

/**
 * Convenience admin-client helper used by createOrder so we don't have to
 * thread the user's access token through. Safe because we already verified
 * the store ownership in createOrder itself.
 */
export async function pushOrderWithAdmin(
  orderId: string,
  storeOwnerId: string,
  companyId?: string,
): Promise<PushOrderResult> {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return { ok: false, message: "Backend not configured." };
  }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY);
  return pushOrderInternal(admin, storeOwnerId, orderId, companyId);
}
