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

const RETRY_DELAYS = [300, 600, 900];

async function querySettings(slug: string): Promise<StoreSettings | null> {
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as StoreSettings) ?? null;
}

export async function fetchSettings(slug: string): Promise<StoreSettings | null> {
  const cached = settingsCache.get(slug);
  if (cached) return cached;

  const existing = settingsInflight.get(slug);
  if (existing) return existing;

  const p = (async () => {
    try {
      let result = await querySettings(slug);
      for (let i = 0; !result && i < RETRY_DELAYS.length; i++) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[i]));
        result = await querySettings(slug);
      }
      settingsInflight.delete(slug);
      if (result) {
        settingsCache.set(slug, result);
      }
      return result;
    } catch (err) {
      settingsInflight.delete(slug);
      console.error("fetchSettings failed for slug:", slug, err);
      for (let i = 0; i < RETRY_DELAYS.length; i++) {
        try {
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[i]));
          const result = await querySettings(slug);
          if (result) {
            settingsCache.set(slug, result);
            return result;
          }
        } catch {
          // continue retrying
        }
      }
      return null;
    }
  })();

  settingsInflight.set(slug, p);
  return p;
}
