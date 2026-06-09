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

  useEffect(() => {
    if (!user) return;
    let active = true;

    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!active) return;
      if (data) loadSettings(data);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user, loadSettings]);

  if (loading || !settings) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <EditorLayout />;
}
