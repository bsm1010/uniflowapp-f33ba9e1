import { Loader2, Save, ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useEditorStore } from "@/stores/editor-store";
import { useAuth } from "@/hooks/use-auth";
import type { Tables, Json } from "@/integrations/supabase/types";

export function PublishButton() {
  const { user } = useAuth();
  const {
    settings,
    getSerializableSections,
    saving,
    setSaving,
    dirty,
    setDirty,
    publishStatus,
    setPublishStatus,
    updateSettings,
  } = useEditorStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const save = async (publish: boolean) => {
    if (!settings || !user) return;
    setSaving(true);
    try {
      const sections = getSerializableSections();
      const patch = {
        ...useEditorStore.getState().settings,
        user_id: user.id,
        sections: sections as unknown as Json,
      } as Tables<"store_settings"> & { user_id: string };
      if (publish) {
        patch.is_active = true;
      }

      const { error } = await supabase
        .from("store_settings")
        .upsert(patch, { onConflict: "user_id" });

      if (error) throw error;

      setDirty(false);
      setPublishStatus(publish ? "published" : "draft");
      updateSettings({ sections: sections as unknown as Json });
      toast.success(publish ? "Published!" : "Draft saved.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSaving(false);
      setMenuOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => save(publishStatus === "draft")}
          disabled={saving || (!dirty && publishStatus === "published")}
          className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-l-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none transition-opacity"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {dirty ? "Publish" : "Published"}
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="h-8 px-1.5 rounded-r-md border border-l-0 border-primary/30 bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-md border bg-popover shadow-md">
            <button
              type="button"
              onClick={() => save(false)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors rounded-t-md"
            >
              Save as draft
            </button>
            <button
              type="button"
              onClick={() => save(true)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors rounded-b-md"
            >
              Publish now
            </button>
          </div>
        </>
      )}
    </div>
  );
}
