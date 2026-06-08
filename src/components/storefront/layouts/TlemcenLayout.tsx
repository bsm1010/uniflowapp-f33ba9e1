import { ArrowRight, ShoppingBag, Crown, Gem, Sparkles } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function TlemcenLayout({
  products,
  tokens: t,
  currency,
  brandName,
  heroHeading,
  heroSubheading,
  heroCta,
  onAddToCart,
}: LayoutProps) {
  return (
    <div style={{ fontFamily: t.fontFamily, backgroundColor: t.bg, color: t.fg }}>
      {/* Hero — Dark background with gold double border frame */}
      <section
        className="px-6 py-20 md:py-28"
        style={{ backgroundColor: t.surface }}
      >
        <div
          className="max-w-5xl mx-auto text-center p-12 md:p-20 relative"
          style={{
            border: `3px double ${t.primary}`,
            borderRadius: t.radius.lg,
          }}
        >
          <div
            className="absolute inset-4 pointer-events-none"
            style={{
              border: `1px solid ${t.primary}40`,
              borderRadius: t.radius.md,
            }}
          />
          <div className="flex items-center justify-center gap-3 mb-6">
            <Crown className="h-5 w-5" style={{ color: t.primary }} />
            <Gem className="h-5 w-5" style={{ color: t.primary }} />
            <Sparkles className="h-5 w-5" style={{ color: t.primary }} />
          </div>
          <p
            className="text-xs uppercase tracking-[0.4em] mb-6 relative z-10"
            dir="auto"
            style={{ color: t.primary }}
          >
            {brandName}
          </p>
          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 relative z-10"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p
            className="text-base md:text-lg max-w-xl mx-auto mb-8 relative z-10"
            dir="auto"
            style={{ color: t.muted }}
          >
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="relative z-10 inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold uppercase tracking-wider transition-transform hover:scale-105"
            style={{
              backgroundColor: t.primary,
              color: t.onPrimary,
              borderRadius: t.buttonRadius,
            }}
            dir="auto"
          >
            {heroCta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Heritage Section */}
      <section
        className="px-6 py-16"
        style={{ borderBottom: `1px solid ${t.border}` }}
      >
        <div
          className="max-w-3xl mx-auto text-center px-8 py-12 relative"
          style={{
            borderTop: `2px solid ${t.primary}`,
            borderBottom: `2px solid ${t.primary}`,
          }}
        >
          <h2
            className="text-2xl md:text-3xl font-bold mb-4"
            dir="auto"
            style={{ fontFamily: t.fontHeading, color: t.primary }}
          >
            Our Heritage
          </h2>
          <p
            className="text-sm md:text-base leading-relaxed max-w-lg mx-auto"
            dir="auto"
            style={{ color: t.muted }}
          >
            Rooted in tradition, crafted with passion. Every piece tells a story
            of artisanal excellence and timeless beauty passed down through
            generations.
          </p>
          <div
            className="w-12 h-0.5 mx-auto mt-6"
            style={{ backgroundColor: t.primary }}
          />
        </div>
      </section>

      {/* Product Grid */}
      <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
        <h2
          className="text-2xl md:text-3xl font-bold mb-10"
          dir="auto"
          style={{ fontFamily: t.fontHeading }}
        >
          Curated Collection
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {products.map((p) => (
            <div key={p.id} className="group">
              <div
                className="relative overflow-hidden mb-3 transition-all"
                style={{
                  borderRadius: t.radius.md,
                  aspectRatio: "3/4",
                  backgroundColor: t.surface,
                  border: `2px solid ${t.primary}25`,
                }}
              >
                <Img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(0deg, ${t.primary}20, transparent 50%)`,
                  }}
                />
                {p.badge && (
                  <span
                    className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1"
                    style={{
                      backgroundColor: p.badge === "sale" ? t.accent : t.primary,
                      color: t.onPrimary,
                      borderRadius: t.radius.sm,
                    }}
                  >
                    {p.badge === "best-seller" ? "★ Best" : p.badge}
                  </span>
                )}
              </div>
              <p
                className="text-[10px] uppercase tracking-wider mb-1"
                dir="auto"
                style={{ color: t.muted }}
              >
                {p.category}
              </p>
              <h3 className="text-sm font-semibold mb-1" dir="auto">{p.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">
                  {formatPrice(p.price, currency)}
                </span>
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(p)}
                    className="h-8 w-8 flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: t.primary,
                      color: t.onPrimary,
                      borderRadius: t.radius.sm,
                    }}
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter — Dark background with gold text */}
      <section
        className="px-6 py-20"
        style={{ backgroundColor: t.surface }}
      >
        <div className="max-w-xl mx-auto text-center">
          <Crown className="h-6 w-6 mx-auto mb-4" style={{ color: t.primary }} />
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            dir="auto"
            style={{ fontFamily: t.fontHeading, color: t.primary }}
          >
            Royal Updates
          </h2>
          <p
            className="text-sm mb-8"
            dir="auto"
            style={{ color: t.muted }}
          >
            Be the first to discover new treasures and exclusive collections.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 px-4 py-3 text-sm outline-none"
              dir="auto"
              style={{
                backgroundColor: t.bg,
                color: t.fg,
                borderRadius: t.buttonRadius,
                border: `1px solid ${t.primary}40`,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
              }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
