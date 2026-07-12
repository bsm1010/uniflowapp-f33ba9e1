import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const { shop_domain, code } = await req.json();

    if (!shop_domain || !code) {
      return new Response(
        JSON.stringify({ error: "shop_domain and code are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const normalizedDomain = shop_domain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    // Exchange authorization code for access token
    const tokenRes = await fetch(
      `https://${normalizedDomain}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: Deno.env.get("SHOPIFY_CLIENT_ID")!,
          client_secret: Deno.env.get("SHOPIFY_CLIENT_SECRET")!,
          code,
        }),
      },
    );

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Shopify token exchange failed:", err);
      return new Response(
        JSON.stringify({ error: "Token exchange failed", details: err }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Get shop info
    const shopRes = await fetch(
      `https://${normalizedDomain}/admin/api/2024-10/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
    );

    let shopName = normalizedDomain;
    if (shopRes.ok) {
      const shopData = await shopRes.json();
      shopName = shopData.shop?.name || normalizedDomain;
    }

    // Get the user's active store
    const { data: storeRows } = await supabase
      .from("stores")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single();

    if (!storeRows) {
      return new Response(
        JSON.stringify({ error: "No store found for this user" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Upsert connection
    const { error: upsertError } = await supabase
      .from("shopify_connections" as any)
      .upsert(
        {
          user_id: user.id,
          store_id: storeRows.id,
          shop_domain: normalizedDomain,
          access_token: accessToken,
          shop_name: shopName,
          is_active: true,
          sync_products: true,
          sync_orders: true,
        },
        { onConflict: "user_id,shop_domain" },
      );

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save connection" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Register webhooks for orders
    const webhookTopics = ["orders/create", "orders/updated", "orders/fulfilled"];
    for (const topic of webhookTopics) {
      await fetch(
        `https://${normalizedDomain}/admin/api/2024-10/webhooks.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            webhook: {
              topic,
              address: `${Deno.env.get("SUPABASE_URL")}/functions/v1/shopify-webhooks`,
              format: "json",
            },
          }),
        },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        shop_name: shopName,
        domain: normalizedDomain,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("shopify-oauth error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
});
