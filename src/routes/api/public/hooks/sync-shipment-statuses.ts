import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getAdapterCtor } from "@/lib/delivery/registry";

/**
 * Cron-driven shipment status sync.
 * Polls each active shipment against its delivery provider, updates the
 * shipment row, and mirrors a coarse status onto the parent order.
 *
 * Called by pg_cron with header `apikey: <anon>` per Lovable conventions.
 * Public-facing security: we accept any caller (the path is under
 * /api/public/*) but the route only does idempotent updates on rows that
 * already have a provider-assigned tracking number, so there's no PII leak
 * and no destructive surface.
 */
export const Route = createFileRoute("/api/public/hooks/sync-shipment-statuses")({
  server: {
    handlers: {
      POST: async () => {
        const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!SUPABASE_URL || !SERVICE_KEY) {
          return json({ ok: false, message: "Backend not configured." }, 500);
        }
        const admin = createClient(SUPABASE_URL, SERVICE_KEY);

        // Fetch active shipments — anything not in a terminal state.
        const { data: shipments, error } = await admin
          .from("shipments")
          .select("id, order_id, store_id, company_id, tracking_number, status")
          .in("status", ["pending", "created", "in_transit"])
          .neq("tracking_number", "")
          .limit(200);
        if (error) return json({ ok: false, message: error.message }, 500);
        if (!shipments || shipments.length === 0) {
          return json({ ok: true, message: "No active shipments.", processed: 0 });
        }

        // Cache company name + per-store creds to avoid N+1 lookups.
        const companyCache = new Map<string, { name: string } | null>();
        const credsCache = new Map<string, { apiKey: string; apiSecret: string } | null>();

        let updated = 0;
        let failed = 0;

        for (const s of shipments) {
          if (!s.company_id || !s.tracking_number) continue;

          let company = companyCache.get(s.company_id);
          if (company === undefined) {
            const { data: c } = await admin
              .from("delivery_companies")
              .select("name, is_active")
              .eq("id", s.company_id)
              .maybeSingle();
            company = c?.is_active ? { name: c.name } : null;
            companyCache.set(s.company_id, company);
          }
          if (!company) continue;

          const credsKey = `${s.store_id}:${s.company_id}`;
          let creds = credsCache.get(credsKey);
          if (creds === undefined) {
            const { data: link } = await admin
              .from("store_delivery_companies")
              .select("api_key, api_secret, enabled")
              .eq("store_id", s.store_id)
              .eq("company_id", s.company_id)
              .maybeSingle();
            creds =
              link?.enabled && link.api_key?.trim()
                ? {
                    apiKey: link.api_key.trim(),
                    apiSecret: (link.api_secret ?? "").trim(),
                  }
                : null;
            credsCache.set(credsKey, creds);
          }
          if (!creds) continue;

          const Ctor = getAdapterCtor(company.name);
          if (!Ctor) continue;
          const adapter = new Ctor(creds);

          try {
            const tracking = await adapter.trackShipment(s.tracking_number);
            const nextStatus = tracking.status;
            const now = new Date().toISOString();
            await admin
              .from("shipments")
              .update({
                status: nextStatus,
                last_sync_at: now,
                last_error: null,
              })
              .eq("id", s.id);

            // Mirror to order status for end-user visibility.
            const orderStatus = mapToOrderStatus(nextStatus);
            if (orderStatus) {
              await admin.from("orders").update({ status: orderStatus }).eq("id", s.order_id);
            }
            updated += 1;
          } catch (e) {
            failed += 1;
            const msg = e instanceof Error ? e.message : "Tracking lookup failed.";
            await admin
              .from("shipments")
              .update({ last_error: msg.slice(0, 1000), last_sync_at: new Date().toISOString() })
              .eq("id", s.id);
          }
        }

        return json({
          ok: true,
          message: `Synced ${updated} / ${shipments.length} shipments (${failed} failed).`,
          processed: shipments.length,
          updated,
          failed,
        });
      },
    },
  },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mapToOrderStatus(s: string): string | null {
  switch (s) {
    case "in_transit":
      return "shipped";
    case "delivered":
      return "delivered";
    case "cancelled":
    case "failed":
      return "cancelled";
    default:
      return null;
  }
}
