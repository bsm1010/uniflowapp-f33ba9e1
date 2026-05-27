import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Eye,
  Loader2,
  Palette,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { ExpiredOverlay } from "@/components/dashboard/ExpiredOverlay";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StorePreview } from "@/components/dashboard/StorePreview";
import { ProductPagePreview } from "@/components/dashboard/ProductPagePreview";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { StoreSettings } from "@/lib/storeTheme";
import {
  THEME_PRESETS,
  applyPreset,
  type ThemePreset,
} from "@/lib/themePresets";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/theme-presets")({
  component: PresetsPage,
  head: () => ({ meta: [{ title: "Theme Presets — Storely" }] }),
});

function PresetsPage() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<
    { name: string; price: number; images: string[] }[]
  >([]);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<ThemePreset | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [s, p] = await Promise.all([
      supabase.from("store_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("products")
        .select("name,price,images")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);
    if (s.error) toast.error(s.error.message);
    setSettings(s.data ?? null);
    setProducts(
      (p.data ?? []).map((x) => ({
        name: x.name,
        price: Number(x.price),
        images: x.images ?? [],
      })),
    );
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const apply = async (preset: ThemePreset) => {
    if (!user || !settings) return;
    setApplyingId(preset.id);
    const next = applyPreset(settings, preset);
    const { error } = await supabase
      .from("store_settings")
      .upsert({ ...next, user_id: user.id }, { onConflict: "user_id" });
    setApplyingId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSettings(next);
    setPreviewing(null);
    toast.success(`${preset.name} theme applied to your store`, {
      description: "Refresh your storefront to see the change live.",
    });
  };

  const isActive = (preset: ThemePreset) =>
    settings?.theme === preset.patch.theme &&
    settings?.primary_color === preset.patch.primary_color &&
    settings?.background_color === preset.patch.background_color;

  return (
    <div className="max-w-7xl mx-auto">
      {isExpired && <ExpiredOverlay />}
      <PageHeader
        eyebrow="Storefront"
        title="Theme presets"
        description="Pick a starting point for your store. You can fine-tune everything afterwards."
        icon={Palette}
        gradient="from-pink-500 via-rose-500 to-orange-500"
        actions={
          <Button variant="outline" asChild>
            <a href="/customize" target="_blank" rel="noopener noreferrer">
              <Palette className="h-4 w-4" /> Advanced editor
            </a>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {THEME_PRESETS.map((preset, idx) => {
          const active = isActive(preset);
          return (
            <motion.div
              key={preset.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
            >
              <Card
                className={`group overflow-hidden border-border/60 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                  active ? "ring-2 ring-primary border-primary/60" : ""
                }`}
              >
                {/* Visual thumbnail */}
                <button
                  type="button"
                  onClick={() => setPreviewing(preset)}
                  className="block w-full text-left"
                  aria-label={`Preview ${preset.name} theme`}
                >
                  <ThemeThumbnail preset={preset} />
                </button>

                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold tracking-tight">
                          {preset.name}
                        </h3>
                        {active && (
                          <Badge className="bg-primary/15 text-primary hover:bg-primary/15 border-0 gap-1">
                            <Check className="h-3 w-3" /> Active
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {preset.tagline}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                    {preset.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {preset.highlights.map((h) => (
                      <span
                        key={h}
                        className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewing(preset)}
                    >
                      <Eye className="h-4 w-4" /> Preview
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => apply(preset)}
                      disabled={
                        !settings || isExpired || applyingId === preset.id || active
                      }
                    >
                      {applyingId === preset.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : active ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {active ? "Applied" : "Apply theme"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-border/60 bg-muted/30 p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-sm font-medium">Want full control?</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Open the advanced editor to tweak colors, fonts, hero, navigation, and more.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/customize" target="_blank" rel="noopener noreferrer">
            Open advanced editor <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </div>

      {/* Live preview dialog — fullscreen with Homepage / Product page tabs */}
      <Dialog open={!!previewing} onOpenChange={(o) => !o && setPreviewing(null)}>
        <DialogContent className="max-w-[100vw] sm:max-w-[95vw] w-[95vw] h-[92vh] p-0 overflow-hidden gap-0 flex flex-col">
          <DialogHeader className="px-6 py-3 border-b border-border/60 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <DialogTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {previewing?.name} theme
                  {previewing && isActive(previewing) && (
                    <Badge className="bg-primary/15 text-primary hover:bg-primary/15 border-0 gap-1">
                      <Check className="h-3 w-3" /> Active
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="truncate">
                  {previewing?.description}
                </DialogDescription>
              </div>
              <Button
                size="sm"
                onClick={() => previewing && apply(previewing)}
                disabled={
                  !previewing ||
                  isExpired ||
                  applyingId === previewing.id ||
                  (previewing && isActive(previewing))
                }
              >
                {previewing && applyingId === previewing.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : previewing && isActive(previewing) ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {previewing && isActive(previewing) ? "Already applied" : "Apply this theme"}
              </Button>
            </div>
          </DialogHeader>

          <Tabs defaultValue="home" className="flex-1 flex flex-col min-h-0">
            <div className="px-6 py-2 border-b border-border/60 bg-muted/30 shrink-0">
              <TabsList>
                <TabsTrigger value="home">Homepage</TabsTrigger>
                <TabsTrigger value="product">Product page</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 bg-muted/40 p-3 sm:p-5 overflow-hidden">
              <div
                className="mx-auto h-full bg-background rounded-xl border border-border overflow-hidden shadow-soft"
                style={{ maxWidth: 1180 }}
              >
                <TabsContent value="home" className="h-full m-0 data-[state=inactive]:hidden">
                  {settings && previewing && (
                    <StorePreview
                      settings={applyPreset(settings, previewing)}
                      products={products}
                    />
                  )}
                </TabsContent>
                <TabsContent value="product" className="h-full m-0 data-[state=inactive]:hidden">
                  {settings && previewing && (
                    <ProductPagePreview
                      settings={applyPreset(settings, previewing)}
                      products={products}
                    />
                  )}
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Small, fully CSS-driven thumbnail that visually represents the preset's
 * palette and layout — no remote images needed.
 */
function ThemeThumbnail({ preset }: { preset: ThemePreset }) {
  const p = preset.patch;
  const isDark = (p.background_color ?? "#fff").toLowerCase() <= "#222222";
  const fg = isDark ? "#f8fafc" : "#0f172a";
  const muted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.55)";
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)";
  const radius =
    p.border_radius === "none"
      ? 0
      : p.border_radius === "small"
        ? 4
        : p.border_radius === "large"
          ? 18
          : 10;
  const btnRadius =
    p.button_style === "pill" ? 999 : p.button_style === "square" ? 0 : 8;

  return (
    <div
      className={`relative aspect-[16/9] overflow-hidden bg-gradient-to-br ${preset.accent}`}
    >
      {/* Mock storefront card */}
      <div
        className="absolute inset-x-6 bottom-4 top-8 rounded-lg overflow-hidden shadow-xl transition-transform duration-500 group-hover:scale-[1.02]"
        style={{
          backgroundColor: p.background_color,
          color: fg,
          border: `1px solid ${border}`,
        }}
      >
        {/* Topbar */}
        <div
          className="flex items-center justify-between px-3 py-2"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded"
              style={{ backgroundColor: p.primary_color }}
            />
            <div className="h-1.5 w-10 rounded" style={{ backgroundColor: muted }} />
          </div>
          <div className="flex gap-1.5">
            <div className="h-1 w-4 rounded" style={{ backgroundColor: muted }} />
            <div className="h-1 w-4 rounded" style={{ backgroundColor: muted }} />
            <div className="h-1 w-4 rounded" style={{ backgroundColor: muted }} />
          </div>
        </div>
        {/* Hero strip */}
        <div className="px-3 py-3">
          <div className="h-1.5 w-2/3 rounded mb-1" style={{ backgroundColor: fg }} />
          <div className="h-1 w-1/2 rounded mb-2.5" style={{ backgroundColor: muted }} />
          <div
            className="inline-block px-2.5 py-1 text-[8px] font-semibold"
            style={{
              backgroundColor: p.primary_color,
              color: isDark ? "#0b0b10" : "#fff",
              borderRadius: btnRadius,
            }}
          >
            Shop now
          </div>
        </div>
        {/* Product grid */}
        <div className="px-3 grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-square"
              style={{
                background: `linear-gradient(135deg, ${p.primary_color}33, ${p.accent_color}22)`,
                borderRadius: radius,
                border: `1px solid ${border}`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
