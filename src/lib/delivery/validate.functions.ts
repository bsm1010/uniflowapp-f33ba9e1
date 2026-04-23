import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAdapterCtor } from "./registry";

const InputSchema = z.object({
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
 *   1. Look up the company by id (must be active).
 *   2. Resolve its adapter from the registry.
 *   3. Run an authenticated test request against the provider.
 *   4. Only on success — upsert credentials and mark `enabled = true`.
 *
 * Credentials never round-trip through the client beyond the form input;
 * validation happens on the server so the provider hostname/keys are not
 * exposed to the browser network panel of unrelated visitors.
 */
export const validateAndActivateDeliveryCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }): Promise<ValidateAndActivateResult> => {
    const { supabase, userId } = context;

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

    const Ctor = getAdapterCtor(company.name);
    if (!Ctor) {
      return { ok: false, message: `No adapter registered for ${company.name}.` };
    }

    const adapter = new Ctor({
      apiKey: data.apiKey.trim(),
      apiSecret: data.apiSecret.trim(),
    });

    const result = await adapter.validateCredentials();
    if (!result.ok) {
      // Do NOT persist credentials or activate.
      return { ok: false, message: result.message };
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
          api_key: data.apiKey.trim(),
          api_secret: data.apiSecret.trim(),
          enabled: true,
          is_default: data.setDefault ?? false,
        },
        { onConflict: "store_id,company_id" },
      );

    if (upsertErr) {
      return { ok: false, message: `Saved validation but failed to persist: ${upsertErr.message}` };
    }

    return { ok: true, message: result.message };
  });
