import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type DeletionRequest = {
  id: string;
  store_id: string;
  customer_name: string;
  customer_email: string;
  reason: string | null;
  order_ids: string[] | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  completed_at: string | null;
  created_at: string;
};

export const submitDeletionRequest = createServerFn({ method: "POST" })
  .validator(
    (input: {
      storeId: string;
      name: string;
      email: string;
      reason?: string;
      orderIds?: string[];
    }) => input,
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("deletion_requests").insert({
      store_id: data.storeId,
      customer_name: data.name,
      customer_email: data.email,
      reason: data.reason ?? null,
      order_ids: data.orderIds ?? null,
      status: "pending",
    });
    if (error) throw new Error(error.message);

    await supabase.from("consent_audit_log").insert({
      store_id: data.storeId,
      action: "deletion_requested",
      details: { customer_name: data.name, customer_email: data.email },
    });

    return { ok: true };
  });

export const getDeletionRequests = createServerFn({ method: "GET" })
  .validator((input: { storeId: string }) => input)
  .handler(async ({ data }) => {
    const { data: requests } = await supabase
      .from("deletion_requests")
      .select("*")
      .eq("store_id", data.storeId)
      .order("created_at", { ascending: false });
    return (requests ?? []) as DeletionRequest[];
  });

export const getDeletionRequestStats = createServerFn({ method: "GET" })
  .validator((input: { storeId: string }) => input)
  .handler(async ({ data }) => {
    const { data: requests } = await supabase
      .from("deletion_requests")
      .select("status")
      .eq("store_id", data.storeId);

    const total = requests?.length ?? 0;
    const pending = requests?.filter((r) => r.status === "pending").length ?? 0;
    const approved = requests?.filter((r) => r.status === "approved").length ?? 0;
    const rejected = requests?.filter((r) => r.status === "rejected").length ?? 0;
    const completed = requests?.filter((r) => r.status === "completed").length ?? 0;

    return { total, pending, approved, rejected, completed };
  });

export const reviewDeletionRequest = createServerFn({ method: "POST" })
  .validator(
    (input: {
      requestId: string;
      status: "approved" | "rejected";
      notes?: string;
      reviewedBy: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("deletion_requests")
      .update({
        status: data.status,
        reviewed_by: data.reviewedBy,
        reviewed_at: new Date().toISOString(),
        review_notes: data.notes ?? null,
      })
      .eq("id", data.requestId);
    if (error) throw new Error(error.message);

    const { data: request } = await supabase
      .from("deletion_requests")
      .select("store_id")
      .eq("id", data.requestId)
      .maybeSingle();

    if (request) {
      await supabase.from("consent_audit_log").insert({
        store_id: request.store_id,
        actor_id: data.reviewedBy,
        action: data.status === "approved" ? "deletion_approved" : "deletion_rejected",
        details: { request_id: data.requestId, notes: data.notes },
      });
    }

    return { ok: true };
  });

export const processDeletion = createServerFn({ method: "POST" })
  .validator((input: { requestId: string; accessToken: string }) => input)
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Supabase config missing");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: request } = await admin
      .from("deletion_requests")
      .select("*")
      .eq("id", data.requestId)
      .maybeSingle();
    if (!request || request.status !== "approved") throw new Error("Request not approved");

    const email = request.customer_email.toLowerCase();

    // Anonymize customer data in orders
    const { data: orders } = await admin
      .from("orders")
      .select("id")
      .eq("store_id", request.store_id)
      .ilike("customer_email", email);

    if (orders && orders.length > 0) {
      const orderIds = orders.map((o) => o.id);

      await admin
        .from("order_items")
        .delete()
        .in("order_id", orderIds);

      await admin
        .from("orders")
        .delete()
        .in("id", orderIds);
    }

    // Delete abandoned carts
    await admin
      .from("abandoned_carts")
      .delete()
      .eq("store_id", request.store_id)
      .ilike("customer_email", email);

    // Delete chatbot conversations
    await admin
      .from("chatbot_conversations")
      .delete()
      .eq("store_owner_id", request.store_id)
      .ilike("customer_email", email);

    // Mark as completed
    await admin
      .from("deletion_requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.requestId);

    await admin.from("consent_audit_log").insert({
      store_id: request.store_id,
      action: "deletion_completed",
      details: { customer_email: email, request_id: data.requestId },
    });

    return { ok: true, ordersDeleted: orders?.length ?? 0 };
  });
