import type { Tables } from "@/integrations/supabase/types";
import { ShoppingBag, Search, Heart, User, Mail } from "lucide-react";

export type StoreSettings = Tables<"store_settings">;

const FONT_STACK: Record<string, string> = {
  Inter: '"Inter", system-ui, sans-serif',
  "Space Grotesk": '"Space Grotesk", "Inter", sans-serif',
  Playfair: '"Playfair Display", Georgia, serif',
  "DM Serif": '"DM Serif Display", Georgia, serif',
  Mono: '"JetBrains Mono", ui-monospace, monospace',
};

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#0f172a";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0f172a" : "#ffffff";
}

interface Props {
  settings: StoreSettings;
  products?: { name: string; price: number; images: string[] }[];
}

export function StorePreview({ settings, products = [] }: Props) {
  const bg = settings.background_color;
  const primary = settings.primary_color;
  const onPrimary = readableOn(primary);
  const fontFamily = FONT_STACK[settings.font_family] ?? FONT_STACK.Inter;

  const isDarkBg = readableOn(bg) === "#ffffff";
  const fg = isDarkBg ? "#f8fafc" : "#0f172a";
  const muted = isDarkBg ? "#94a3b8" : "#64748b";
  const border = isDarkBg ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const surface = isDarkBg ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)";

  const sample = products.length
    ? products.slice(0, 6)
    : Array.from({ length: 6 }).map((_, i) => ({
        name: `Sample Product ${i + 1}`,
        price: 29 + i * 10,
        images: [],
      }));

  const grid =
    settings.theme === "minimal"
      ? "grid-cols-2 gap-8"
      : settings.theme === "grid"
        ? "grid-cols-3 gap-3"
        : "grid-cols-3 gap-5";

  const cardRadius =
    settings.theme === "minimal"
      ? "rounded-none"
      : settings.theme === "grid"
        ? "rounded-md"
        : "rounded-2xl";

  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{ backgroundColor: bg, color: fg, fontFamily }}
    >
      {/* Topbar */}
      <div
        className="sticky top-0 z-10 backdrop-blur"
        style={{
          backgroundColor: bg + "e6",
          borderBottom: `1px solid ${border}`,
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
              <div
                className="h-7 w-7 rounded"
                style={{ backgroundColor: primary }}
              />
            )}
            <span className="font-semibold text-sm tracking-tight">
              {settings.store_name}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs" style={{ color: muted }}>
            <span>Shop</span>
            <span>Collections</span>
            <span>About</span>
            <span>Contact</span>
          </div>
          <div className="flex items-center gap-3" style={{ color: muted }}>
            <Search className="h-4 w-4" />
            <Heart className="h-4 w-4" />
            <User className="h-4 w-4" />
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Hero */}
      {settings.show_hero && (
        <div
          className="px-6 py-16 text-center"
          style={{ borderBottom: `1px solid ${border}` }}
        >
          <h1
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ fontFamily }}
          >
            {settings.hero_heading}
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-xl mx-auto" style={{ color: muted }}>
            {settings.hero_subheading}
          </p>
          <button
            className="mt-8 px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: primary,
              color: onPrimary,
              borderRadius:
                settings.theme === "minimal"
                  ? 0
                  : settings.theme === "grid"
                    ? 6
                    : 999,
            }}
          >
            {settings.hero_cta_label}
          </button>
        </div>
      )}

      {/* Categories */}
      {settings.show_categories && (
        <div className="px-6 py-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Shop by category</h2>
            <span className="text-xs" style={{ color: muted }}>
              View all
            </span>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {["Apparel", "Accessories", "Home", "Beauty"].map((c) => (
              <div
                key={c}
                className={`aspect-[4/3] flex items-end p-3 text-xs font-medium ${cardRadius}`}
                style={{
                  backgroundColor: surface,
                  border: `1px solid ${border}`,
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
        <div className="px-6 py-10" style={{ borderTop: `1px solid ${border}` }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold">Featured products</h2>
            <span className="text-xs" style={{ color: muted }}>
              See all
            </span>
          </div>
          <div className={`grid ${grid}`}>
            {sample.map((p, i) => (
              <div key={i} className="group">
                <div
                  className={`aspect-square overflow-hidden ${cardRadius}`}
                  style={{
                    backgroundColor: surface,
                    border: `1px solid ${border}`,
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
                        background: `linear-gradient(135deg, ${primary}22, ${primary}05)`,
                      }}
                    />
                  )}
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    ${p.price.toFixed(2)}
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
            backgroundColor: surface,
            borderTop: `1px solid ${border}`,
          }}
        >
          <Mail className="h-6 w-6 mx-auto" style={{ color: primary }} />
          <h3 className="mt-3 text-xl font-semibold">Join our newsletter</h3>
          <p className="mt-1 text-sm" style={{ color: muted }}>
            Get 10% off your first order.
          </p>
          <div className="mt-5 flex max-w-sm mx-auto gap-2">
            <input
              placeholder="Your email"
              className="flex-1 px-3 py-2 text-sm outline-none"
              style={{
                backgroundColor: bg,
                color: fg,
                border: `1px solid ${border}`,
                borderRadius: settings.theme === "minimal" ? 0 : 8,
              }}
            />
            <button
              className="px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: primary,
                color: onPrimary,
                borderRadius: settings.theme === "minimal" ? 0 : 8,
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      )}

      <div
        className="px-6 py-6 text-center text-xs"
        style={{ color: muted, borderTop: `1px solid ${border}` }}
      >
        © {new Date().getFullYear()} {settings.store_name}. Powered by Storely.
      </div>
    </div>
  );
}
