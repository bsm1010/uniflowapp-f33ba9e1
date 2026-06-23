import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAdapterCtor, normalizeProviderKey } from "./registry";

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
 * The ZR Express API blocks browser-origin CORS requests, so this
 * function runs on the server where CORS doesn't apply.
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

      // Get credentials from store_delivery_companies
      const { data: link } = await supabaseAdmin
        .from("store_delivery_companies")
        .select("api_key, api_secret")
        .eq("store_id", userId)
        .eq("company_id", zr.id)
        .maybeSingle();

      if (!link?.api_key?.trim()) {
        return { ok: false, message: "ZR Express API key not configured." };
      }

      const token = link.api_key.trim();

      // Try 3 approaches to fetch the bordereau, same as the client-side adapter
      const attempts = [
        () =>
          fetch(
            `${ZR_BASE_URL}/get_bordereaux?token=${encodeURIComponent(token)}&id=${encodeURIComponent(data.colisId)}`,
            { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
          ),
        () =>
          fetch(
            `${ZR_BASE_URL}/get_bordereaux?token=${encodeURIComponent(token)}&ids=${encodeURIComponent(data.colisId)}`,
            { method: "GET", headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
          ),
        () =>
          fetch(`${ZR_BASE_URL}/get_bordereaux`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ token, ids: [data.colisId] }),
          }),
      ];

      for (let i = 0; i < attempts.length; i++) {
        try {
          console.log(`[fetchBordereau] Server attempt ${i + 1} for colis:`, data.colisId);
          const res = await attempts[i]();
          const ct = res.headers.get("content-type") || "";
          console.log(`[fetchBordereau] Response ${i + 1}:`, res.status, ct);

          if (res.ok && ct.includes("application/pdf")) {
            const buf = await res.arrayBuffer();
            const base64 = bufferToBase64(buf);
            return { ok: true, pdfBase64: base64 };
          }

          if (res.ok) {
            const body = await res.json().catch(() => null);
            if (body) {
              const pdf = extractPDFBase64(body);
              if (pdf) return { ok: true, pdfBase64: pdf };

              // Check for nested URL and fetch it
              const url = pickStr(body, ["url", "pdf", "pdfUrl", "bordereauUrl", "labelUrl", "fileUrl"]);
              if (url?.startsWith("http")) {
                const pdfRes = await fetch(url);
                if (pdfRes.ok) {
                  const buf = await pdfRes.arrayBuffer();
                  return { ok: true, pdfBase64: bufferToBase64(buf) };
                }
              }

              // Check nested data array
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
          console.error(`[fetchBordereau] Attempt ${i + 1} error:`, err);
        }
      }

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
