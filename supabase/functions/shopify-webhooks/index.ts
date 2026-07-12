import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/hash/sha256.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    // Verify webhook HMAC
    const hmacHeader = req.headers.get("X-Shopify-Hmac-Sha256");
    const body = await req.text();

    if (hmacHeader && Deno.env.get("SHOPIFY_CLIENT_SECRET")) {
      const hmac = createHmac("sha256");
      hmac.update(body);
      const computed = hmac.digest();
      const computedB64 = btoa(
        String.fromCharCode(...new Uint8Array(computed)),
      );

      if (computedB64 !== hmacHeader) {
        console.error("HMAC verification failed");
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const topic = req.headers.get("X-Shopify-Topic") || "unknown";
    const shopDomain = req.headers.get("X-Shopify-Shop-Domain") || "";
    const payload = JSON.parse(body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find the connection for this shop
    const { data: connection } = await supabase
      .from("shopify_connections" as any)
      .select("*")
      .eq("shop_domain", shopDomain)
      .eq("is_active", true)
      .single();

    if (!connection) {
      console.error("No active connection for shop:", shopDomain);
      return new Response("ok", { headers: corsHeaders });
    }

    const conn = connection as any;

    if (topic === "orders/create" || topic === "orders/updated") {
      // Check if we already have this order mapped
      const { data: existingMap } = await supabase
        .from("shopify_order_map" as any)
        .select("*")
        .eq("user_id", conn.user_id)
        .eq("shopify_order_id", payload.id)
        .single();

      if (!existingMap && topic === "orders/create") {
        // Import new order from Shopify
        const lineItems = (payload.line_items || []).map(
          (item: any) => ({
            product_id: null,
            name: item.title,
            quantity: item.quantity,
            unit_price: parseFloat(item.price),
          }),
        );

        const totalDZD = parseFloat(payload.total_price) * 10;

        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            store_id: conn.store_id,
            customer_name:
              payload.customer?.first_name
                ? `${payload.customer.first_name} ${payload.customer.last_name || ""}`
                : payload.shipping_address?.name || "Shopify Customer",
            customer_phone: payload.phone || payload.shipping_address?.phone || "",
            customer_email: payload.email || "",
            wilaya: payload.shipping_address?.province || "",
            commune: payload.shipping_address?.city || "",
            address: payload.shipping_address?.address1 || "",
            items: lineItems,
            total: totalDZD,
            status: "pending",
            payment_method: payload.financial_status === "paid" ? "online" : "cod",
            notes: `[Shopify #${payload.order_number}] ${payload.note || ""}`,
          })
          .select()
          .single();

        if (!orderError && newOrder) {
          await supabase.from("shopify_order_map" as any).insert({
            user_id: conn.user_id,
            shopify_order_id: payload.id,
            fennecly_order_id: newOrder.id,
          });
        }
      }
    }

    // Update last sync timestamp
    await supabase
      .from("shopify_connections" as any)
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", conn.id);

    return new Response("ok", { headers: corsHeaders });
  } catch (err) {
    console.error("shopify-webhooks error:", err);
    return new Response("ok", { headers: corsHeaders });
  }
});
