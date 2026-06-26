import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CREDIT_MAP: Record<string, number> = {
  pack_50: 50,
  pack_150: 150,
  pack_500: 500,
  basic: 100,
  pro: 300,
  business: 2000,
};

Deno.serve(async (req) => {
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

    const { checkoutId, packId } = await req.json();

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

    const creditsToAdd = CREDIT_MAP[packId] ?? 0;
    if (creditsToAdd === 0) {
      return new Response(JSON.stringify({ error: "Unknown pack" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    const currentCredits = profile?.credits ?? 0;

    const { error: updateErr } = await admin
      .from("profiles")
      .update({ credits: currentCredits + creditsToAdd })
      .eq("id", user.id);

    if (updateErr) {
      console.error("activate-credits update error:", updateErr);
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("payment_submissions").insert({
      user_id: user.id,
      plan: packId,
      amount: checkout.amount,
      payment_method: "chargily",
      proof_url: checkoutId,
      status: "approved",
      reviewed_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        credits: currentCredits + creditsToAdd,
        added: creditsToAdd,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("activate-credits error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
