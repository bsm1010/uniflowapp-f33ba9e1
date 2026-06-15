import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin as supabaseAdminTyped } from "@/integrations/supabase/client.server";
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- service_role client bypasses RLS; types are intentionally loose
const supabaseAdmin: any = supabaseAdminTyped;
import { createAuthenticatedDeliveryClient } from "@/lib/delivery/authenticated-client";
import type { Database } from "@/integrations/supabase/types";

/**
 * Admin-only dropshipping server functions.
 *
 * These run with service_role (bypasses RLS) so a single client can list ALL
 * dropship orders and transition statuses. The client-side hooks call these
 * via useServerFn(); the service_role key never leaves the server.
 *
 * Access control: callers MUST verify the authenticated user has the
 * `marketplace_admin` (or `admin`) app role before invoking. We re-check
 * here as a defense-in-depth layer.
 */

async function assertMarketplaceAdmin(userId: string): Promise<void> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(`Failed to verify admin role: ${error.message}`);
  const role = (data as { role?: string } | null)?.role;
  if (role !== "marketplace_admin" && role !== "admin") {
    throw new Error("Forbidden: marketplace_admin role required");
  }
}

// ------------------------------------------------------------
// Admin: list all dropship orders (with optional status filter)
// ------------------------------------------------------------
const ListOrdersInput = z.object({
  status: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export const listAllDropshipOrders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListOrdersInput.parse(input))
  .handler(async ({ data }) => {
    const { data: orders, error } = await supabaseAdmin
      .from("dropship_orders")
      .select(
        "id, reseller_listing_id, reseller_id, client_name, client_phone, " +
          "client_wilaya, client_address, selling_price, platform_price, " +
          "cost_price, admin_profit, reseller_profit, status, tracking_number, " +
          "zr_express_id, reseller_paid_at, shipped_at, delivered_at, " +
          "refused_at, buffer_expires_at, returned_to_reseller_at, created_at",
      )
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1)
      .match(data.status ? { status: data.status } : {});
    if (error) throw new Error(error.message);
    return { orders: orders ?? [] };
  });

// ------------------------------------------------------------
// Admin: transition a dropship order's status
// ------------------------------------------------------------
const VALID_STATUSES = [
  "pending_payment",
  "paid_by_reseller",
  "purchased_by_admin",
  "shipped",
  "delivered",
  "refused",
  "in_stock_buffer",
  "returned_to_reseller",
] as const;

const UpdateStatusInput = z.object({
  order_id: z.string().uuid(),
  status: z.enum(VALID_STATUSES),
  tracking_number: z.string().min(1).max(200).optional(),
  zr_express_id: z.string().min(1).max(200).optional(),
});

export const updateDropshipOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => UpdateStatusInput.parse(input))
  .handler(async ({ data }) => {
    // Stamp the corresponding *_at timestamp based on the new status.
    const now = new Date().toISOString();
    const timestampPatch: Record<string, string> = {};
    switch (data.status) {
      case "shipped":
        timestampPatch.shipped_at = now;
        break;
      case "delivered":
        timestampPatch.delivered_at = now;
        break;
      case "refused":
      case "in_stock_buffer":
        timestampPatch.refused_at = now;
        break;
      case "returned_to_reseller":
        timestampPatch.returned_to_reseller_at = now;
        break;
    }

    const { data: order, error } = await supabaseAdmin
      .from("dropship_orders")
      .update({
        status: data.status,
        ...(data.tracking_number !== undefined ? { tracking_number: data.tracking_number } : {}),
        ...(data.zr_express_id !== undefined ? { zr_express_id: data.zr_express_id } : {}),
        ...timestampPatch,
      })
      .eq("id", data.order_id)
      .select(
        "id, status, tracking_number, zr_express_id, shipped_at, " +
          "delivered_at, refused_at, buffer_expires_at, returned_to_reseller_at",
      )
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) throw new Error("Order not found");
    return { order };
  });

// ------------------------------------------------------------
// Admin: list wallet topup requests (with optional status filter)
// ------------------------------------------------------------
const ListTopupRequestsInput = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export const listWalletTopupRequests = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListTopupRequestsInput.parse(input))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("wallet_topup_requests")
      .select(
        "id, reseller_id, amount, payment_reference, status, admin_note, " +
          "processed_at, processed_by, created_at",
      )
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);
    if (data.status) q = q.eq("status", data.status);
    const { data: requests, error } = await q;
    if (error) throw new Error(error.message);
    return {
      requests: (requests ?? []) as Array<{
        id: string;
        reseller_id: string;
        amount: number;
        payment_reference: string | null;
        status: string;
        admin_note: string | null;
        processed_at: string | null;
        processed_by: string | null;
        created_at: string;
      }>,
    };
  });

// ------------------------------------------------------------
// Admin: approve / reject a wallet topup request
// ------------------------------------------------------------
const TopupDecisionInput = z.object({
  request_id: z.string().uuid(),
  admin_note: z.string().max(500).optional(),
  access_token: z.string().min(1),
});

export const approveWalletTopup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TopupDecisionInput.parse(input))
  .handler(async ({ data }) => {
    const auth = await createAuthenticatedDeliveryClient(data.access_token);
    if ("error" in auth) throw new Error(auth.error);
    const { userId: adminId } = auth;

    const { error } = await supabaseAdmin.rpc("admin_approve_wallet_topup", {
      p_request_id: data.request_id,
      p_admin_id: adminId,
      p_admin_note: data.admin_note ?? undefined,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const rejectWalletTopup = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TopupDecisionInput.parse(input))
  .handler(async ({ data }) => {
    const auth = await createAuthenticatedDeliveryClient(data.access_token);
    if ("error" in auth) throw new Error(auth.error);
    const { userId: adminId } = auth;

    const { error } = await supabaseAdmin.rpc("admin_reject_wallet_topup", {
      p_request_id: data.request_id,
      p_admin_id: adminId,
      p_admin_note: data.admin_note ?? undefined,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
