import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
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

const PER_REQUEST_TIMEOUT_MS = 12_000;

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

      const { data: companies } = await supabase
        .from("delivery_companies")
        .select("id, name");
      const zr = (companies ?? []).find(
        (c) => normalizeProviderKey(c.name) === "zr_express",
      );
      if (!zr) {
        return { ok: false, notConnected: true, message: "ZRExpress is not configured." };
      }

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

      // Chain the incoming request's abort signal so a hung outbound socket
      // doesn't outlive a client disconnect or a Worker shutdown.
      const requestSignal = (() => {
        try {
          return getRequest()?.signal ?? undefined;
        } catch {
          return undefined;
        }
      })();
      const isDev = import.meta.env.DEV;

      const probe = async (path: string) => {
        const url = `${ZR_BASE_URL}/${path}`;
        const controller = new AbortController();
        const linked = requestSignal
          ? AbortSignal.any([controller.signal, requestSignal])
          : controller.signal;
        const timer = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);
        try {
          const res = await fetch(url, {
            method: "GET",
            headers,
            signal: linked,
          });
          const text = await res.text();
          return { path, url, res, text };
        } finally {
          clearTimeout(timer);
        }
      };

      // Fire all candidate endpoints in parallel. The first one to return a
      // parseable balance wins; the others are aborted when their fetch
      // resolves/rejects (Workers close the connection on read end).
      const probes = await Promise.allSettled(BALANCE_ENDPOINTS.map(probe));
      const attempts: string[] = [];
      let lastMessage = "ZRExpress balance endpoint not found.";

      for (const p of probes) {
        if (p.status === "rejected") {
          const reason =
            p.reason instanceof Error ? p.reason.message : String(p.reason);
          attempts.push(`network error (${reason})`);
          lastMessage = `ZRExpress request failed: ${reason}`;
          if (isDev) console.log(`[ZR Balance] network error: ${reason}`);
          continue;
        }
        const { path, url, res, text } = p.value;
        if (isDev) {
          console.log(
            `[ZR Balance] ${url} -> ${res.status} ${res.statusText} :: ${text.slice(0, 2000)}`,
          );
        }
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
        const inner =
          (obj.data && typeof obj.data === "object"
            ? (obj.data as Record<string, unknown>)
            : obj) ?? {};
        const readyBalance = pickNum(inner, BALANCE_KEYS);
        if (Number.isFinite(readyBalance)) {
          if (isDev) {
            console.log(
              `[ZR Balance] resolved on ${path} -> readyBalance=${readyBalance}`,
            );
          }
          return { ok: true, readyBalance, currency: "DA" };
        }
        attempts.push(`${path}: no known balance field in body`);
        lastMessage = `ZRExpress ${path} did not include a known balance field.`;
      }

      if (isDev) {
        console.log(
          `[ZR Balance] all endpoints failed. Attempts: ${attempts.join(" | ")}`,
        );
      }
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
