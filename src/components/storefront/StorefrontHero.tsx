import type { StoreSettings, StoreTokens } from "@/lib/storeTheme";

interface Props {
  settings: StoreSettings;
  tokens: StoreTokens;
}

export function StorefrontHero({ settings, tokens: t }: Props) {
  const layout = settings.hero_layout || "centered";
  const img = settings.hero_image_url;

  const cta = (
    <a
      href="#shop"
      className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold transition-all hover:opacity-90 hover:scale-[1.02]"
      style={{
        backgroundColor: t.primary,
        color: t.onPrimary,
        borderRadius: t.buttonRadius,
        boxShadow: `0 10px 30px -10px ${t.primary}55`,
      }}
    >
      {settings.hero_cta_label}
    </a>
  );

  if (layout === "fullbleed" && img) {
    return (
      <section
        className="relative overflow-hidden"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <div
          className="relative min-h-[480px] md:min-h-[600px] flex items-center"
          style={{
            backgroundImage: `url(${img})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, ${t.bg}10 0%, ${t.bg}cc 100%)`,
            }}
          />
          <div className="relative max-w-3xl mx-auto px-6 py-20 text-center">
            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight"
              style={{ color: t.fg }}
            >
              {settings.hero_heading}
            </h1>
            <p
              className="mt-5 text-base md:text-lg max-w-xl mx-auto"
              style={{ color: t.fg, opacity: 0.85 }}
            >
              {settings.hero_subheading}
            </p>
            <div className="mt-8">{cta}</div>
          </div>
        </div>
      </section>
    );
  }

  if (layout === "split" && img) {
    return (
      <section
        className="px-4 sm:px-6 py-12 md:py-20"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div
              className="inline-block text-xs font-semibold uppercase tracking-[0.2em] mb-4 px-3 py-1"
              style={{
                backgroundColor: t.accent + "22",
                color: t.accent,
                borderRadius: t.radius.sm,
              }}
            >
              New season
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              {settings.hero_heading}
            </h1>
            <p className="mt-5 text-base md:text-lg" style={{ color: t.muted }}>
              {settings.hero_subheading}
            </p>
            <div className="mt-8">{cta}</div>
          </div>
          <div
            className="aspect-[4/5] overflow-hidden order-first md:order-last"
            style={{
              borderRadius: t.radius.lg,
              border: `1px solid ${t.border}`,
            }}
          >
            <img
              src={img}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>
    );
  }

  // Centered (default) — gradient bg if no image
  return (
    <section
      className="relative px-4 sm:px-6 py-20 md:py-28 text-center overflow-hidden"
      style={{
        borderBottom: `1px solid ${t.border}`,
        background: img
          ? `url(${img}) center/cover`
          : `radial-gradient(ellipse at top, ${t.primary}15, transparent 60%), ${t.bg}`,
      }}
    >
      {img && (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${t.bg}aa 0%, ${t.bg}ee 100%)`,
          }}
        />
      )}
      <div className="relative max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          {settings.hero_heading}
        </h1>
        <p
          className="mt-5 text-base md:text-lg max-w-xl mx-auto"
          style={{ color: t.muted }}
        >
          {settings.hero_subheading}
        </p>
        <div className="mt-8">{cta}</div>
      </div>
    </section>
  );
}
