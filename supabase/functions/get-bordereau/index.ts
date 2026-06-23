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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { colisId, storeId } = await req.json();
    if (!colisId || !storeId) {
      return new Response(JSON.stringify({ error: "Missing colisId or storeId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get ZR Express credentials using service role (bypasses RLS)
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: zrCompany } = await adminSupabase
      .from("delivery_companies")
      .select("id")
      .ilike("name", "%zr%express%")
      .maybeSingle();

    if (!zrCompany?.id) {
      return new Response(JSON.stringify({ error: "ZR Express not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: link } = await adminSupabase
      .from("store_delivery_companies")
      .select("api_key")
      .eq("store_id", storeId)
      .eq("company_id", zrCompany.id)
      .maybeSingle();

    const token = link?.api_key ?? "";
    if (!token) {
      return new Response(JSON.stringify({ error: "No ZR Express API key found for this store" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ZR_BASE_URL = "https://api.zrexpress.app/api/v1";

    // Try approach 1: GET with id param
    let pdfBlob: ArrayBuffer | null = null;

    const attempt1 = await fetch(
      `${ZR_BASE_URL}/get_bordereaux?token=${encodeURIComponent(token)}&id=${encodeURIComponent(colisId)}`,
      { method: "GET" },
    ).catch(() => null);

    if (attempt1?.ok) {
      const ct = attempt1.headers.get("content-type") ?? "";
      if (ct.includes("application/pdf")) {
        pdfBlob = await attempt1.arrayBuffer();
      } else {
        const body = await attempt1.json().catch(() => null);
        if (body?.url) {
          const r = await fetch(body.url).catch(() => null);
          if (r?.ok) pdfBlob = await r.arrayBuffer();
        } else if (body?.pdf) {
          const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0));
          pdfBlob = bytes.buffer;
        }
      }
    }

    // Try approach 2: GET with ids param
    if (!pdfBlob) {
      const attempt2 = await fetch(
        `${ZR_BASE_URL}/get_bordereaux?token=${encodeURIComponent(token)}&ids=${encodeURIComponent(colisId)}`,
        { method: "GET" },
      ).catch(() => null);

      if (attempt2?.ok) {
        const ct = attempt2.headers.get("content-type") ?? "";
        if (ct.includes("application/pdf")) {
          pdfBlob = await attempt2.arrayBuffer();
        } else {
          const body = await attempt2.json().catch(() => null);
          if (body?.url) {
            const r = await fetch(body.url).catch(() => null);
            if (r?.ok) pdfBlob = await r.arrayBuffer();
          } else if (body?.pdf) {
            const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0));
            pdfBlob = bytes.buffer;
          }
        }
      }
    }

    // Try approach 3: POST with JSON body
    if (!pdfBlob) {
      const attempt3 = await fetch(`${ZR_BASE_URL}/get_bordereaux`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ids: [colisId] }),
      }).catch(() => null);

      if (attempt3?.ok) {
        const ct = attempt3.headers.get("content-type") ?? "";
        if (ct.includes("application/pdf")) {
          pdfBlob = await attempt3.arrayBuffer();
        } else {
          const body = await attempt3.json().catch(() => null);
          if (body?.url) {
            const r = await fetch(body.url).catch(() => null);
            if (r?.ok) pdfBlob = await r.arrayBuffer();
          } else if (body?.pdf) {
            const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0));
            pdfBlob = bytes.buffer;
          }
        }
      }
    }

    if (!pdfBlob) {
      return new Response(JSON.stringify({ error: "Could not fetch bordereau from ZR Express" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return the PDF directly
    return new Response(pdfBlob, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bordereau-${colisId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("get-bordereau error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
