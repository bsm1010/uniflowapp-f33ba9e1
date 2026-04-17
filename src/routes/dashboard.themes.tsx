import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  ExternalLink,
  Image as ImageIcon,
  LayoutGrid,
  Layers,
  Loader2,
  Monitor,
  Palette as PaletteIcon,
  Save,
  Smartphone,
  Sparkles,
  Type,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  StorePreview,
  type StoreSettings,
} from "@/components/dashboard/StorePreview";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/dashboard/themes")({
  component: CustomizePage,
  head: () => ({ meta: [{ title: "Customize Store — Storely" }] }),
});

const THEMES = [
  {
    id: "modern",
    label: "Modern",
    description: "Rounded, spacious, gradient accents.",
    preview: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Editorial, generous whitespace, sharp.",
    preview: "from-stone-300 to-stone-500",
  },
  {
    id: "grid",
    label: "Grid",
    description: "Dense product grid for big catalogs.",
    preview: "from-emerald-400 to-cyan-500",
  },
];

const PRESET_COLORS = [
  "#6d28d9", "#2563eb", "#0891b2", "#059669", "#ca8a04",
  "#ea580c", "#dc2626", "#db2777", "#7c3aed", "#0f172a",
];

const BG_PRESETS = ["#ffffff", "#f8fafc", "#fafaf9", "#0b0b10", "#0f172a"];

const FONTS = ["Inter", "Space Grotesk", "Playfair", "DM Serif", "Mono"];

function defaults(userId: string): StoreSettings {
  return {
    user_id: userId,
    slug: `store-${userId.slice(0, 8)}`,
    store_name: "My Store",
    tagline: "Beautiful things, thoughtfully made.",
    theme: "modern",
    primary_color: "#6d28d9",
    background_color: "#ffffff",
    font_family: "Inter",
    logo_url: null,
    hero_heading: "Welcome to our store",
    hero_subheading: "Discover products you'll love.",
    hero_cta_label: "Shop now",
    show_hero: true,
    show_featured: true,
    show_categories: true,
    show_newsletter: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function CustomizePage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<
    { name: string; price: number; images: string[] }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [dirty, setDirty] = useState(false);

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
    setSettings(s.data ?? defaults(user.id));
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

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setDirty(true);
  };

  const save = async () => {
    if (!user || !settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .upsert({ ...settings, user_id: user.id }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Storefront saved");
    setDirty(false);
  };

  const uploadLogo = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be smaller than 2 MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    update("logo_url", data.publicUrl);
    setUploading(false);
  };

  const previewWidth = useMemo(
    () => (device === "mobile" ? "max-w-[390px]" : "max-w-full"),
    [device],
  );

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        eyebrow="Storefront"
        title="Customize your store"
        description="Design your storefront and see changes instantly."
        actions={
          <>
            <div className="flex items-center rounded-lg border border-border bg-background p-1">
              <Button
                size="sm"
                variant={device === "desktop" ? "secondary" : "ghost"}
                className="h-7 px-2"
                onClick={() => setDevice("desktop")}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={device === "mobile" ? "secondary" : "ghost"}
                className="h-7 px-2"
                onClick={() => setDevice("mobile")}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" asChild disabled={dirty}>
              <a
                href={`/s/${settings.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4" /> View live
              </a>
            </Button>
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? "Save changes" : "Saved"}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Left settings panel */}
        <Card className="border-border/60 shadow-soft h-fit lg:sticky lg:top-20">
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b border-border/60">
              <div className="text-sm font-semibold">Design</div>
              <div className="text-xs text-muted-foreground">
                Theme, colors, fonts and logo.
              </div>
            </div>
            <div>
                <Accordion
                  type="multiple"
                  defaultValue={["theme", "colors", "fonts", "logo"]}
                  className="px-2"
                >
                  <AccordionItem value="theme" className="border-b border-border/60">
                    <AccordionTrigger className="px-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4 text-primary" />
                        <span className="font-medium">Theme</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-4">
                      <div className="grid gap-2">
                        {THEMES.map((t) => {
                          const active = settings.theme === t.id;
                          return (
                            <button
                              key={t.id}
                              onClick={() => update("theme", t.id)}
                              className={`text-left rounded-xl border p-3 flex items-center gap-3 transition-colors ${
                                active
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div
                                className={`h-12 w-12 rounded-lg bg-gradient-to-br ${t.preview} shrink-0`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium flex items-center gap-2">
                                  {t.label}
                                  {active && (
                                    <Check className="h-3.5 w-3.5 text-primary" />
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {t.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="colors" className="border-b border-border/60">
                    <AccordionTrigger className="px-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <PaletteIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium">Colors</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-4 space-y-4">
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Primary
                        </Label>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="color"
                            value={settings.primary_color}
                            onChange={(e) => update("primary_color", e.target.value)}
                            className="h-9 w-12 rounded-md border border-border bg-transparent cursor-pointer"
                          />
                          <Input
                            value={settings.primary_color}
                            onChange={(e) => update("primary_color", e.target.value)}
                            maxLength={9}
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                        <div className="mt-2 grid grid-cols-10 gap-1.5">
                          {PRESET_COLORS.map((c) => (
                            <button
                              key={c}
                              onClick={() => update("primary_color", c)}
                              className="aspect-square rounded-md border border-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }}
                              aria-label={c}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                          Background
                        </Label>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="color"
                            value={settings.background_color}
                            onChange={(e) => update("background_color", e.target.value)}
                            className="h-9 w-12 rounded-md border border-border bg-transparent cursor-pointer"
                          />
                          <Input
                            value={settings.background_color}
                            onChange={(e) => update("background_color", e.target.value)}
                            maxLength={9}
                            className="flex-1 font-mono text-sm"
                          />
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          {BG_PRESETS.map((c) => (
                            <button
                              key={c}
                              onClick={() => update("background_color", c)}
                              className="h-7 w-7 rounded-md border border-border hover:scale-110 transition-transform"
                              style={{ backgroundColor: c }}
                              aria-label={c}
                            />
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fonts" className="border-b border-border/60">
                    <AccordionTrigger className="px-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Type className="h-4 w-4 text-primary" />
                        <span className="font-medium">Typography</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-4">
                      <div className="grid gap-2">
                        {FONTS.map((f) => {
                          const active = settings.font_family === f;
                          return (
                            <button
                              key={f}
                              onClick={() => update("font_family", f)}
                              className={`text-left rounded-lg border px-3 py-3 transition-colors ${
                                active
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-base"
                                  style={{ fontFamily: f === "Mono" ? "monospace" : f }}
                                >
                                  {f}
                                </span>
                                {active && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <div
                                className="text-xs text-muted-foreground mt-0.5"
                                style={{ fontFamily: f === "Mono" ? "monospace" : f }}
                              >
                                The quick brown fox jumps over the lazy dog.
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="logo" className="border-b-0">
                    <AccordionTrigger className="px-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="font-medium">Logo</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-2 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-16 rounded-xl border border-border bg-muted overflow-hidden flex items-center justify-center">
                          {settings.logo_url ? (
                            <img
                              src={settings.logo_url}
                              alt="Logo"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                e.target.files?.[0] && uploadLogo(e.target.files[0])
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              asChild
                            >
                              <span>
                                {uploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}
                                {settings.logo_url ? "Replace" : "Upload"} logo
                              </span>
                            </Button>
                          </label>
                          {settings.logo_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-muted-foreground"
                              onClick={() => update("logo_url", null)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        PNG or SVG, square format works best. Max 2 MB.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
            </div>
          </CardContent>
        </Card>

        {/* Live preview */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-border/60 shadow-soft overflow-hidden">
            <div className="bg-muted/40 border-b border-border/60 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <div className="ml-2 flex-1 text-center text-xs text-muted-foreground font-mono truncate">
                /s/{settings.slug}
              </div>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">Live preview</span>
            </div>
            <div className="bg-muted/20 p-4 sm:p-6 flex justify-center">
              <div
                className={`w-full ${previewWidth} bg-background rounded-xl border border-border overflow-hidden shadow-soft transition-all`}
                style={{ height: "calc(100vh - 220px)", minHeight: 600 }}
              >
                <StorePreview settings={settings} products={products} />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Bottom-side: Content + Sections panels (full width, below preview on small screens) */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:max-w-[380px]">
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Hero content</h3>
            </div>
            <div className="space-y-2">
              <Label>Store name</Label>
              <Input
                value={settings.store_name}
                onChange={(e) => update("store_name", e.target.value)}
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label>Heading</Label>
              <Input
                value={settings.hero_heading}
                onChange={(e) => update("hero_heading", e.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-2">
              <Label>Subheading</Label>
              <Textarea
                value={settings.hero_subheading}
                onChange={(e) => update("hero_subheading", e.target.value)}
                rows={2}
                maxLength={240}
              />
            </div>
            <div className="space-y-2">
              <Label>Button label</Label>
              <Input
                value={settings.hero_cta_label}
                onChange={(e) => update("hero_cta_label", e.target.value)}
                maxLength={40}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Homepage sections</h3>
            </div>
            <SectionToggle
              label="Hero"
              description="Big intro with heading and CTA."
              checked={settings.show_hero}
              onChange={(v) => update("show_hero", v)}
            />
            <SectionToggle
              label="Categories"
              description="Quick links to product categories."
              checked={settings.show_categories}
              onChange={(v) => update("show_categories", v)}
            />
            <SectionToggle
              label="Featured products"
              description="Showcase your best items."
              checked={settings.show_featured}
              onChange={(v) => update("show_featured", v)}
            />
            <SectionToggle
              label="Newsletter"
              description="Email signup at the bottom."
              checked={settings.show_newsletter}
              onChange={(v) => update("show_newsletter", v)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground truncate">{description}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
