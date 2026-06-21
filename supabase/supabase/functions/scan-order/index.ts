import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image, media_type } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "Missing image data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "AI scanning is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an order extraction assistant. Analyze this image which is likely a screenshot or photo of a customer order note, chat message, or form. The conversation may be in Arabic, French, or Algerian Darija.

Extract the following order details and return them as a JSON object:
{
  "customer_name": "string or null",
  "customer_phone": "string or null (Algerian phone number)",
  "wilaya": "string or null (Algerian wilaya name, e.g. 'Alger', 'Oran', 'Constantine')",
  "city": "string or null (commune/city name)",
  "address": "string or null (street address)",
  "delivery_type": "domicile" or "stopdesk" or null,
  "items": [
    {
      "product_name": "string",
      "quantity": number,
      "unit_price": number or null
    }
  ],
  "notes": "string or null (any special instructions)",
  "confidence": "high" or "medium" or "low"
}

Rules:
- If the image is unclear or not an order, set confidence to "low" and return empty items.
- For phone numbers, normalize to Algerian format (0xxx xx xx xx).
- For wilaya, match to one of Algeria's 58 wilayas.
- If no price is visible, set unit_price to null.
- If no delivery type is mentioned, default to "domicile".
- Return ONLY the JSON object, no markdown fencing or explanation.`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: media_type || "image/jpeg",
                  data: image,
                },
              },
              {
                type: "text",
                text: prompt,
              },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errBody = await aiRes.text();
      console.error("Anthropic API error:", aiRes.status, errBody);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const text = aiData.content?.[0]?.text ?? "{}";

    // Extract JSON from response (handle potential markdown fencing)
    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      parsed = {};
    }

    // Log scan usage (best-effort, using service role since edge function)
    try {
      const adminSupabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );
      await adminSupabase.from("order_scan_logs").insert({
        user_id: user.id,
        confidence: parsed.confidence ?? "low",
        items_found: Array.isArray(parsed.items) ? parsed.items.length : 0,
      });
    } catch (logErr) {
      console.error("Failed to log scan usage:", logErr);
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("scan-order error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
