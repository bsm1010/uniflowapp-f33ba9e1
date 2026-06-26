import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.text();
    const signature = req.headers.get("signature") ?? "";

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(Deno.env.get("CHARGILY_SECRET_KEY")!),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encoder.encode(body),
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.type === "checkout.paid") {
      const checkout = event.data;
      const orderId = checkout.metadata?.order_id;

      if (!orderId) {
        return new Response("ok", { status: 200 });
      }

      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      if (orderId.startsWith("PLAN-")) {
        const parts = orderId.split("-");
        const planId = parts[2];
        const userId = parts[1];

        const PLAN_MAP: Record<string, string> = {
          trial: "free",
          beginner: "basic",
          pro: "pro",
          business: "business",
          agency: "business",
        };
        const mappedPlan = PLAN_MAP[planId] ?? "basic";

        await adminSupabase
          .from("profiles")
          .update({ plan: mappedPlan })
          .eq("id", userId);

        await adminSupabase.from("payment_submissions").insert({
          user_id: userId,
          plan: planId,
          amount: checkout.amount,
          payment_method: "chargily",
          proof_url: checkout.id,
          status: "approved",
          reviewed_at: new Date().toISOString(),
        });
      } else if (orderId.startsWith("CREDITS-")) {
        const parts = orderId.split("-");
        const packId = parts[2];
        const userId = parts[1];

        const CREDIT_MAP: Record<string, number> = {
          pack_50: 50,
          pack_150: 150,
          pack_500: 500,
          basic: 100,
          pro: 300,
          business: 2000,
        };
        const creditsToAdd = CREDIT_MAP[packId] ?? 0;

        if (creditsToAdd > 0) {
          const { data: profile } = await adminSupabase
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single();

          const currentCredits = profile?.credits ?? 0;

          await adminSupabase
            .from("profiles")
            .update({ credits: currentCredits + creditsToAdd })
            .eq("id", userId);

          await adminSupabase.from("payment_submissions").insert({
            user_id: userId,
            plan: packId,
            amount: checkout.amount,
            payment_method: "chargily",
            proof_url: checkout.id,
            status: "approved",
            reviewed_at: new Date().toISOString(),
          });
        }
      } else {
        await adminSupabase
          .from("orders")
          .update({
            status: "confirmed",
            payment_status: "paid",
            chargily_checkout_id: checkout.id,
            paid_at: new Date().toISOString(),
          })
          .eq("id", orderId);

        const { data: order } = await adminSupabase
          .from("orders")
          .select("store_owner_id, customer_name, total")
          .eq("id", orderId)
          .single();

        if (order) {
          await adminSupabase.from("notifications").insert({
            user_id: order.store_owner_id,
            title: "New payment received",
            message: `${order.customer_name} paid ${order.total} DA via Chargily`,
            type: "success",
          });
        }
      }
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("webhook error:", err);
    return new Response(String(err), { status: 500 });
  }
});
