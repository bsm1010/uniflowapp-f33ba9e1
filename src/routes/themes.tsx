import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, Suspense, useCallback } from "react";
import { Loader2, Eye, Palette, ArrowLeft, ShoppingBag } from "lucide-react";
import { THEME_PRESETS, type ThemePreset } from "@/lib/themePresets";
import { getDemoProducts, type DemoProduct } from "@/lib/themeDemoData";
import { getStoreTokens, type StoreTokens } from "@/lib/storeTheme";
import { LAYOUT_COMPONENTS, type LayoutProps } from "@/components/storefront/layouts";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/themes")({
  component: ThemeGalleryPage,
  head: () => ({
    meta: [
      { title: "Theme Gallery — 20 Premium Store Themes | Storely" },
      {
        name: "description",
        content:
          "Browse 20 premium, production-ready e-commerce themes. From luxury fashion to tech gadgets — find the perfect look for your online store.",
      },
    ],
  }),
});

function ThemeGalleryPage() {
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  if (activeTheme) {
    const preset = THEME_PRESETS.find((p) => p.id === activeTheme)!;
    return <ThemePreview preset={preset} onBack={() => setActiveTheme(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-semibold flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold">Theme Gallery</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-28 px-6 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          20 Premium Themes
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Each theme is a complete brand experience — unique layouts, typography, and visual identity. Click any theme to see it live.
        </p>
      </section>

      {/* Theme grid */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {THEME_PRESETS.map((preset) => (
            <ThemeCard
              key={preset.id}
              preset={preset}
              onClick={() => setActiveTheme(preset.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function ThemeCard({ preset, onClick }: { preset: ThemePreset; onClick: () => void }) {
  const tokens = useMemo(() => {
    return getStoreTokens({
      primary_color: preset.patch.primary_color ?? "#6d28d9",
      secondary_color: preset.patch.secondary_color ?? "#0f172a",
      accent_color: preset.patch.accent_color ?? "#f59e0b",
      background_color: preset.patch.background_color ?? "#ffffff",
      font_family: preset.patch.font_family ?? "Inter",
      border_radius: preset.patch.border_radius ?? "medium",
      button_style: preset.patch.button_style ?? "rounded",
    } as Tables<"store_settings">);
  }, [preset]);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-xl hover:scale-[1.02] text-left"
    >
      {/* Color preview */}
      <div
        className="relative h-40 overflow-hidden"
        style={{ backgroundColor: tokens.bg }}
      >
        {/* Mini storefront preview */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[85%] flex flex-col items-center gap-2">
            <div
              className="text-sm font-bold tracking-tight"
              style={{ color: tokens.fg, fontFamily: tokens.fontHeading }}
            >
              {preset.brandName}
            </div>
            <div className="flex gap-1.5">
              {[tokens.primary, tokens.accent, tokens.secondary].map((c, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border border-white/20"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-1 mt-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-10 h-12"
                  style={{
                    backgroundColor: tokens.surface,
                    borderRadius: tokens.radius.sm,
                    border: `1px solid ${tokens.border}`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 text-white text-sm font-semibold">
            <Eye className="h-4 w-4" />
            Preview
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm">{preset.name}</h3>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {preset.layout}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{preset.niche}</p>
        <p className="text-xs text-muted-foreground mt-1">{preset.tagline}</p>
        <div className="flex flex-wrap gap-1 mt-3">
          {preset.highlights.map((h) => (
            <span
              key={h}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground"
            >
              {h}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}

function ThemePreview({ preset, onBack }: { preset: ThemePreset; onBack: () => void }) {
  const products = useMemo(() => getDemoProducts(preset.id), [preset.id]);

  const tokens = useMemo(() => {
    return getStoreTokens({
      primary_color: preset.patch.primary_color ?? "#6d28d9",
      secondary_color: preset.patch.secondary_color ?? "#0f172a",
      accent_color: preset.patch.accent_color ?? "#f59e0b",
      background_color: preset.patch.background_color ?? "#ffffff",
      font_family: preset.patch.font_family ?? "Inter",
      border_radius: preset.patch.border_radius ?? "medium",
      button_style: preset.patch.button_style ?? "rounded",
    } as Tables<"store_settings">);
  }, [preset]);

  const handleAdd = useCallback((p: DemoProduct) => {
    // Visual feedback only in preview
  }, []);

  const LayoutComponent = LAYOUT_COMPONENTS[preset.layout];

  const layoutProps: LayoutProps = {
    products,
    tokens,
    currency: "USD",
    brandName: preset.brandName,
    heroHeading: preset.heroHeading,
    heroSubheading: preset.heroSubheading,
    heroCta: preset.heroCta,
    onAddToCart: handleAdd,
  };

  return (
    <div style={{ backgroundColor: tokens.bg, color: tokens.fg, fontFamily: tokens.fontFamily }}>
      {/* Floating toolbar */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-black/80 backdrop-blur-xl text-white shadow-2xl">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Gallery
        </button>
        <div className="w-px h-5 bg-white/20" />
        <span className="text-xs font-bold">{preset.brandName}</span>
        <span className="text-[10px] text-white/50 uppercase tracking-wider">{preset.niche}</span>
      </div>

      {/* Storefront shell simulation */}
      <header
        className="sticky top-0 z-30 px-6 h-16 flex items-center justify-between"
        style={{
          backgroundColor: tokens.bg + "f5",
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <span className="text-base font-bold" style={{ fontFamily: tokens.fontHeading }}>
          {preset.brandName}
        </span>
        <div className="flex items-center gap-4 text-xs" style={{ color: tokens.muted }}>
          <span>Shop</span>
          <span>About</span>
          <span>Contact</span>
          <ShoppingBag className="h-4 w-4" style={{ color: tokens.fg }} />
        </div>
      </header>

      {/* Layout */}
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: tokens.muted }} />
          </div>
        }
      >
        <LayoutComponent {...layoutProps} />
      </Suspense>

      {/* Footer */}
      <footer
        className="px-6 py-12 text-center text-xs"
        style={{ backgroundColor: tokens.surface, color: tokens.muted, borderTop: `1px solid ${tokens.border}` }}
      >
        <p className="font-semibold" style={{ color: tokens.fg }}>{preset.brandName}</p>
        <p className="mt-2">This is a theme preview. Start building your store with this theme today.</p>
        <Link
          to="/signup"
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
          style={{
            backgroundColor: tokens.primary,
            color: tokens.onPrimary,
            borderRadius: tokens.buttonRadius,
          }}
        >
          Start Free Trial
        </Link>
      </footer>
    </div>
  );
}
