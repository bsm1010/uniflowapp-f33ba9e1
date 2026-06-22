import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense } from "react";
import { Loader2, Palette, Sparkles, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEditorStore } from "@/stores/editor-store";
import { EditorLayout } from "@/components/editor/EditorLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ThemePresetsTab = lazy(() =>
  import("./-dashboard.theme-presets").then((m) => ({ default: m.ThemePresetsComponent }))
);
const ThemeManagerTab = lazy(() =>
  import("./-dashboard.theme-manager").then((m) => ({ default: m.ThemeManagerComponent }))
);

export const Route = createFileRoute("/customize")({
  component: CustomizePage,
});

function CustomizePage() {
  const { user } = useAuth();
  const loadSettings = useEditorStore((s) => s.loadSettings);
  const settings = useEditorStore((s) => s.settings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("editor");

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

  return (
    <div className="flex flex-col h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
        <div className="border-b border-border/60 bg-background px-4 shrink-0">
          <TabsList className="h-11">
            <TabsTrigger value="editor" className="gap-1.5">
              <Palette className="h-4 w-4" /> Editor
            </TabsTrigger>
            <TabsTrigger value="presets" className="gap-1.5">
              <Sparkles className="h-4 w-4" /> Theme Presets
            </TabsTrigger>
            <TabsTrigger value="manager" className="gap-1.5">
              <Layers className="h-4 w-4" /> Theme Manager
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="flex-1 m-0 overflow-hidden">
          <EditorLayout />
        </TabsContent>

        <TabsContent value="presets" className="flex-1 m-0 overflow-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ThemePresetsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="manager" className="flex-1 m-0 overflow-auto">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ThemeManagerTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
