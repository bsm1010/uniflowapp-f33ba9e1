import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Debug: check Supabase Edge Function logs at
// Dashboard → Edge Functions → get-bordereau → Logs
// to see console.log output showing raw ZR Express responses.

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

    console.log("[get-bordereau] Request:", { colisId, storeId });

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

    console.log("[get-bordereau] Token length:", token.length, "token prefix:", token.slice(0, 8));

    // ZR Express / Procolis base URL
    const ZR_BASE_URL = "https://api.zrexpress.app/api/v1";

    let pdfBlob: ArrayBuffer | null = null;

    // Attempt 1: GET with token as query param + id
    try {
      const url = `${ZR_BASE_URL}/get_bordereaux?token=${encodeURIComponent(token)}&id=${encodeURIComponent(colisId)}`;
      console.log("[get-bordereau] Attempt 1 (GET ?id):", url);
      const res = await fetch(url, { method: "GET" });
      const rawText = await res.text();
      console.log("[get-bordereau] Attempt 1 status:", res.status);
      console.log("[get-bordereau] Attempt 1 content-type:", res.headers.get("content-type"));
      console.log("[get-bordereau] Attempt 1 raw body (first 500):", rawText?.slice(0, 500));

      if (res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/pdf")) {
          const bytes = Uint8Array.from(rawText, (c) => c.charCodeAt(0));
          pdfBlob = bytes.buffer;
        } else {
          const body = rawText ? JSON.parse(rawText) : null;
          if (body?.url) {
            const r = await fetch(body.url).catch(() => null);
            if (r?.ok) pdfBlob = await r.arrayBuffer();
          } else if (body?.pdf) {
            const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0));
            pdfBlob = bytes.buffer;
          }
        }
      }
    } catch (e) {
      console.error("[get-bordereau] Attempt 1 error:", e);
    }

    // Attempt 2: GET with token as query param + ids
    if (!pdfBlob) {
      try {
        const url = `${ZR_BASE_URL}/get_bordereaux?token=${encodeURIComponent(token)}&ids=${encodeURIComponent(colisId)}`;
        console.log("[get-bordereau] Attempt 2 (GET ?ids):", url);
        const res = await fetch(url, { method: "GET" });
        const rawText = await res.text();
        console.log("[get-bordereau] Attempt 2 status:", res.status);
        console.log("[get-bordereau] Attempt 2 content-type:", res.headers.get("content-type"));
        console.log("[get-bordereau] Attempt 2 raw body (first 500):", rawText?.slice(0, 500));

        if (res.ok) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/pdf")) {
            const bytes = Uint8Array.from(rawText, (c) => c.charCodeAt(0));
            pdfBlob = bytes.buffer;
          } else {
            const body = rawText ? JSON.parse(rawText) : null;
            if (body?.url) {
              const r = await fetch(body.url).catch(() => null);
              if (r?.ok) pdfBlob = await r.arrayBuffer();
            } else if (body?.pdf) {
              const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0));
              pdfBlob = bytes.buffer;
            }
          }
        }
      } catch (e) {
        console.error("[get-bordereau] Attempt 2 error:", e);
      }
    }

    // Attempt 3: POST with JSON body
    if (!pdfBlob) {
      try {
        const url = `${ZR_BASE_URL}/get_bordereaux`;
        console.log("[get-bordereau] Attempt 3 (POST):", url);
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ids: [colisId] }),
        });
        const rawText = await res.text();
        console.log("[get-bordereau] Attempt 3 status:", res.status);
        console.log("[get-bordereau] Attempt 3 content-type:", res.headers.get("content-type"));
        console.log("[get-bordereau] Attempt 3 raw body (first 500):", rawText?.slice(0, 500));

        if (res.ok) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/pdf")) {
            const bytes = Uint8Array.from(rawText, (c) => c.charCodeAt(0));
            pdfBlob = bytes.buffer;
          } else {
            const body = rawText ? JSON.parse(rawText) : null;
            if (body?.url) {
              const r = await fetch(body.url).catch(() => null);
              if (r?.ok) pdfBlob = await r.arrayBuffer();
            } else if (body?.pdf) {
              const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0));
              pdfBlob = bytes.buffer;
            }
          }
        }
      } catch (e) {
        console.error("[get-bordereau] Attempt 3 error:", e);
      }
    }

    // Attempt 4: GET with token in Authorization header
    if (!pdfBlob) {
      try {
        const url = `${ZR_BASE_URL}/get_bordereaux?ids=${encodeURIComponent(colisId)}`;
        console.log("[get-bordereau] Attempt 4 (GET header):", url);
        const res = await fetch(url, {
          method: "GET",
          headers: { "Authorization": token, "Content-Type": "application/json" },
        });
        const rawText = await res.text();
        console.log("[get-bordereau] Attempt 4 status:", res.status);
        console.log("[get-bordereau] Attempt 4 content-type:", res.headers.get("content-type"));
        console.log("[get-bordereau] Attempt 4 raw body (first 500):", rawText?.slice(0, 500));

        if (res.ok) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/pdf")) {
            const bytes = Uint8Array.from(rawText, (c) => c.charCodeAt(0));
            pdfBlob = bytes.buffer;
          } else {
            const body = rawText ? JSON.parse(rawText) : null;
            if (body?.url) {
              const r = await fetch(body.url).catch(() => null);
              if (r?.ok) pdfBlob = await r.arrayBuffer();
            } else if (body?.pdf) {
              const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0));
              pdfBlob = bytes.buffer;
            }
          }
        }
      } catch (e) {
        console.error("[get-bordereau] Attempt 4 error:", e);
      }
    }

    // Attempt 5: GET with token in "token" header
    if (!pdfBlob) {
      try {
        const url = `${ZR_BASE_URL}/get_bordereaux?ids=${encodeURIComponent(colisId)}`;
        console.log("[get-bordereau] Attempt 5 (token header):", url);
        const res = await fetch(url, {
          method: "GET",
          headers: { "token": token, "Content-Type": "application/json" },
        });
        const rawText = await res.text();
        console.log("[get-bordereau] Attempt 5 status:", res.status);
        console.log("[get-bordereau] Attempt 5 content-type:", res.headers.get("content-type"));
        console.log("[get-bordereau] Attempt 5 raw body (first 500):", rawText?.slice(0, 500));

        if (res.ok) {
          const ct = res.headers.get("content-type") ?? "";
          if (ct.includes("application/pdf")) {
            const bytes = Uint8Array.from(rawText, (c) => c.charCodeAt(0));
            pdfBlob = bytes.buffer;
          } else {
            const body = rawText ? JSON.parse(rawText) : null;
            if (body?.url) {
              const r = await fetch(body.url).catch(() => null);
              if (r?.ok) pdfBlob = await r.arrayBuffer();
            } else if (body?.pdf) {
              const bytes = Uint8Array.from(atob(body.pdf), (c) => c.charCodeAt(0));
              pdfBlob = bytes.buffer;
            }
          }
        }
      } catch (e) {
        console.error("[get-bordereau] Attempt 5 error:", e);
      }
    }

    if (!pdfBlob) {
      console.error("[get-bordereau] All 5 attempts failed for colis:", colisId);
      return new Response(JSON.stringify({ error: "Could not fetch bordereau from ZR Express" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[get-bordereau] Success! PDF size:", pdfBlob.byteLength);
    return new Response(pdfBlob, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bordereau-${colisId}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[get-bordereau] Fatal error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
