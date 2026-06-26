import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, signature",
};

serve(async (req) => {
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

      if (orderId) {
        const adminSupabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );

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
