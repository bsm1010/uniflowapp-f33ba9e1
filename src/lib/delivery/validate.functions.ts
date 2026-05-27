import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { ZRExpressAdapter } from "./adapters/ZRExpressAdapter";
import { YalidineAdapter } from "./adapters/YalidineAdapter";
import { normalizeProviderKey } from "./registry";

const InputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  companyId: z.string().uuid(),
  apiKey: z.string().min(1).max(512),
  apiSecret: z.string().max(512).optional().default(""),
  setDefault: z.boolean().optional().default(false),
});

export type ValidateAndActivateResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

/**
 * Server-side validation + persistence flow:
 *   1. Authenticate the caller from their current session token.
 *   2. Look up the company by id (must be active).
 *   3. Run an authenticated test request against the provider.
 *   4. Only on success — upsert credentials and mark `enabled = true`.
 */
export const validateAndActivateDeliveryCompany = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<ValidateAndActivateResult> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }

      const { client: supabase, userId } = auth;

      const { data: company, error: companyErr } = await supabase
        .from("delivery_companies")
        .select("id, name, is_active")
        .eq("id", data.companyId)
        .maybeSingle();

      if (companyErr || !company) {
        return { ok: false, message: "Delivery company not found." };
      }
      if (!company.is_active) {
        return { ok: false, message: "This delivery company is not available." };
      }

      // Real provider validation: hit the carrier's auth endpoint with the
      // pasted credentials. For ZR Express this is `/token`, for Yalidine
      // a lightweight authenticated GET.
      const apiKey = data.apiKey.trim();
      const apiSecret = data.apiSecret.trim();
      const provider = normalizeProviderKey(company.name);

      let validation: { ok: boolean; message: string };
      if (provider === "zr_express" || provider === "zrexpress") {
        if (!apiSecret) {
          return {
            ok: false,
            message: "ZR Express requires both secretKey and tenantId.",
          };
        }
        const adapter = new ZRExpressAdapter({ apiKey, apiSecret });
        validation = await adapter.validateCredentials();
      } else if (provider === "yalidine") {
        const adapter = new YalidineAdapter({ apiKey, apiSecret });
        validation = await adapter.validateCredentials();
      } else {
        // Unknown provider — trust the credentials so other carriers still work.
        validation = { ok: true, message: "Credentials saved." };
      }

      if (!validation.ok) {
        return { ok: false, message: validation.message };
      }

      if (data.setDefault) {
        await supabase
          .from("store_delivery_companies")
          .update({ is_default: false })
          .eq("store_id", userId)
          .neq("company_id", data.companyId);
      }

      const { error: upsertErr } = await supabase
        .from("store_delivery_companies")
        .upsert(
          {
            store_id: userId,
            company_id: data.companyId,
            api_key: apiKey,
            api_secret: apiSecret,
            enabled: true,
            is_default: data.setDefault ?? false,
          },
          { onConflict: "store_id,company_id" },
        );

      if (upsertErr) {
        return { ok: false, message: `Validated but failed to persist: ${upsertErr.message}` };
      }

      return { ok: true, message: validation.message };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected server error.";
      console.error(`[validateAndActivateDeliveryCompany] ${msg}`);
      return { ok: false, message: msg };
    }
  });
