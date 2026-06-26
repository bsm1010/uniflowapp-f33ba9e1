import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader ?? "" } } },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amount, orderId, customerName, customerEmail, successUrl, failureUrl } =
      await req.json();

    const response = await fetch(
      "https://pay.chargily.net/test/api/v2/checkouts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("CHARGILY_SECRET_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          currency: "dzd",
          success_url: successUrl,
          failure_url: failureUrl,
          customer: {
            name: customerName,
            email: customerEmail || "customer@fennecly.online",
          },
          metadata: { order_id: orderId, user_id: user.id },
          locale: "ar",
        }),
      },
    );

    const checkout = await response.json();

    if (!response.ok) {
      console.error("Chargily error:", checkout);
      return new Response(JSON.stringify({ error: checkout }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        checkout_url: checkout.checkout_url,
        checkout_id: checkout.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
