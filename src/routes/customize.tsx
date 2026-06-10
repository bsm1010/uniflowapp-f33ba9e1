import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEditorStore } from "@/stores/editor-store";
import { EditorLayout } from "@/components/editor/EditorLayout";

export const Route = createFileRoute("/customize")({
  component: CustomizePage,
});

function CustomizePage() {
  const { user } = useAuth();
  const loadSettings = useEditorStore((s) => s.loadSettings);
  const settings = useEditorStore((s) => s.settings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;

    (async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from("store_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!active) return;
        if (fetchErr) {
          setError(fetchErr.message);
        } else if (data) {
          loadSettings(data);
        }
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Failed to load settings");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user, loadSettings]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-background text-center">
        <p className="text-sm text-destructive">{error ?? "Please log in to use the editor."}</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <EditorLayout />;
}
