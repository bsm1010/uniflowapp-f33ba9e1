import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { APPS_BY_KEY, type AppDef } from "@/lib/apps";

export type BuiltinAppEdit = {
  app_key: string;
  name: string | null;
  description: string | null;
  long_description: string | null;
  screenshots: string[];
};

export function useBuiltinAppEdits() {
  const [edits, setEdits] = useState<Record<string, BuiltinAppEdit>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("builtin_app_edits")
      .select("*")
      .order("app_key");

    if (error) {
      console.error("Failed to load builtin_app_edits:", error.message);
      setLoading(false);
      return;
    }

    const map: Record<string, BuiltinAppEdit> = {};
    for (const row of data ?? []) {
      map[row.app_key] = {
        app_key: row.app_key,
        name: row.name,
        description: row.description,
        long_description: row.long_description,
        screenshots: Array.isArray(row.screenshots) ? row.screenshots : [],
      };
    }
    setEdits(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (edit: BuiltinAppEdit) => {
    const payload = {
      app_key: edit.app_key,
      name: edit.name,
      description: edit.description,
      long_description: edit.long_description,
      screenshots: edit.screenshots ?? [],
      updated_at: new Date().toISOString(),
    };

    console.log("Saving payload:", payload);

    const { data, error } = await supabase
      .from("builtin_app_edits")
      .upsert(payload, { onConflict: "app_key" })
      .select()
      .single();

    if (error) {
      console.error("Save error:", error.message, error.details, error.hint);
      throw error;
    }

    setEdits((prev) => ({ ...prev, [edit.app_key]: edit }));
    return data;
  };

  const remove = async (appKey: string) => {
    const { error } = await supabase
      .from("builtin_app_edits")
      .delete()
      .eq("app_key", appKey);
    if (error) throw error;
    setEdits((prev) => {
      const next = { ...prev };
      delete next[appKey];
      return next;
    });
  };

  return { edits, loading, save, remove, reload: load };
}

export function mergeAppWithEdit(app: AppDef, edit: BuiltinAppEdit | undefined): AppDef {
  if (!edit) return app;
  return {
    ...app,
    name: edit.name ?? app.name,
    description: edit.description ?? app.description,
    longDescription: edit.long_description ?? app.longDescription,
    screenshots: edit.screenshots.length > 0 ? edit.screenshots : app.screenshots,
  };
}

export function useMergedApp(appKey: string) {
  const { edits, loading } = useBuiltinAppEdits();
  const base = APPS_BY_KEY[appKey];
  if (!base) return { app: null, loading };
  return { app: mergeAppWithEdit(base, edits[appKey]), loading };
}
