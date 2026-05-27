import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles } from "lucide-react";
import type { StoreSettings, StoreTokens } from "@/lib/storeTheme";

interface Props {
  settings: StoreSettings;
  tokens: StoreTokens;
}

export function StorefrontHero({ settings, tokens: t }: Props) {
  const { t: tr } = useTranslation();
  const layout = settings.hero_layout || "centered";
  const img = settings.hero_image_url;

  const ctaBtn = (
    <a
      href="#shop"
      className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 text-base font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98]"
      style={{
        backgroundColor: t.primary,
        color: t.onPrimary,
        borderRadius: t.buttonRadius,
        boxShadow: `0 12px 40px -12px ${t.primary}66`,
      }}
    >
      {settings.hero_cta_label || tr("storefront.hero.shopNow", { defaultValue: "Shop Now" })}
      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </a>
  );

  const secondaryCta = (
    <a
      href="#featured"
      className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold transition-all duration-300 hover:scale-[1.02]"
      style={{
        backgroundColor: "transparent",
        color: t.fg,
        borderRadius: t.buttonRadius,
        border: `2px solid ${t.border}`,
      }}
    >
      {tr("storefront.hero.explore", { defaultValue: "Explore Collection" })}
    </a>
  );

  if (layout === "fullbleed" && img) {
    return (
      <section className="relative overflow-hidden">
        <div
          className="relative min-h-[560px] md:min-h-[700px] lg:min-h-[80vh] flex items-center"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${t.bg}dd 0%, ${t.bg}88 50%, ${t.bg}44 100%)`,
            }}
          />
          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-24 w-full">
            <div className="max-w-2xl">
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-6 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: t.primary + "18",
                  color: t.primary,
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {tr("storefront.hero.newSeason")}
              </div>
              <h1
                className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.05]"
                style={{ color: t.fg }}
              >
                {settings.hero_heading}
              </h1>
              <p
                className="mt-6 text-lg md:text-xl max-w-lg leading-relaxed"
                style={{ color: t.muted }}
              >
                {settings.hero_subheading}
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                {ctaBtn}
                {secondaryCta}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "split" && img) {
    return (
      <section className="px-5 sm:px-8 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid gap-12 md:grid-cols-2 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-6 px-4 py-2 rounded-full"
              style={{
                backgroundColor: t.accent + "18",
                color: t.accent,
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {tr("storefront.hero.newSeason")}
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
              {settings.hero_heading}
            </h1>
            <p className="mt-6 text-lg md:text-xl leading-relaxed" style={{ color: t.muted }}>
              {settings.hero_subheading}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              {ctaBtn}
              {secondaryCta}
            </div>
          </div>
          <div
            className="aspect-[4/5] overflow-hidden order-first md:order-last group"
            style={{
              borderRadius: t.radius.lg + 8,
            }}
          >
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        </div>
      </section>
    );
  }

  // Centered (default)
  return (
    <section
      className="relative px-5 sm:px-8 py-24 md:py-32 lg:py-40 text-center overflow-hidden"
      style={{
        background: img
          ? `url(${img}) center/cover`
          : `radial-gradient(ellipse at top, ${t.primary}12, transparent 60%), radial-gradient(ellipse at bottom right, ${t.accent}08, transparent 40%), ${t.bg}`,
      }}
    >
      {img && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${t.bg}cc 0%, ${t.bg}ee 100%)`,
          }}
        />
      )}
      <div className="relative max-w-4xl mx-auto">
        <div
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-8 px-4 py-2 rounded-full"
          style={{
            backgroundColor: t.primary + "15",
            color: t.primary,
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {tr("storefront.hero.newSeason")}
        </div>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05]">
          {settings.hero_heading}
        </h1>
        <p
          className="mt-6 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
          style={{ color: t.muted }}
        >
          {settings.hero_subheading}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          {ctaBtn}
          {secondaryCta}
        </div>
      </div>
    </section>
  );
}
