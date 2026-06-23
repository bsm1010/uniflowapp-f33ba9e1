import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeProviderKey } from "./registry";

const ZR_BASE_URL = "https://api.zrexpress.app/api/v1";

const InputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  colisId: z.string().min(1).max(512),
});

export type FetchBordereauResult =
  | { ok: true; pdfBase64: string }
  | { ok: false; message: string };

/**
 * Server-side proxy for ZR Express bordereau (shipping label PDF).
 * Runs on the TanStack Start server — no CORS issues.
 */
export const fetchBordereau = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<FetchBordereauResult> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }
      const { client: supabase, userId } = auth;

      // Find ZR Express company
      const { data: companies } = await supabase
        .from("delivery_companies")
        .select("id, name");
      const zr = (companies ?? []).find(
        (c) => normalizeProviderKey(c.name) === "zr_express",
      );
      if (!zr) {
        return { ok: false, message: "ZR Express is not configured." };
      }

      // Get credentials
      const { data: link } = await supabaseAdmin
        .from("store_delivery_companies")
        .select("api_key")
        .eq("store_id", userId)
        .eq("company_id", zr.id)
        .maybeSingle();

      const token = link?.api_key ?? "";
      if (!token) {
        return { ok: false, message: "ZR Express API key not configured." };
      }

      console.log(`[fetchBordereau] colisId: ${data.colisId}, token length: ${token.length}, token prefix: ${token.slice(0, 8)}`);

      // Try 5 approaches server-side (no CORS)
      // 1. GET ?token=...&id=...
      // 2. GET ?token=...&ids=...
      // 3. POST { token, ids: [...] }
      // 4. GET with token in Authorization header
      // 5. GET with token in "token" header
      const attempts: Array<{ label: string; fn: () => Promise<Response> }> = [
        {
          label: "GET ?id (token in query)",
          fn: () =>
            fetch(
              `${ZR_BASE_URL}/get_bordereaux?token=${encodeURIComponent(token)}&id=${encodeURIComponent(data.colisId)}`,
              { method: "GET", headers: { Accept: "application/json" } },
            ),
        },
        {
          label: "GET ?ids (token in query)",
          fn: () =>
            fetch(
              `${ZR_BASE_URL}/get_bordereaux?token=${encodeURIComponent(token)}&ids=${encodeURIComponent(data.colisId)}`,
              { method: "GET", headers: { Accept: "application/json" } },
            ),
        },
        {
          label: "POST body (token in body)",
          fn: () =>
            fetch(`${ZR_BASE_URL}/get_bordereaux`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Accept: "application/json" },
              body: JSON.stringify({ token, ids: [data.colisId] }),
            }),
        },
        {
          label: "GET (token in Authorization header)",
          fn: () =>
            fetch(`${ZR_BASE_URL}/get_bordereaux?ids=${encodeURIComponent(data.colisId)}`, {
              method: "GET",
              headers: { Authorization: token, "Content-Type": "application/json", Accept: "application/json" },
            }),
        },
        {
          label: "GET (token in 'token' header)",
          fn: () =>
            fetch(`${ZR_BASE_URL}/get_bordereaux?ids=${encodeURIComponent(data.colisId)}`, {
              method: "GET",
              headers: { token, "Content-Type": "application/json", Accept: "application/json" },
            }),
        },
      ];

      for (const attempt of attempts) {
        try {
          console.log(`[fetchBordereau] Trying: ${attempt.label}`);
          const res = await attempt.fn();
          const rawText = await res.text();
          console.log(`[fetchBordereau] ${attempt.label} → status: ${res.status}, content-type: ${res.headers.get("content-type")}`);
          console.log(`[fetchBordereau] ${attempt.label} → body (first 500): ${rawText?.slice(0, 500)}`);

          if (res.ok) {
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/pdf")) {
              return { ok: true, pdfBase64: bufferToBase64(new TextEncoder().encode(rawText).buffer) };
            }

            const body = rawText ? JSON.parse(rawText) : null;
            if (body) {
              const pdf = extractPDFBase64(body);
              if (pdf) return { ok: true, pdfBase64: pdf };

              const url = pickStr(body, ["url", "pdf", "pdfUrl", "bordereauUrl", "labelUrl", "fileUrl"]);
              if (url?.startsWith("http")) {
                const pdfRes = await fetch(url);
                if (pdfRes.ok) {
                  const buf = await pdfRes.arrayBuffer();
                  return { ok: true, pdfBase64: bufferToBase64(buf) };
                }
              }

              const items = Array.isArray(body.data) ? body.data : Array.isArray(body.items) ? body.items : null;
              if (items?.length > 0) {
                const first = items[0] as Record<string, unknown>;
                const nestedB64 = pickStr(first, ["base64", "data", "content"]);
                if (nestedB64 && nestedB64.length > 100) {
                  return { ok: true, pdfBase64: nestedB64.includes(",") ? nestedB64.split(",")[1] : nestedB64 };
                }
                const nestedUrl = pickStr(first, ["url", "pdf", "pdfUrl"]);
                if (nestedUrl?.startsWith("http")) {
                  const pdfRes = await fetch(nestedUrl);
                  if (pdfRes.ok) {
                    const buf = await pdfRes.arrayBuffer();
                    return { ok: true, pdfBase64: bufferToBase64(buf) };
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error(`[fetchBordereau] ${attempt.label} error:`, err);
        }
      }

      console.error("[fetchBordereau] All attempts failed for colis:", data.colisId);
      return { ok: false, message: "ZR Express bordereau API returned no PDF for this colis." };
    } catch (e) {
      console.error("[fetchBordereau] Server error:", e);
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Bordereau fetch failed.",
      };
    }
  });

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function extractPDFBase64(body: Record<string, unknown>): string | null {
  const b64 = pickStr(body, ["base64", "data", "content", "pdfBase64", "file"]);
  if (b64 && b64.length > 100) {
    return b64.includes(",") ? b64.split(",")[1] : b64;
  }
  return null;
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
}
