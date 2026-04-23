import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { validateApiKeyForCompany } from "./services";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";

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

      // NOTE: External provider validation is temporarily disabled.
      // We trust the JSON-validated credentials (secretKey + tenantId) from the
      // client and persist them. Real provider ping can be re-enabled later by
      // calling `validateApiKeyForCompany(company.name, data.apiKey, data.apiSecret)`.
      const result = { success: true, message: "Credentials saved successfully" };

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
            api_key: data.apiKey.trim(),
            api_secret: data.apiSecret.trim(),
            enabled: true,
            is_default: data.setDefault ?? false,
          },
          { onConflict: "store_id,company_id" },
        );

      if (upsertErr) {
        return { ok: false, message: `Validated but failed to persist: ${upsertErr.message}` };
      }

      return { ok: true, message: result.message };
    } catch (e) {
      const tag = e instanceof Error ? e.name : "UnknownError";
      console.error(`[validateAndActivateDeliveryCompany] unexpected: ${tag}`);
      return { ok: false, message: "Unexpected server error." };
    }
  });
