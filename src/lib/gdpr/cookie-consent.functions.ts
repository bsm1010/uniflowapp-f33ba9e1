import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CookieConsentSettings = {
  id: string;
  user_id: string;
  store_id: string;
  enabled: boolean;
  banner_title: string;
  banner_text: string;
  accept_all_text: string;
  reject_all_text: string;
  save_text: string;
  manage_text: string;
  privacy_policy_url: string | null;
  position: string;
  theme: string;
};

export const getCookieConsentSettings = createServerFn({ method: "GET" })
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data }) => {
    const { data: settings } = await supabase
      .from("cookie_consent_settings")
      .select("*")
      .eq("store_id", data.storeId)
      .maybeSingle();
    return settings as CookieConsentSettings | null;
  });

export const saveCookieConsentSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      storeId: string;
      userId: string;
      enabled: boolean;
      bannerTitle: string;
      bannerText: string;
      acceptAllText: string;
      rejectAllText: string;
      saveText: string;
      manageText: string;
      privacyPolicyUrl: string | null;
      position: string;
      theme: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("cookie_consent_settings")
      .upsert(
        {
          user_id: data.userId,
          store_id: data.storeId,
          enabled: data.enabled,
          banner_title: data.bannerTitle,
          banner_text: data.bannerText,
          accept_all_text: data.acceptAllText,
          reject_all_text: data.rejectAllText,
          save_text: data.saveText,
          manage_text: data.manageText,
          privacy_policy_url: data.privacyPolicyUrl,
          position: data.position,
          theme: data.theme,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,store_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const recordCookieConsent = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      storeId: string;
      visitorId: string;
      necessary: boolean;
      analytics: boolean;
      marketing: boolean;
      preferences: boolean;
    }) => input,
  )
  .handler(async ({ data }) => {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 12);

    const { error } = await supabaseAdmin
      .from("cookie_consents")
      .upsert(
        {
          store_id: data.storeId,
          visitor_id: data.visitorId,
          necessary: data.necessary,
          analytics: data.analytics,
          marketing: data.marketing,
          preferences: data.preferences,
          expires_at: expiresAt.toISOString(),
        },
        { onConflict: "store_id,visitor_id" },
      );
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("consent_audit_log").insert({
      store_id: data.storeId,
      action: "consent_given",
      details: {
        necessary: data.necessary,
        analytics: data.analytics,
        marketing: data.marketing,
        preferences: data.preferences,
      },
    });

    return { ok: true };
  });

export const getCookieConsentStats = createServerFn({ method: "GET" })
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data }) => {
    const { data: consents } = await supabase
      .from("cookie_consents")
      .select("necessary, analytics, marketing, preferences")
      .eq("store_id", data.storeId);

    const total = consents?.length ?? 0;
    const allAccepted =
      consents?.filter((c) => c.analytics && c.marketing && c.preferences).length ?? 0;
    const allRejected =
      consents?.filter((c) => !c.analytics && !c.marketing && !c.preferences).length ?? 0;
    const customized = total - allAccepted - allRejected;

    return { total, allAccepted, allRejected, customized };
  });

export const deleteCookieConsent = createServerFn({ method: "POST" })
  .inputValidator((input: { consentId: string }) => input)
  .handler(async ({ data }) => {
    const { error } = await supabase
      .from("cookie_consents")
      .delete()
      .eq("id", data.consentId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
