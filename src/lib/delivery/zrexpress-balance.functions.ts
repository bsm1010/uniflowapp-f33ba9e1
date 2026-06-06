import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeProviderKey } from "./registry";

const ZR_BASE_URL = "https://api.zrexpress.app/api/v1";

const InputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
});

export type ZRExpressBalanceResult =
  | {
      ok: true;
      readyBalance: number;
      currency: "DA";
    }
  | {
      ok: false;
      message: string;
      notConnected?: boolean;
    };

/**
 * Fetch the current ZRExpress supplier balance for the authenticated user.
 * Returns the "Solde prêt" (ready-to-be-paid balance) and the currency (always DA).
 * If the user has not connected ZRExpress, returns `{ ok: false, notConnected: true }`
 * so the UI can hide the balance card.
 */
export const getZRExpressBalance = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ZRExpressBalanceResult> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }
      const { userId } = auth;
      const { client: supabase } = auth;

      // Resolve the ZRExpress company (matches the same pattern used by
      // import-zr-orders / track-shipment so we don't depend on a specific row id).
      const { data: companies } = await supabase
        .from("delivery_companies")
        .select("id, name");
      const zr = (companies ?? []).find(
        (c) => normalizeProviderKey(c.name) === "zr_express",
      );
      if (!zr) {
        return { ok: false, notConnected: true, message: "ZRExpress is not configured." };
      }

      // Pull the user's stored credentials for this provider.
      const { data: link } = await supabaseAdmin
        .from("store_delivery_companies")
        .select("api_key, api_secret, enabled")
        .eq("store_id", userId)
        .eq("company_id", zr.id)
        .maybeSingle();
      if (!link?.api_key?.trim()) {
        return { ok: false, notConnected: true, message: "Connect ZRExpress first." };
      }

      const apiKey = link.api_key.trim();
      const tenantId = (link.api_secret ?? "").trim();

      // GET /api/v1/supplier-payment/supplier-balance
      // Response shape:
      //   { totalAmountPaid, totalAmountReadyToBePaid, totalAmountNotCashed, totalAmountCashed }
      // "Solde prêt" === totalAmountReadyToBePaid.
      const url = `${ZR_BASE_URL}/supplier-payment/supplier-balance`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12_000);
      let res: Response;
      try {
        res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "X-Tenant": tenantId,
            "X-Api-Key": apiKey,
            Accept: "application/json",
          },
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }

      const text = await res.text();
      if (!res.ok) {
        return {
          ok: false,
          message: `ZRExpress returned ${res.status}: ${text.slice(0, 200) || res.statusText}`,
        };
      }

      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        return { ok: false, message: "ZRExpress returned a non-JSON balance response." };
      }
      const obj =
        parsed && typeof parsed === "object"
          ? (parsed as Record<string, unknown>)
          : {};
      // Accept either a flat object or a wrapped { data: ... } envelope.
      const inner =
        (obj.data && typeof obj.data === "object"
          ? (obj.data as Record<string, unknown>)
          : obj) ?? {};

      const readyBalance = pickNum(inner, [
        "totalAmountReadyToBePaid",
        "soldePret",
        "solde_pret",
        "readyBalance",
        "ready_balance",
      ]);

      if (!Number.isFinite(readyBalance)) {
        return {
          ok: false,
          message: "ZRExpress balance response did not include a ready-to-be-paid amount.",
        };
      }

      return { ok: true, readyBalance, currency: "DA" };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.toLowerCase().includes("aborted")) {
        return { ok: false, message: "ZRExpress API timed out. Try again." };
      }
      return { ok: false, message: `ZRExpress request failed: ${raw}` };
    }
  });

function pickNum(obj: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  }
  return Number.NaN;
}
