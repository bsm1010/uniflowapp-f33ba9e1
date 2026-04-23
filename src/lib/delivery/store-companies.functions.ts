import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";

/**
 * Secrets-safe data layer for `store_delivery_companies`.
 *
 * The browser must never see raw `api_key` / `api_secret` values. These server
 * functions return only what the dashboard needs to render: existence flag and
 * a short masked tail (last 4 chars). Toggling enabled/default also runs
 * server-side so the client never has to round-trip stored credentials.
 */

export type StoreCompanyView = {
  company_id: string;
  enabled: boolean;
  is_default: boolean;
  has_key: boolean;
  has_secret: boolean;
  key_tail: string; // last up-to-4 chars, "" when no key set
};

function tail(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(-4);
}

const AccessTokenInput = z.object({ accessToken: z.string().min(1).max(4096) });

/** List the caller's store delivery company rows in a secrets-safe shape. */
export const listStoreDeliveryCompanies = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => AccessTokenInput.parse(input))
  .handler(async ({ data }): Promise<{ rows: StoreCompanyView[] }> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { rows: [] };
      }

      const { client: supabase, userId } = auth;
      const { data: rowsData, error } = await supabase
        .from("store_delivery_companies")
        .select("company_id, enabled, is_default, api_key, api_secret")
        .eq("store_id", userId);

      if (error) {
        console.error("[listStoreDeliveryCompanies] query error:", error.message);
        return { rows: [] };
      }

      const rows: StoreCompanyView[] = (rowsData ?? []).map((r) => ({
        company_id: r.company_id,
        enabled: !!r.enabled,
        is_default: !!r.is_default,
        has_key: !!(r.api_key && r.api_key.trim()),
        has_secret: !!(r.api_secret && r.api_secret.trim()),
        key_tail: tail(r.api_key),
      }));
      return { rows };
    } catch (e) {
      console.error(
        "[listStoreDeliveryCompanies] unexpected:",
        e instanceof Error ? e.message : "unknown",
      );
      return { rows: [] };
    }
  });

const ToggleEnabledInput = z.object({
  accessToken: z.string().min(1).max(4096),
  companyId: z.string().uuid(),
  enabled: z.boolean(),
});

/**
 * Disable a company without round-tripping credentials, or re-enable a company
 * that already has a stored key. Re-enabling without a stored key is rejected
 * — the user must run the validate flow first.
 */
export const setStoreDeliveryCompanyEnabled = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ToggleEnabledInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }

      const { client: supabase, userId } = auth;
      const { data: row, error } = await supabase
        .from("store_delivery_companies")
        .select("api_key")
        .eq("store_id", userId)
        .eq("company_id", data.companyId)
        .maybeSingle();

      if (error) {
        return { ok: false, message: "Could not load carrier." };
      }

      if (data.enabled && !(row?.api_key && row.api_key.trim())) {
        return {
          ok: false,
          message: "Validate an API key before enabling this carrier.",
        };
      }

      const { error: updErr } = await supabase
        .from("store_delivery_companies")
        .update({
          enabled: data.enabled,
          ...(data.enabled ? {} : { is_default: false }),
        })
        .eq("store_id", userId)
        .eq("company_id", data.companyId);

      if (updErr) return { ok: false, message: "Failed to update carrier." };
      return { ok: true, message: data.enabled ? "Enabled" : "Disabled" };
    } catch {
      return { ok: false, message: "Unexpected server error." };
    }
  });

const SetDefaultInput = z.object({
  accessToken: z.string().min(1).max(4096),
  companyId: z.string().uuid(),
});

/** Mark a single carrier as default — must already be enabled. */
export const setStoreDeliveryCompanyDefault = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SetDefaultInput.parse(input))
  .handler(async ({ data }): Promise<{ ok: boolean; message: string }> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }

      const { client: supabase, userId } = auth;

      const { data: row, error: rowErr } = await supabase
        .from("store_delivery_companies")
        .select("enabled")
        .eq("store_id", userId)
        .eq("company_id", data.companyId)
        .maybeSingle();

      if (rowErr || !row) return { ok: false, message: "Carrier not found." };
      if (!row.enabled) {
        return { ok: false, message: "Enable the carrier before setting it as default." };
      }

      await supabase
        .from("store_delivery_companies")
        .update({ is_default: false })
        .eq("store_id", userId)
        .neq("company_id", data.companyId);

      const { error: updErr } = await supabase
        .from("store_delivery_companies")
        .update({ is_default: true })
        .eq("store_id", userId)
        .eq("company_id", data.companyId);

      if (updErr) return { ok: false, message: "Failed to set default." };
      return { ok: true, message: "Default carrier updated." };
    } catch {
      return { ok: false, message: "Unexpected server error." };
    }
  });
