import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Per-user installed apps state.
 *
 * Adding a new app:
 *   1. Add an entry to APPS in `src/lib/apps.ts` (key, name, icon, etc.)
 *   2. Gate any feature with: `const { isInstalled } = useInstalledApps(); isInstalled("your-key")`
 *   3. The App Store + dashboard "Your apps" section pick it up automatically.
 */
export function useInstalledApps() {
  const { user } = useAuth();
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setInstalled(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("installed_apps")
      .select("app_key")
      .eq("user_id", user.id);
    setInstalled(new Set((data ?? []).map((r) => r.app_key)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Cross-component sync: any install/uninstall fires this event.
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("apps:updated", handler);
    return () => window.removeEventListener("apps:updated", handler);
  }, [refresh]);

  // Realtime: keep state fresh if changes happen in another tab.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`installed-apps-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "installed_apps",
          filter: `user_id=eq.${user.id}`,
        },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refresh]);

  const install = useCallback(
    async (appKey: string) => {
      if (!user) return { error: new Error("Not signed in") };
      const { error } = await supabase
        .from("installed_apps")
        .insert({ user_id: user.id, app_key: appKey });
      if (!error) {
        setInstalled((prev) => new Set(prev).add(appKey));
        window.dispatchEvent(new Event("apps:updated"));
      }
      return { error };
    },
    [user],
  );

  const uninstall = useCallback(
    async (appKey: string) => {
      if (!user) return { error: new Error("Not signed in") };
      const { error } = await supabase
        .from("installed_apps")
        .delete()
        .eq("user_id", user.id)
        .eq("app_key", appKey);
      if (!error) {
        setInstalled((prev) => {
          const next = new Set(prev);
          next.delete(appKey);
          return next;
        });
        window.dispatchEvent(new Event("apps:updated"));
      }
      return { error };
    },
    [user],
  );

  const isInstalled = useCallback(
    (appKey: string) => installed.has(appKey),
    [installed],
  );

  return { installed, isInstalled, install, uninstall, loading, refresh };
}
