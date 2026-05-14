import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  Plus,
  Trash2,
  MessageSquare,
  Globe,
  Settings as SettingsIcon,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SubscriptionProvider, useSubscription } from "@/hooks/use-subscription";
import { ExpiredOverlay } from "@/components/dashboard/ExpiredOverlay";
import { StorePreview } from "@/components/dashboard/StorePreview";
import { type StoreSettings, FONT_STACK, getSectionOrder } from "@/lib/storeTheme";
import { SortableSections } from "@/components/dashboard/SortableSections";
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

export const Route = createFileRoute("/customize")({
  component: CustomizeRoute,
  head: () => ({ meta: [{ title: "Customize Store — Storely" }] }),
});

const TEMPLATES = [
  { id: "modern", label: "Modern", description: "Rounded, spacious, gradient accents.", preview: "from-violet-500 to-fuchsia-500" },
  { id: "minimal", label: "Minimal", description: "Editorial, whitespace, sharp edges.", preview: "from-stone-300 to-stone-500" },
  { id: "grid", label: "Grid", description: "Dense product grid for big catalogs.", preview: "from-emerald-400 to-cyan-500" },
  { id: "editorial", label: "Editorial", description: "Magazine-style with portrait images.", preview: "from-amber-400 to-rose-500" },
  { id: "bold", label: "Bold", description: "Strong typography, vibrant colors.", preview: "from-indigo-500 to-pink-500" },
];

const PRESET_COLORS = [
  "#6d28d9", "#2563eb", "#0891b2", "#059669", "#ca8a04",
  "#ea580c", "#dc2626", "#db2777", "#7c3aed", "#0f172a",
];
const BG_PRESETS = ["#ffffff", "#f8fafc", "#fafaf9", "#0b0b10", "#0f172a"];
const FONT_GROUPS: { group: string; fonts: { id: string; preview: string }[] }[] = [
  {
    group: "Sans serif",
    fonts: [
      { id: "Inter", preview: "Aa Modern & neutral" },
      { id: "Manrope", preview: "Aa Friendly geometric" },
      { id: "Sora", preview: "Aa Crisp & techy" },
      { id: "Outfit", preview: "Aa Clean rounded" },
      { id: "Plex Sans", preview: "Aa Editorial sans" },
      { id: "Jakarta", preview: "Aa Soft modern" },
    ],
  },
  {
    group: "Display",
    fonts: [
      { id: "Space Grotesk", preview: "Aa Tech / startup" },
      { id: "Bricolage", preview: "Aa Playful display" },
      { id: "Syne", preview: "Aa Bold creative" },
      { id: "Bebas", preview: "AA TALL CONDENSED" },
      { id: "Archivo", preview: "AA HEAVY IMPACT" },
    ],
  },
  {
    group: "Serif",
    fonts: [
      { id: "Playfair", preview: "Aa Elegant classic" },
      { id: "DM Serif", preview: "Aa Refined editorial" },
      { id: "Fraunces", preview: "Aa Warm modern serif" },
      { id: "Cormorant", preview: "Aa Luxurious & airy" },
    ],
  },
  {
    group: "Mono",
    fonts: [{ id: "Mono", preview: "Aa Code / minimal" }],
  },
];
const BUTTON_STYLES = [
  { id: "rounded", label: "Rounded" },
  { id: "pill", label: "Pill" },
  { id: "square", label: "Square" },
];
const RADIUS_OPTIONS = [
  { id: "none", label: "None" },
  { id: "small", label: "Small" },
  { id: "medium", label: "Medium" },
  { id: "large", label: "Large" },
];
const HERO_LAYOUTS = [
  { id: "centered", label: "Centered", description: "Text centered, optional bg image" },
  { id: "split", label: "Split", description: "Text left, image right" },
  { id: "fullbleed", label: "Full bleed", description: "Image full width with overlay" },
];
const CURRENCIES = ["USD", "EUR", "GBP", "DZD", "MAD", "TND", "CAD", "AUD", "JPY", "INR", "BRL", "MXN", "AED", "SAR"];

function defaults(userId: string): StoreSettings {
  return {
    user_id: userId,
    sections: [],
    slug: `store-${userId.slice(0, 8)}`,
    store_name: "My Store",
    tagline: "Beautiful things, thoughtfully made.",
    theme: "modern",
    primary_color: "#6d28d9",
    secondary_color: "#0f172a",
    accent_color: "#f59e0b",
    background_color: "#ffffff",
    font_family: "Inter",
    button_style: "rounded",
    border_radius: "medium",
    logo_url: null,
    hero_heading: "Welcome to our store",
    hero_subheading: "Discover products you'll love.",
    hero_cta_label: "Shop now",
    hero_image_url: null,
    hero_layout: "centered",
    show_hero: true,
    show_featured: true,
    show_categories: true,
    show_newsletter: true,
    show_search: true,
    nav_links: [
      { label: "Shop", href: "#featured" },
      { label: "Categories", href: "#categories" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    section_titles: {
      featured: "Featured products",
      featured_sub: "Hand-picked items we love",
      categories: "Shop by category",
      categories_sub: "Browse our collections",
      newsletter: "Join our newsletter",
      newsletter_sub: "Get 10% off your first order",
    },
    button_labels: {
      add_to_cart: "Add to cart",
      view_product: "View",
      checkout: "Checkout",
      subscribe: "Subscribe",
      view_all: "View all",
      search_placeholder: "Search products...",
    },
    footer_about: "A small shop with a big heart. Quality products, delivered with care.",
    footer_socials: { instagram: "", facebook: "", twitter: "", tiktok: "" },
    footer_copyright: "",
    currency: "USD",
    about_title: "About us",
    about_content: "Welcome to our store. We are passionate about offering quality products and a delightful shopping experience. Thanks for stopping by!",
    about_image_url: null,
    contact_email: "",
    contact_phone: "",
    contact_address: "",
    contact_map_url: "",
    contact_form_enabled: true,
    contact_intro: "Have a question? We'd love to hear from you.",
    section_order: ["hero", "categories", "featured", "newsletter"],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

interface NavLink { label: string; href: string }

/**
 * Outer route component:
 * - guards auth (redirects unauthenticated users to /login)
 * - fetches subscription state and provides it via SubscriptionProvider
 * - renders the editor full-screen, OUTSIDE the dashboard layout
 */
function CustomizeRoute() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [subStatus, setSubStatus] = useState<string>("trial");
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [hadPaid, setHadPaid] = useState(false);
  const [subLoaded, setSubLoaded] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_status, trial_end_date, subscription_end_date")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setSubStatus(data?.subscription_status ?? "trial");
        setTrialEnd(data?.trial_end_date ?? null);
        setHadPaid(!!data?.subscription_end_date);
        setSubLoaded(true);
      });
  }, [user]);

  if (loading || !user || !subLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const daysRemaining = trialEnd
    ? Math.max(
        0,
        Math.ceil((new Date(trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : 0;
  const isExpired = subStatus === "expired";

  return (
    <SubscriptionProvider
      value={{
        status: subStatus,
        isExpired,
        daysRemaining,
        hadPaidSubscription: hadPaid,
      }}
    >
      <CustomizeEditor />
    </SubscriptionProvider>
  );
}

function CustomizeEditor() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<{ name: string; price: number; images: string[] }[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
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

  useEffect(() => { load(); }, [load]);

  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
    setDirty(true);
  };

  const updateNavLink = (idx: number, key: "label" | "href", value: string) => {
    if (!settings) return;
    const links = [...((settings.nav_links as unknown as NavLink[]) ?? [])];
    links[idx] = { ...links[idx], [key]: value };
    update("nav_links", links as unknown as StoreSettings["nav_links"]);
  };
  const addNavLink = () => {
    if (!settings) return;
    const links = [...((settings.nav_links as unknown as NavLink[]) ?? []), { label: "New link", href: "#" }];
    update("nav_links", links as unknown as StoreSettings["nav_links"]);
  };
  const removeNavLink = (idx: number) => {
    if (!settings) return;
    const links = [...((settings.nav_links as unknown as NavLink[]) ?? [])];
    links.splice(idx, 1);
    update("nav_links", links as unknown as StoreSettings["nav_links"]);
  };

  type SectionTitleKey = "featured" | "featured_sub" | "categories" | "categories_sub" | "newsletter" | "newsletter_sub";
  const updateSectionTitle = (key: SectionTitleKey, value: string) => {
    if (!settings) return;
    const titles = { ...((settings.section_titles as Record<string, string>) ?? {}), [key]: value };
    update("section_titles", titles as unknown as StoreSettings["section_titles"]);
  };

  type ButtonLabelKey = "add_to_cart" | "view_product" | "checkout" | "subscribe" | "view_all" | "search_placeholder";
  const updateButtonLabel = (key: ButtonLabelKey, value: string) => {
    if (!settings) return;
    const labels = { ...((settings.button_labels as Record<string, string>) ?? {}), [key]: value };
    update("button_labels", labels as unknown as StoreSettings["button_labels"]);
  };

  type SocialKey = "instagram" | "facebook" | "twitter" | "tiktok";
  const updateSocial = (key: SocialKey, value: string) => {
    if (!settings) return;
    const socials = { ...((settings.footer_socials as Record<string, string>) ?? {}), [key]: value };
    update("footer_socials", socials as unknown as StoreSettings["footer_socials"]);
  };

  const save = async () => {
    if (!user || !settings) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .upsert({ ...settings, user_id: user.id }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Storefront saved");
    setDirty(false);
  };

  const uploadImage = async (file: File, kind: "logo" | "hero") => {
    if (!user) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file."); return; }
    if (file.size > 4 * 1024 * 1024) { toast.error("Image must be smaller than 4 MB."); return; }
    const setLoad = kind === "logo" ? setUploading : setUploadingHero;
    setLoad(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setLoad(false); return; }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    update(kind === "logo" ? "logo_url" : "hero_image_url", data.publicUrl);
    setLoad(false);
  };

  const previewWidth = useMemo(
    () => (device === "mobile" ? "max-w-[390px]" : "max-w-full"),
    [device],
  );

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const navLinks = (settings.nav_links as unknown as NavLink[]) ?? [];
  const sectionTitles = (settings.section_titles as Record<string, string>) ?? {};
  const buttonLabels = (settings.button_labels as Record<string, string>) ?? {};
  const socials = (settings.footer_socials as Record<string, string>) ?? {};

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isExpired && <ExpiredOverlay />}

      {/* Slim full-width topbar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="px-4 md:px-6 h-14 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.close()}
            className="hidden md:inline-flex"
            title="Close editor"
          >
            <ArrowLeft className="h-4 w-4" /> Close
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-primary-foreground">
              <PaletteIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Customize your store</div>
              <div className="text-xs text-muted-foreground truncate">
                {dirty ? "Unsaved changes" : "All changes saved"} · /s/{settings.slug}
              </div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center rounded-lg border border-border bg-background p-1">
              <Button size="sm" variant={device === "desktop" ? "secondary" : "ghost"} className="h-7 px-2" onClick={() => setDevice("desktop")}>
                <Monitor className="h-4 w-4" />
              </Button>
              <Button size="sm" variant={device === "mobile" ? "secondary" : "ghost"} className="h-7 px-2" onClick={() => setDevice("mobile")}>
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" asChild disabled={dirty}>
              <a href={`/s/${settings.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> View live
              </a>
            </Button>
            <Button size="sm" onClick={save} disabled={saving || !dirty}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </div>
      </header>

      {/* Two-pane editor: left panel + right preview */}
      <div className="flex-1 grid gap-0 lg:grid-cols-[400px_minmax(0,1fr)] min-h-0">
        {/* Settings panel (LEFT) */}
        <aside className="border-r border-border/60 bg-card/30 overflow-y-auto" style={{ maxHeight: "calc(100vh - 56px)" }}>
          <Accordion type="multiple" defaultValue={["template", "colors"]} className="px-2 py-2">
            {/* TEMPLATE */}
            <AccordionItem value="template" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4 text-primary" />
                  <span className="font-medium">Template</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4">
                <div className="grid gap-2">
                  {TEMPLATES.map((t) => {
                    const active = settings.theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => update("theme", t.id)}
                        className={`text-left rounded-xl border p-3 flex items-center gap-3 transition-colors ${
                          active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${t.preview} shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium flex items-center gap-2">
                            {t.label}
                            {active && <Check className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{t.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* COLORS */}
            <AccordionItem value="colors" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <PaletteIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium">Colors</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-4">
                <ColorField label="Primary" value={settings.primary_color} presets={PRESET_COLORS} onChange={(v) => update("primary_color", v)} />
                <ColorField label="Accent" value={settings.accent_color} presets={PRESET_COLORS} onChange={(v) => update("accent_color", v)} />
                <ColorField label="Background" value={settings.background_color} presets={BG_PRESETS} onChange={(v) => update("background_color", v)} />
              </AccordionContent>
            </AccordionItem>

            {/* TYPOGRAPHY */}
            <AccordionItem value="fonts" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4 text-primary" />
                  <span className="font-medium">Typography</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-4">
                {FONT_GROUPS.map((g) => (
                  <div key={g.group}>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">{g.group}</Label>
                    <div className="mt-2 grid gap-1.5">
                      {g.fonts.map((f) => {
                        const active = settings.font_family === f.id;
                        const stack = FONT_STACK[f.id] ?? f.id;
                        return (
                          <button
                            key={f.id}
                            onClick={() => update("font_family", f.id)}
                            className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                              active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate" style={{ fontFamily: stack }}>{f.id}</div>
                                <div className="text-xs text-muted-foreground truncate" style={{ fontFamily: stack }}>{f.preview}</div>
                              </div>
                              {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>

            {/* BUTTONS & SHAPE */}
            <AccordionItem value="shape" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium">Shape & buttons</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Button style</Label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {BUTTON_STYLES.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => update("button_style", b.id)}
                        className={`text-xs py-2 border transition-colors ${
                          settings.button_style === b.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                        style={{ borderRadius: b.id === "pill" ? 999 : b.id === "rounded" ? 8 : 0 }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Border radius</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => update("border_radius", r.id)}
                        className={`text-xs py-2 border transition-colors ${
                          settings.border_radius === r.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* LOGO */}
            <AccordionItem value="logo" className="border-b border-border/60">
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
                      <img src={settings.logo_url} alt="Logo" className="h-full w-full object-cover" />
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
                        onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "logo")}
                      />
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <span>
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          {settings.logo_url ? "Replace" : "Upload"} logo
                        </span>
                      </Button>
                    </label>
                    {settings.logo_url && (
                      <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => update("logo_url", null)}>
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* HERO */}
            <AccordionItem value="hero" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">Hero</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-4">
                <div className="space-y-2">
                  <Label>Heading</Label>
                  <Input value={settings.hero_heading} onChange={(e) => update("hero_heading", e.target.value)} maxLength={120} />
                </div>
                <div className="space-y-2">
                  <Label>Subheading</Label>
                  <Textarea value={settings.hero_subheading} onChange={(e) => update("hero_subheading", e.target.value)} rows={2} maxLength={240} />
                </div>
                <div className="space-y-2">
                  <Label>CTA button label</Label>
                  <Input value={settings.hero_cta_label} onChange={(e) => update("hero_cta_label", e.target.value)} maxLength={40} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Layout</Label>
                  <div className="grid gap-2">
                    {HERO_LAYOUTS.map((l) => {
                      const active = (settings.hero_layout || "centered") === l.id;
                      return (
                        <button
                          key={l.id}
                          onClick={() => update("hero_layout", l.id)}
                          className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                            active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="text-sm font-medium flex items-center justify-between">
                            {l.label}
                            {active && <Check className="h-3.5 w-3.5 text-primary" />}
                          </div>
                          <div className="text-xs text-muted-foreground">{l.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Hero image</Label>
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-24 rounded-md border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0">
                      {settings.hero_image_url ? (
                        <img src={settings.hero_image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <label>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "hero")}
                        />
                        <Button variant="outline" size="sm" className="w-full" asChild>
                          <span>
                            {uploadingHero ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                            {settings.hero_image_url ? "Replace" : "Upload"} image
                          </span>
                        </Button>
                      </label>
                      {settings.hero_image_url && (
                        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => update("hero_image_url", null)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* NAVIGATION */}
            <AccordionItem value="nav" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">Navigation</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-2">
                {navLinks.map((l, idx) => (
                  <div key={idx} className="flex gap-1.5">
                    <Input
                      value={l.label}
                      onChange={(e) => updateNavLink(idx, "label", e.target.value)}
                      placeholder="Label"
                      className="flex-1 h-9 text-sm"
                      maxLength={30}
                    />
                    <Input
                      value={l.href}
                      onChange={(e) => updateNavLink(idx, "href", e.target.value)}
                      placeholder="#section or url"
                      className="flex-1 h-9 text-sm font-mono"
                      maxLength={120}
                    />
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground" onClick={() => removeNavLink(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full" onClick={addNavLink} disabled={navLinks.length >= 6}>
                  <Plus className="h-3.5 w-3.5" /> Add link
                </Button>
              </AccordionContent>
            </AccordionItem>

            {/* CONTENT (sections + buttons) */}
            <AccordionItem value="labels" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span className="font-medium">Text labels</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Section titles</div>
                <LabeledInput label="Featured title" value={sectionTitles.featured ?? ""} onChange={(v) => updateSectionTitle("featured", v)} />
                <LabeledInput label="Featured subtitle" value={sectionTitles.featured_sub ?? ""} onChange={(v) => updateSectionTitle("featured_sub", v)} />
                <LabeledInput label="Categories title" value={sectionTitles.categories ?? ""} onChange={(v) => updateSectionTitle("categories", v)} />
                <LabeledInput label="Categories subtitle" value={sectionTitles.categories_sub ?? ""} onChange={(v) => updateSectionTitle("categories_sub", v)} />
                <LabeledInput label="Newsletter title" value={sectionTitles.newsletter ?? ""} onChange={(v) => updateSectionTitle("newsletter", v)} />
                <LabeledInput label="Newsletter subtitle" value={sectionTitles.newsletter_sub ?? ""} onChange={(v) => updateSectionTitle("newsletter_sub", v)} />

                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Button labels</div>
                <LabeledInput label="Add to cart" value={buttonLabels.add_to_cart ?? ""} onChange={(v) => updateButtonLabel("add_to_cart", v)} />
                <LabeledInput label="Checkout" value={buttonLabels.checkout ?? ""} onChange={(v) => updateButtonLabel("checkout", v)} />
                <LabeledInput label="Subscribe" value={buttonLabels.subscribe ?? ""} onChange={(v) => updateButtonLabel("subscribe", v)} />
                <LabeledInput label="View all" value={buttonLabels.view_all ?? ""} onChange={(v) => updateButtonLabel("view_all", v)} />
                <LabeledInput label="Search placeholder" value={buttonLabels.search_placeholder ?? ""} onChange={(v) => updateButtonLabel("search_placeholder", v)} />
              </AccordionContent>
            </AccordionItem>

            {/* FOOTER */}
            <AccordionItem value="footer" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-medium">Footer</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-3">
                <div className="space-y-2">
                  <Label>About text</Label>
                  <Textarea value={settings.footer_about} onChange={(e) => update("footer_about", e.target.value)} rows={3} maxLength={280} />
                </div>
                <div className="space-y-2">
                  <Label>Copyright (leave blank for default)</Label>
                  <Input value={settings.footer_copyright} onChange={(e) => update("footer_copyright", e.target.value)} maxLength={120} placeholder="© 2025 My Store" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2">Social links</div>
                <LabeledInput label="Instagram URL" value={socials.instagram ?? ""} onChange={(v) => updateSocial("instagram", v)} placeholder="https://instagram.com/..." />
                <LabeledInput label="Facebook URL" value={socials.facebook ?? ""} onChange={(v) => updateSocial("facebook", v)} placeholder="https://facebook.com/..." />
                <LabeledInput label="Twitter / X URL" value={socials.twitter ?? ""} onChange={(v) => updateSocial("twitter", v)} placeholder="https://x.com/..." />
                <LabeledInput label="TikTok URL" value={socials.tiktok ?? ""} onChange={(v) => updateSocial("tiktok", v)} placeholder="https://tiktok.com/@..." />
              </AccordionContent>
            </AccordionItem>

            {/* SECTIONS */}
            <AccordionItem value="sections" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-medium">Sections</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-2">
                <SectionToggle label="Hero" description="Big intro with heading and CTA." checked={settings.show_hero} onChange={(v) => update("show_hero", v)} />
                <SectionToggle label="Categories" description="Quick links to product categories." checked={settings.show_categories} onChange={(v) => update("show_categories", v)} />
                <SectionToggle label="Featured products" description="Showcase your best items." checked={settings.show_featured} onChange={(v) => update("show_featured", v)} />
                <SectionToggle label="Newsletter" description="Email signup at the bottom." checked={settings.show_newsletter} onChange={(v) => update("show_newsletter", v)} />
                <SectionToggle label="Search bar" description="Show a search input above products." checked={settings.show_search} onChange={(v) => update("show_search", v)} />
              </AccordionContent>
            </AccordionItem>

            {/* STORE INFO */}
            <AccordionItem value="store" className="border-b border-border/60">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  <span className="font-medium">Store info & URL</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-3">
                <div className="space-y-2">
                  <Label>Store name</Label>
                  <Input value={settings.store_name} onChange={(e) => update("store_name", e.target.value)} maxLength={60} />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <select
                    value={settings.currency || "USD"}
                    onChange={(e) => update("currency", e.target.value)}
                    className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <div className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2">
                    <span className="text-xs text-muted-foreground font-mono shrink-0">/s/</span>
                    <Input
                      value={settings.slug}
                      onChange={(e) =>
                        update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))
                      }
                      className="border-0 bg-transparent px-0 font-mono text-sm focus-visible:ring-0"
                      minLength={3}
                      maxLength={40}
                      placeholder="my-shop"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* SECTION ORDER */}
            <AccordionItem value="layout" className="border-b-0">
              <AccordionTrigger className="px-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-medium">Section order</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-4 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Drag to reorder how sections appear on your storefront. Saves and updates live automatically.
                </p>
                <SortableSections
                  order={getSectionOrder(settings)}
                  onChange={(next) => {
                    update("section_order", next as unknown as StoreSettings["section_order"]);
                    void supabase
                      .from("store_settings")
                      .update({ section_order: next })
                      .eq("user_id", user!.id)
                      .then(({ error }) => {
                        if (error) toast.error(error.message);
                      });
                  }}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        {/* Live preview (RIGHT) */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-muted/20 overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 56px)" }}
        >
          <div className="p-4 sm:p-6 flex justify-center min-h-full">
            <div
              className={`w-full ${previewWidth} bg-background rounded-xl border border-border overflow-hidden shadow-soft transition-all`}
              style={{ height: "calc(100vh - 120px)", minHeight: 600 }}
            >
              <StorePreview settings={settings} products={products} />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  presets,
  onChange,
}: {
  label: string;
  value: string;
  presets: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-12 rounded-md border border-border bg-transparent cursor-pointer"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} maxLength={9} className="flex-1 font-mono text-sm" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {presets.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className="h-6 w-6 rounded-md border border-border hover:scale-110 transition-transform"
            style={{ backgroundColor: c }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm" maxLength={120} placeholder={placeholder} />
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
