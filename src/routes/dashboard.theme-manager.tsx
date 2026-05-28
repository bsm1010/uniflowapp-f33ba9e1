import { useEffect, useState, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Zap, Flame, LayoutGrid, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { THEME_PRESETS } from "@/lib/themes/presets";
import { NAVBAR_CONFIGS } from "@/lib/themes/navbar-styles";
import { FOOTER_CONFIGS } from "@/lib/themes/footer-styles";
import { SECTION_PRESETS } from "@/lib/themes/section-presets";
import type { NavbarStyle, FooterStyle, ThemeDefinition } from "@/lib/themes";
import type { StoreSettings } from "@/lib/storeTheme";

export const Route = createFileRoute("/dashboard/theme-manager")({
  component: ThemeManagerPage,
  head: () => ({ meta: [{ title: "Theme Manager — Fennecly" }] }),
});

function ThemeManagerPage() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"themes" | "navbar" | "footer" | "sections">("themes");

  const load = useCallback(async () => {
    if (!currentStore?.id) { setLoading(false); return; }
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .eq("store_id", currentStore.id)
      .maybeSingle();
    if (data) setSettings(data as any);
    setLoading(false);
  }, [currentStore?.id]);

  useEffect(() => { load(); }, [load]);

  const applyTheme = async (preset: ThemeDefinition) => {
    if (!settings || !currentStore?.id) return;
    setSaving(true);
    const updated = {
      ...settings,
      ...preset.settings,
      navbar_style: preset.navbar,
      footer_style: preset.footer,
    };
    const { error } = await supabase
      .from("store_settings")
      .update(updated)
      .eq("store_id", currentStore.id);
    if (error) toast.error("Failed to apply theme");
    else { toast.success(`"${preset.name}" theme applied!`); setSettings(updated as any); }
    setSaving(false);
  };

  const applyNavbar = async (style: NavbarStyle) => {
    if (!settings || !currentStore?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ navbar_style: style } as any)
      .eq("store_id", currentStore.id);
    if (error) toast.error("Failed to update navbar");
    else { toast.success("Navbar style updated!"); setSettings({ ...settings, navbar_style: style } as any); }
    setSaving(false);
  };

  const applyFooter = async (style: FooterStyle) => {
    if (!settings || !currentStore?.id) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ footer_style: style } as any)
      .eq("store_id", currentStore.id);
    if (error) toast.error("Failed to update footer");
    else { toast.success("Footer style updated!"); setSettings({ ...settings, footer_style: style } as any); }
    setSaving(false);
  };

  const applySectionPreset = async (presetId: string) => {
    if (!settings || !currentStore?.id) return;
    const preset = SECTION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ sections: preset.sections } as any)
      .eq("store_id", currentStore.id);
    if (error) toast.error("Failed to apply section preset");
    else { toast.success(`"${preset.name}" sections applied!`); }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const currentNav = (settings as any)?.navbar_style || "classic";
  const currentFooter = (settings as any)?.footer_style || "columns";

  const tabs = [
    { id: "themes" as const, label: "Themes", icon: Zap },
    { id: "navbar" as const, label: "Navbars", icon: LayoutGrid },
    { id: "footer" as const, label: "Footers", icon: Flame },
    { id: "sections" as const, label: "Section Presets", icon: LayoutGrid },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Theme Manager"
        title="Customize Your Storefront"
        description="Choose a complete theme, switch navbar or footer styles, or apply section presets."
        icon={Zap}
        gradient="from-violet-500 via-fuchsia-500 to-amber-400"
      />

      <div className="flex gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-foreground text-background shadow-lg"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "themes" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {THEME_PRESETS.map((preset, i) => (
            <motion.div
              key={preset.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card className="border-border/60 shadow-soft overflow-hidden group hover:shadow-glow/20 transition-all">
                <div
                  className="h-32 flex items-center justify-center relative"
                  style={{ backgroundColor: preset.preview.bg }}
                >
                  <div className="flex gap-3">
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: preset.preview.primary }} />
                    <div className="h-6 w-6 rounded-full" style={{ backgroundColor: preset.preview.accent }} />
                  </div>
                  <Badge
                    className="absolute top-3 right-3 text-[10px] font-semibold"
                    variant="secondary"
                  >
                    {preset.navbar} · {preset.footer}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {preset.name}
                    <span
                      className="text-[10px] font-normal px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: preset.preview.primary + "20", color: preset.preview.primary }}
                    >
                      {preset.preview.font}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">{preset.description}</p>
                  <Button
                    size="sm"
                    className="mt-3 w-full gap-1.5 text-xs h-8"
                    onClick={() => applyTheme(preset)}
                    disabled={saving}
                  >
                    <Check className="h-3 w-3" />
                    Apply Theme
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "navbar" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {NAVBAR_CONFIGS.map((config) => (
            <Card
              key={config.style}
              className={cn(
                "border-border/60 shadow-soft cursor-pointer transition-all hover:shadow-glow/20",
                currentNav === config.style && "ring-2 ring-violet-500",
              )}
              onClick={() => applyNavbar(config.style)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{config.label}</h3>
                  {currentNav === config.style && (
                    <Badge className="h-5 text-[10px] bg-violet-500">Active</Badge>
                  )}
                </div>
                <div
                  className="h-12 rounded-lg flex items-center justify-center text-[11px] font-mono"
                  style={{ backgroundColor: "hsl(var(--muted))" }}
                >
                  {config.preview}
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
                <Button
                  variant={currentNav === config.style ? "secondary" : "outline"}
                  size="sm"
                  className="w-full text-xs h-8"
                  disabled={saving}
                >
                  {currentNav === config.style ? "Active" : "Apply"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "footer" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {FOOTER_CONFIGS.map((config) => (
            <Card
              key={config.style}
              className={cn(
                "border-border/60 shadow-soft cursor-pointer transition-all hover:shadow-glow/20",
                currentFooter === config.style && "ring-2 ring-violet-500",
              )}
              onClick={() => applyFooter(config.style)}
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{config.label}</h3>
                  {currentFooter === config.style && (
                    <Badge className="h-5 text-[10px] bg-violet-500">Active</Badge>
                  )}
                </div>
                <div
                  className="h-12 rounded-lg flex items-center justify-center text-[10px] font-mono leading-tight"
                  style={{ backgroundColor: "hsl(var(--muted))" }}
                >
                  {config.preview}
                </div>
                <p className="text-xs text-muted-foreground">{config.description}</p>
                <Button
                  variant={currentFooter === config.style ? "secondary" : "outline"}
                  size="sm"
                  className="w-full text-xs h-8"
                  disabled={saving}
                >
                  {currentFooter === config.style ? "Active" : "Apply"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "sections" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTION_PRESETS.map((preset) => (
            <Card key={preset.id} className="border-border/60 shadow-soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{preset.name}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <p className="text-xs text-muted-foreground">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {preset.sections.map((s) => (
                    <Badge key={s.id} variant="secondary" className="text-[10px]">{s.blockKey}</Badge>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full text-xs h-8 gap-1.5"
                  onClick={() => applySectionPreset(preset.id)}
                  disabled={saving}
                >
                  <LayoutGrid className="h-3 w-3" />
                  Apply Sections
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
