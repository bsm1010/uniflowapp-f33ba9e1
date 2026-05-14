import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchZRTariffs } from "@/lib/delivery/services/ZRExpressTariffsService";
import { normalizeProviderKey } from "@/lib/delivery/registry";

/**
 * Daily cron endpoint: refreshes ZR Express tariffs for every store that has
 * the provider connected. On failure for any single store we keep the last
 * saved tariffs untouched and surface a warning in the response payload.
 */
export const Route = createFileRoute("/api/public/hooks/sync-tariffs")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Verify cron secret — block when secret is unset OR header mismatches.
        const cronSecret = process.env.CRON_SECRET;
        if (!cronSecret || request.headers.get("x-cron-secret") !== cronSecret) {
          return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
        }

        const startedAt = new Date().toISOString();

        // 1. Find all ZR Express companies.
        const { data: companies, error: companiesErr } = await supabaseAdmin
          .from("delivery_companies")
          .select("id, name, is_active")
          .eq("is_active", true);

        if (companiesErr) {
          return Response.json(
            { ok: false, error: `Failed to load companies: ${companiesErr.message}` },
            { status: 500 },
          );
        }

        const zrCompanies = (companies ?? []).filter((c) => {
          const k = normalizeProviderKey(c.name);
          return k === "zr_express" || k === "zrexpress";
        });

        if (zrCompanies.length === 0) {
          return Response.json({
            ok: true,
            startedAt,
            message: "No ZR Express companies configured.",
            stores: [],
          });
        }

        const companyIds = zrCompanies.map((c) => c.id);

        // 2. Find all enabled store connections for these companies.
        const { data: links, error: linksErr } = await supabaseAdmin
          .from("store_delivery_companies")
          .select("store_id, company_id, api_key, api_secret, enabled")
          .in("company_id", companyIds)
          .eq("enabled", true);

        if (linksErr) {
          return Response.json(
            { ok: false, error: `Failed to load store links: ${linksErr.message}` },
            { status: 500 },
          );
        }

        const results: Array<{
          store_id: string;
          company_id: string;
          ok: boolean;
          message: string;
          created?: number;
          updated?: number;
        }> = [];

        for (const link of links ?? []) {
          if (!link.api_key?.trim() || !link.api_secret?.trim()) {
            results.push({
              store_id: link.store_id,
              company_id: link.company_id,
              ok: false,
              message: "Missing credentials — kept last saved tariffs.",
            });
            continue;
          }

          const fetched = await fetchZRTariffs(link.api_key, link.api_secret);
          if (!fetched.success) {
            // Keep last saved tariffs untouched; just record the warning.
            results.push({
              store_id: link.store_id,
              company_id: link.company_id,
              ok: false,
              message: `Could not refresh tariffs: ${fetched.message}`,
            });
            continue;
          }
          if (fetched.tariffs.length === 0) {
            results.push({
              store_id: link.store_id,
              company_id: link.company_id,
              ok: true,
              message: "Provider returned no tariffs.",
              created: 0,
              updated: 0,
            });
            continue;
          }

          // Reconcile against existing rows.
          const { data: existing, error: existingErr } = await supabaseAdmin
            .from("delivery_tariffs")
            .select("id, wilaya, city, delivery_type, price")
            .eq("store_id", link.store_id)
            .eq("company_id", link.company_id);

          if (existingErr) {
            results.push({
              store_id: link.store_id,
              company_id: link.company_id,
              ok: false,
              message: `Could not refresh tariffs: ${existingErr.message}`,
            });
            continue;
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
                const { error: upErr } = await supabaseAdmin
                  .from("delivery_tariffs")
                  .update({ price: t.price })
                  .eq("id", hit.id);
                if (!upErr) updated += 1;
              }
            } else {
              toInsert.push({
                store_id: link.store_id,
                company_id: link.company_id,
                wilaya: t.wilaya,
                city: t.city,
                delivery_type: t.delivery_type,
                price: t.price,
              });
            }
          }

          let created = 0;
          if (toInsert.length > 0) {
            const { error: insErr, count } = await supabaseAdmin
              .from("delivery_tariffs")
              .insert(toInsert, { count: "exact" });
            if (insErr) {
              results.push({
                store_id: link.store_id,
                company_id: link.company_id,
                ok: false,
                message: `Could not refresh tariffs: ${insErr.message}`,
              });
              continue;
            }
            created = count ?? toInsert.length;
          }

          results.push({
            store_id: link.store_id,
            company_id: link.company_id,
            ok: true,
            message: `Synced ${fetched.tariffs.length} tariffs.`,
            created,
            updated,
          });

          // Notify the store owner if anything changed.
          if (created > 0 || updated > 0) {
            await supabaseAdmin.from("notifications").insert({
              user_id: link.store_id,
              title: "Tariffs refreshed",
              message: `Daily sync updated your delivery tariffs (${created} new, ${updated} changed).`,
              type: "info",
            });
          }
        }

        // Warn store owners whose sync failed (one notification per store per run).
        const failedStores = new Set<string>();
        for (const r of results) {
          if (!r.ok) failedStores.add(r.store_id);
        }
        for (const storeId of failedStores) {
          await supabaseAdmin.from("notifications").insert({
            user_id: storeId,
            title: "Could not refresh tariffs",
            message:
              "We kept your last saved tariffs. The delivery provider was unreachable during the last sync.",
            type: "warning",
          });
        }

        return Response.json({
          ok: true,
          startedAt,
          finishedAt: new Date().toISOString(),
          stores: results,
        });
      },
    },
  },
});
