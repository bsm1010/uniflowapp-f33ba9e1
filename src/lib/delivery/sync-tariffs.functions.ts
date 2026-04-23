import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { fetchZRTariffs } from "./services/ZRExpressTariffsService";
import { normalizeProviderKey } from "./registry";

const InputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  companyId: z.string().uuid(),
});

export type SyncTariffsResult =
  | { ok: true; message: string; created: number; updated: number; total: number }
  | { ok: false; message: string };

/**
 * Pull tariffs from the connected delivery provider and reconcile them with
 * `delivery_tariffs` for the current store. Existing rows (matched on
 * store_id + company_id + wilaya + city + delivery_type) get UPDATEd; new
 * combinations are INSERTed. Nothing is deleted — manual rows for unrelated
 * companies are left alone.
 */
export const syncDeliveryCompanyTariffs = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<SyncTariffsResult> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }
      const { client: supabase, userId } = auth;

      // 1. Resolve company + per-store credentials.
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

      const { data: link, error: linkErr } = await supabase
        .from("store_delivery_companies")
        .select("api_key, api_secret, enabled")
        .eq("store_id", userId)
        .eq("company_id", data.companyId)
        .maybeSingle();
      if (linkErr || !link) {
        return { ok: false, message: "Connect this delivery company first." };
      }
      if (!link.enabled) {
        return { ok: false, message: "This delivery company is disabled for your store." };
      }
      if (!link.api_key?.trim() || !link.api_secret?.trim()) {
        return { ok: false, message: "Missing API credentials for this provider." };
      }

      // 2. Fetch tariffs from the provider (only ZR Express is supported today).
      const provider = normalizeProviderKey(company.name);
      if (provider !== "zr_express" && provider !== "zrexpress") {
        return {
          ok: false,
          message: `Automatic tariff sync is not supported for ${company.name} yet.`,
        };
      }

      const fetched = await fetchZRTariffs(link.api_key, link.api_secret);
      if (!fetched.success) {
        return { ok: false, message: fetched.message };
      }
      if (fetched.tariffs.length === 0) {
        return {
          ok: true,
          message: "Provider returned no tariffs to sync.",
          created: 0,
          updated: 0,
          total: 0,
        };
      }

      // 3. Load existing rows for this store + company once, build a lookup.
      const { data: existing, error: existingErr } = await supabase
        .from("delivery_tariffs")
        .select("id, wilaya, city, delivery_type, price")
        .eq("store_id", userId)
        .eq("company_id", data.companyId);
      if (existingErr) {
        return { ok: false, message: `Failed to read tariffs: ${existingErr.message}` };
      }

      const keyOf = (w: string, c: string, t: string) =>
        `${w.trim().toLowerCase()}|${(c ?? "").trim().toLowerCase()}|${t.trim().toLowerCase()}`;

      const existingMap = new Map<string, { id: string; price: number }>();
      for (const row of existing ?? []) {
        existingMap.set(keyOf(row.wilaya, row.city ?? "", row.delivery_type), {
          id: row.id,
          price: Number(row.price),
        });
      }

      // 4. Reconcile: update changed rows, insert new ones in one batch.
      const toInsert: Array<{
        store_id: string;
        company_id: string;
        wilaya: string;
        city: string;
        delivery_type: string;
        price: number;
      }> = [];
      let updated = 0;

      for (const t of fetched.tariffs) {
        const k = keyOf(t.wilaya, t.city, t.delivery_type);
        const hit = existingMap.get(k);
        if (hit) {
          if (hit.price !== t.price) {
            const { error: upErr } = await supabase
              .from("delivery_tariffs")
              .update({ price: t.price })
              .eq("id", hit.id);
            if (!upErr) updated += 1;
          }
        } else {
          toInsert.push({
            store_id: userId,
            company_id: data.companyId,
            wilaya: t.wilaya,
            city: t.city,
            delivery_type: t.delivery_type,
            price: t.price,
          });
        }
      }

      let created = 0;
      if (toInsert.length > 0) {
        const { error: insErr, count } = await supabase
          .from("delivery_tariffs")
          .insert(toInsert, { count: "exact" });
        if (insErr) {
          return { ok: false, message: `Failed to insert tariffs: ${insErr.message}` };
        }
        created = count ?? toInsert.length;
      }

      return {
        ok: true,
        message: `Synced ${fetched.tariffs.length} tariffs (${created} created, ${updated} updated).`,
        created,
        updated,
        total: fetched.tariffs.length,
      };
    } catch (e) {
      const tag = e instanceof Error ? e.name : "UnknownError";
      console.error(`[syncDeliveryCompanyTariffs] unexpected: ${tag}`);
      return { ok: false, message: "Unexpected server error." };
    }
  });
