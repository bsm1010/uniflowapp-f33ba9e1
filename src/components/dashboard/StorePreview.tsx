import { ShoppingBag, Search, Heart, User, Mail, Instagram, Facebook, Twitter } from "lucide-react";
import {
  getStoreTokens,
  getNavLinks,
  getButtonLabels,
  getSectionTitles,
  getFooterSocials,
  getSectionOrder,
  formatPrice,
  type StoreSettings,
} from "@/lib/storeTheme";

// Re-export for backwards compatibility
export type { StoreSettings } from "@/lib/storeTheme";

interface Props {
  settings: StoreSettings;
  products?: { name: string; price: number; images: string[] }[];
}

export function StorePreview({ settings, products = [] }: Props) {
  const t = getStoreTokens(settings);
  const navLinks = getNavLinks(settings);
  const labels = getButtonLabels(settings);
  const titles = getSectionTitles(settings);
  const socials = getFooterSocials(settings);
  const currency = settings.currency || "USD";
  const template = settings.theme;

  const sample = products.length
    ? products.slice(0, template === "grid" ? 8 : 6)
    : Array.from({ length: 6 }).map((_, i) => ({
        name: `Sample Product ${i + 1}`,
        price: 29 + i * 10,
        images: [],
      }));

  const grid =
    template === "minimal"
      ? "grid-cols-2 gap-6"
      : template === "grid"
        ? "grid-cols-3 gap-3"
        : template === "editorial"
          ? "grid-cols-2 gap-5"
          : "grid-cols-3 gap-4";

  const cardRadius = template === "minimal" ? 0 : t.radius.lg;
  const aspect = template === "editorial" ? "3 / 4" : "1 / 1";

  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{
        backgroundColor: t.bg,
        color: t.fg,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Topbar */}
      <div
        className="sticky top-0 z-10 backdrop-blur-md"
        style={{
          backgroundColor: t.bg + "e6",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.store_name}
                className="h-7 w-7 rounded object-cover"
              />
            ) : (
              <div className="h-7 w-7 rounded" style={{ backgroundColor: t.primary }} />
            )}
            <span className="font-semibold text-sm tracking-tight">
              {settings.store_name}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs" style={{ color: t.muted }}>
            {navLinks.slice(0, 4).map((l) => (
              <span key={l.label}>{l.label}</span>
            ))}
          </div>
          <div className="flex items-center gap-3" style={{ color: t.muted }}>
            <Search className="h-4 w-4" />
            <Heart className="h-4 w-4" />
            <User className="h-4 w-4" />
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Hero */}
      {settings.show_hero && (
        <HeroPreview settings={settings} t={t} />
      )}

      {/* Categories */}
      {settings.show_categories && (
        <div className="px-6 py-10">
          <div className="mb-5">
            <h2 className="text-lg font-bold">{titles.categories}</h2>
            <p className="text-xs mt-0.5" style={{ color: t.muted }}>
              {titles.categories_sub}
            </p>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {["Apparel", "Accessories", "Home", "Beauty"].map((c) => (
              <div
                key={c}
                className="aspect-[4/3] flex items-end p-3 text-xs font-medium"
                style={{
                  backgroundColor: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius.md,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      {settings.show_featured && (
        <div className="px-6 py-10" style={{ borderTop: `1px solid ${t.border}` }}>
          <div className="flex items-end justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold">{titles.featured}</h2>
              <p className="text-xs mt-0.5" style={{ color: t.muted }}>
                {titles.featured_sub}
              </p>
            </div>
            <span className="text-xs font-medium" style={{ color: t.primary }}>
              {labels.view_all}
            </span>
          </div>

          {/* Search bar preview */}
          {settings.show_search && (
            <div
              className="flex items-center gap-2 mb-4 px-3 py-2"
              style={{
                backgroundColor: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: t.radius.md,
              }}
            >
              <Search className="h-3.5 w-3.5" style={{ color: t.muted }} />
              <span className="text-xs" style={{ color: t.muted }}>
                {labels.search_placeholder}
              </span>
            </div>
          )}

          <div className={`grid ${grid}`}>
            {sample.map((p, i) => (
              <div key={i} className="group">
                <div
                  className="overflow-hidden relative"
                  style={{
                    backgroundColor: t.surface,
                    border: template === "minimal" ? "none" : `1px solid ${t.border}`,
                    borderRadius: cardRadius,
                    aspectRatio: aspect,
                  }}
                >
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background: `linear-gradient(135deg, ${t.primary}22, ${t.accent}10)`,
                      }}
                    />
                  )}
                </div>
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <span className="text-xs font-medium line-clamp-1">{p.name}</span>
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {formatPrice(p.price, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Newsletter */}
      {settings.show_newsletter && (
        <div
          className="px-6 py-12 text-center"
          style={{
            backgroundColor: t.surface,
            borderTop: `1px solid ${t.border}`,
          }}
        >
          <Mail className="h-6 w-6 mx-auto" style={{ color: t.primary }} />
          <h3 className="mt-3 text-xl font-bold">{titles.newsletter}</h3>
          <p className="mt-1 text-sm" style={{ color: t.muted }}>
            {titles.newsletter_sub}
          </p>
          <div className="mt-5 flex max-w-sm mx-auto gap-2">
            <input
              placeholder="you@email.com"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: t.bg,
                color: t.fg,
                border: `1px solid ${t.border}`,
                borderRadius: t.buttonRadius,
              }}
            />
            <button
              className="px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
              }}
            >
              {labels.subscribe}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div
        className="px-6 py-8"
        style={{ borderTop: `1px solid ${t.border}`, color: t.muted }}
      >
        <p className="text-xs max-w-md leading-relaxed">{settings.footer_about}</p>
        <div className="mt-3 flex gap-2">
          {socials.instagram && (
            <span
              className="h-7 w-7 rounded-full inline-flex items-center justify-center"
              style={{ backgroundColor: t.surfaceStrong }}
            >
              <Instagram className="h-3.5 w-3.5" style={{ color: t.fg }} />
            </span>
          )}
          {socials.facebook && (
            <span
              className="h-7 w-7 rounded-full inline-flex items-center justify-center"
              style={{ backgroundColor: t.surfaceStrong }}
            >
              <Facebook className="h-3.5 w-3.5" style={{ color: t.fg }} />
            </span>
          )}
          {socials.twitter && (
            <span
              className="h-7 w-7 rounded-full inline-flex items-center justify-center"
              style={{ backgroundColor: t.surfaceStrong }}
            >
              <Twitter className="h-3.5 w-3.5" style={{ color: t.fg }} />
            </span>
          )}
        </div>
        <div className="mt-4 text-xs">
          {settings.footer_copyright?.trim()
            ? settings.footer_copyright
            : `© ${new Date().getFullYear()} ${settings.store_name}.`}
        </div>
      </div>
    </div>
  );
}

function HeroPreview({
  settings,
  t,
}: {
  settings: StoreSettings;
  t: ReturnType<typeof getStoreTokens>;
}) {
  const layout = settings.hero_layout || "centered";
  const img = settings.hero_image_url;

  if (layout === "split" && img) {
    return (
      <div
        className="px-6 py-10 grid grid-cols-2 gap-6 items-center"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight leading-tight">
            {settings.hero_heading}
          </h1>
          <p className="mt-2 text-xs" style={{ color: t.muted }}>
            {settings.hero_subheading}
          </p>
          <button
            className="mt-4 px-4 py-2 text-xs font-semibold"
            style={{
              backgroundColor: t.primary,
              color: t.onPrimary,
              borderRadius: t.buttonRadius,
            }}
          >
            {settings.hero_cta_label}
          </button>
        </div>
        <div
          className="aspect-[4/5] overflow-hidden"
          style={{ borderRadius: t.radius.lg }}
        >
          <img src={img} alt="" className="h-full w-full object-cover" />
        </div>
      </div>
    );
  }

  if (layout === "fullbleed" && img) {
    return (
      <div
        className="relative px-6 py-16 text-center"
        style={{
          backgroundImage: `url(${img})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${t.bg}10, ${t.bg}cc)`,
          }}
        />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: t.fg }}>
            {settings.hero_heading}
          </h1>
          <p className="mt-2 text-sm max-w-xs mx-auto" style={{ color: t.fg, opacity: 0.85 }}>
            {settings.hero_subheading}
          </p>
          <button
            className="mt-5 px-5 py-2.5 text-sm font-semibold"
            style={{
              backgroundColor: t.primary,
              color: t.onPrimary,
              borderRadius: t.buttonRadius,
            }}
          >
            {settings.hero_cta_label}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative px-6 py-16 text-center overflow-hidden"
      style={{
        borderBottom: `1px solid ${t.border}`,
        background: img
          ? `url(${img}) center/cover`
          : `radial-gradient(ellipse at top, ${t.primary}15, transparent 60%)`,
      }}
    >
      {img && (
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(180deg, ${t.bg}aa, ${t.bg}ee)` }}
        />
      )}
      <div className="relative">
        <h1 className="text-3xl font-bold tracking-tight">{settings.hero_heading}</h1>
        <p className="mt-3 text-sm max-w-xs mx-auto" style={{ color: t.muted }}>
          {settings.hero_subheading}
        </p>
        <button
          className="mt-5 px-5 py-2.5 text-sm font-semibold"
          style={{
            backgroundColor: t.primary,
            color: t.onPrimary,
            borderRadius: t.buttonRadius,
          }}
        >
          {settings.hero_cta_label}
        </button>
      </div>
    </div>
  );
}
