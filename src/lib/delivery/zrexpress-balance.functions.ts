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

const BALANCE_KEYS = [
  "totalAmountReadyToBePaid",
  "amountReadyToBePaid",
  "readyAmount",
  "readyBalance",
  "ready_balance",
  "soldePret",
  "solde_pret",
  "solde",
  "montant",
  "balance",
  "amount",
  "totalAmount",
  "pret",
];

const BALANCE_ENDPOINTS = [
  "supplier-payment/supplier-balance",
  "payments/balance",
  "supplier/balance",
];

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

      const headers = {
        Authorization: `Bearer ${apiKey}`,
        "X-Tenant": tenantId,
        "X-Api-Key": apiKey,
        Accept: "application/json",
      };

      // Try each candidate balance endpoint in order, log every raw response so
      // we can see exactly what the API returns, and stop on the first one
      // that gives us a parseable numeric balance.
      const attempts: string[] = [];
      let lastMessage = "ZRExpress balance endpoint not found.";

      for (const path of BALANCE_ENDPOINTS) {
        const url = `${ZR_BASE_URL}/${path}`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12_000);
        let res: Response;
        try {
          res = await fetch(url, { method: "GET", headers, signal: controller.signal });
        } catch (e) {
          const raw = e instanceof Error ? e.message : String(e);
          clearTimeout(timer);
          console.log(`[ZR Balance] ${url} -> network error: ${raw}`);
          attempts.push(`${path}: network error (${raw})`);
          lastMessage = `ZRExpress request failed: ${raw}`;
          continue;
        }
        clearTimeout(timer);

        const text = await res.text();
        console.log(
          `[ZR Balance] ${url} -> ${res.status} ${res.statusText} :: ${text.slice(0, 2000)}`,
        );

        if (!res.ok) {
          attempts.push(`${path}: HTTP ${res.status}`);
          lastMessage = `ZRExpress returned ${res.status} on ${path}: ${text.slice(0, 200) || res.statusText}`;
          continue;
        }

        let parsed: unknown = null;
        try {
          parsed = text ? JSON.parse(text) : null;
        } catch {
          attempts.push(`${path}: non-JSON body`);
          lastMessage = `ZRExpress ${path} returned a non-JSON response.`;
          continue;
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

        const readyBalance = pickNum(inner, BALANCE_KEYS);
        if (Number.isFinite(readyBalance)) {
          console.log(
            `[ZR Balance] resolved on ${path} -> readyBalance=${readyBalance}`,
          );
          return { ok: true, readyBalance, currency: "DA" };
        }
        attempts.push(`${path}: no known balance field in body`);
        lastMessage = `ZRExpress ${path} did not include a known balance field.`;
      }

      console.log(
        `[ZR Balance] all endpoints failed. Attempts: ${attempts.join(" | ")}`,
      );
      return { ok: false, message: lastMessage };
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
