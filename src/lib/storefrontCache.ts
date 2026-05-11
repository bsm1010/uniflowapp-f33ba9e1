import { supabase } from "@/integrations/supabase/client";
import type { StoreSettings } from "./storeTheme";

const settingsCache = new Map<string, StoreSettings>();
const settingsInflight = new Map<string, Promise<StoreSettings | null>>();

export function getCachedSettings(slug: string): StoreSettings | null {
  return settingsCache.get(slug) ?? null;
}

export function setCachedSettings(slug: string, s: StoreSettings) {
  settingsCache.set(slug, s);
}

export function fetchSettings(slug: string): Promise<StoreSettings | null> {
  const cached = settingsCache.get(slug);
  if (cached) return Promise.resolve(cached);
  const existing = settingsInflight.get(slug);
  if (existing) return existing;
  const p = Promise.resolve(
    supabase.from("store_settings").select("*").eq("slug", slug).maybeSingle(),
  ).then(({ data }) => {
      settingsInflight.delete(slug);
      if (data) {
        settingsCache.set(slug, data as StoreSettings);
        return data as StoreSettings;
      }
      return null;
    });
  settingsInflight.set(slug, p);
  return p;
}
