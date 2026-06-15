import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

export type PrivacyPolicySection = {
  title: string;
  content: string;
};

export type PrivacyPolicySettings = {
  id: string;
  user_id: string;
  store_id: string;
  enabled: boolean;
  sections: PrivacyPolicySection[];
  custom_html: string | null;
  last_updated: string;
};

export const getPrivacyPolicySettings = createServerFn({ method: "GET" })
  .inputValidator((input: { storeId: string }) => input)
  .handler(async ({ data }) => {
    const { data: settings } = await supabase
      .from("privacy_policy_settings")
      .select("*")
      .eq("store_id", data.storeId)
      .maybeSingle();
    return settings as PrivacyPolicySettings | null;
  });

export const getPrivacyPolicyBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!store) return null;

    const { data: settings } = await supabase
      .from("privacy_policy_settings")
      .select("*")
      .eq("store_id", store.id)
      .eq("enabled", true)
      .maybeSingle();
    return settings as PrivacyPolicySettings | null;
  });

export const savePrivacyPolicySettings = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      storeId: string;
      userId: string;
      enabled: boolean;
      sections: PrivacyPolicySection[];
      customHtml: string | null;
    }) => input,
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("privacy_policy_settings").upsert(
      {
        user_id: data.userId,
        store_id: data.storeId,
        enabled: data.enabled,
        sections: data.sections as any,
        custom_html: data.customHtml,
        last_updated: new Date().toISOString(),
      },
      { onConflict: "user_id,store_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
