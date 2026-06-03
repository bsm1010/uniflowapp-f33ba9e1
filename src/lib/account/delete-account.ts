import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Schema = z.object({
  accessToken: z.string().min(1),
});

/**
 * Permanently delete the calling user's account and all owned data.
 * Uses the service role to remove the auth.users row; profile + owned tables
 * cascade or are cleaned via FK ON DELETE CASCADE / explicit deletes here.
 */
export const deleteAccount = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL) throw new Error("SUPABASE_URL not configured");
    if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify caller
    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(data.accessToken);
    if (userErr || !user) throw new Error("Unauthorized");

    const uid = user.id;

    // Best-effort cleanup of owned rows that don't have FK cascade to auth.users
    const tables = [
      "abandoned_carts",
      "analytics_integrations",
      "category_images",
      "chatbot_conversations",
      "chatbot_settings",
      "contact_messages",
      "consent_audit_log",
      "cookie_consent_settings",
      "cookie_consents",
      "credit_transactions",
      "currency_settings",
      "data_export_requests",
      "db_automations",
      "db_fields",
      "db_records",
      "db_tables",
      "delivery_tariffs",
      "deletion_requests",
      "discount_codes",
      "email_campaigns",
      "installed_apps",
      "notifications",
      "payment_submissions",
      "popups",
      "privacy_policy_settings",
      "products",
      "push_subscriptions",
      "seo_settings",
      "shipments",
      "store_delivery_companies",
      "store_languages",
      "store_settings",
      "translations",
      "user_roles",
    ] as const;

    for (const t of tables) {
      const col = t === "delivery_tariffs" || t === "shipments" || t === "store_delivery_companies" || t === "cookie_consent_settings" || t === "cookie_consents" || t === "privacy_policy_settings" || t === "data_export_requests" || t === "deletion_requests" || t === "consent_audit_log"
        ? "store_id"
        : t === "abandoned_carts" || t === "chatbot_conversations" || t === "contact_messages"
          ? "store_owner_id"
          : "user_id";
      await admin.from(t).delete().eq(col, uid);
    }

    // Orders (store_owner_id) — order_items will cascade if FK set, otherwise delete first
    const { data: orderRows } = await admin
      .from("orders")
      .select("id")
      .eq("store_owner_id", uid);
    const orderIds = (orderRows ?? []).map((r) => r.id);
    if (orderIds.length > 0) {
      await admin.from("order_items").delete().in("order_id", orderIds);
      await admin.from("orders").delete().in("id", orderIds);
    }

    // Profile (FK from referrals etc.) — null out referrals first
    await admin.from("referrals").delete().or(`referrer_id.eq.${uid},referee_id.eq.${uid}`);
    await admin.from("profiles").delete().eq("id", uid);

    // Finally delete the auth user
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) throw new Error(delErr.message);

    return { ok: true };
  });
