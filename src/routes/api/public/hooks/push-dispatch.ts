import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendWebPush } from "@/lib/push/web-push.server";

const PayloadSchema = z.object({
  notification_id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  message: z.string().min(0).max(2000).default(""),
  type: z.string().max(50).optional().default("info"),
  url: z.string().max(500).optional(),
});

// Map notification title prefix → preference flag.
function preferenceKeyFor(title: string): keyof PreferenceShape | null {
  const t = title.toLowerCase();
  if (t.includes("order received") || t.includes("new order")) return "new_order";
  if (t.includes("low stock") || t.includes("stock alert")) return "low_stock";
  if (t.includes("order") && (t.includes("status") || t.includes("tracking"))) return "order_status";
  if (t.includes("delivered") || t.includes("delivery") || t.includes("shipment")) return "delivery_update";
  if (t.includes("payment")) return "payment";
  return null;
}

interface PreferenceShape {
  new_order: boolean;
  low_stock: boolean;
  order_status: boolean;
  delivery_update: boolean;
  payment: boolean;
  sound_enabled: boolean;
}

export const Route = createFileRoute("/api/public/hooks/push-dispatch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: z.infer<typeof PayloadSchema>;
        try {
          payload = PayloadSchema.parse(await request.json());
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        // Auth: verify the notification_id exists in DB and matches user_id.
        // This prevents external abuse — only real notifications can trigger pushes.
        if (!payload.notification_id) {
          return new Response("Missing notification_id", { status: 400 });
        }
        const { data: notif } = await supabaseAdmin
          .from("notifications")
          .select("id, user_id, title, message, type")
          .eq("id", payload.notification_id)
          .maybeSingle();
        if (!notif || notif.user_id !== payload.user_id) {
          return new Response("Unauthorized", { status: 401 });
        }
        // Trust DB as source of truth
        payload.title = notif.title;
        payload.message = notif.message ?? "";
        payload.type = notif.type ?? "info";

        // Honor preferences
        const { data: prefs } = await supabaseAdmin
          .from("notification_preferences")
          .select("*")
          .eq("user_id", payload.user_id)
          .maybeSingle();

        const prefKey = preferenceKeyFor(payload.title);
        if (prefs && prefKey && prefs[prefKey] === false) {
          return Response.json({ skipped: true, reason: "preference_off" });
        }

        const { data: subs, error } = await supabaseAdmin
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", payload.user_id);
        if (error) {
          return Response.json({ error: error.message }, { status: 500 });
        }
        if (!subs || subs.length === 0) {
          return Response.json({ sent: 0 });
        }

        let sent = 0;
        let failed = 0;
        const removeGone: string[] = [];
        for (const sub of subs) {
          try {
            const r = await sendWebPush(sub, {
              title: payload.title,
              body: payload.message,
              url: payload.url ?? "/dashboard",
              tag: payload.notification_id ?? payload.title,
              data: { type: payload.type, notification_id: payload.notification_id },
            });
            if (r.ok) sent++;
            else failed++;
            if (r.gone) removeGone.push(sub.endpoint);
          } catch {
            failed++;
          }
        }

        if (removeGone.length > 0) {
          await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .in("endpoint", removeGone);
        }

        return Response.json({ sent, failed, total: subs.length });
      },
    },
  },
});
