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

    const { checkoutId, planId } = await req.json();

    const chargilyRes = await fetch(
      `https://pay.chargily.net/test/api/v2/checkouts/${checkoutId}`,
      {
        headers: {
          Authorization: `Bearer ${Deno.env.get("CHARGILY_SECRET_KEY")}`,
        },
      },
    );
    const checkout = await chargilyRes.json();

    if (checkout.status !== "paid") {
      return new Response(JSON.stringify({ error: "Checkout not paid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const PLAN_MAP: Record<string, string> = {
      trial: "free",
      beginner: "basic",
      pro: "pro",
      business: "business",
      agency: "business",
    };
    const mappedPlan = PLAN_MAP[planId] ?? "basic";

    const { error: updateErr } = await admin
      .from("profiles")
      .update({ plan: mappedPlan })
      .eq("id", user.id);

    if (updateErr) {
      console.error("activate-plan update error:", updateErr);
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("payment_submissions").insert({
      user_id: user.id,
      plan: planId,
      amount: checkout.amount,
      payment_method: "chargily",
      proof_url: checkoutId,
      status: "approved",
      reviewed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, plan: mappedPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("activate-plan error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
