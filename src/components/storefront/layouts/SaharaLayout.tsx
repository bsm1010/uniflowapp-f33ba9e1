import { ArrowRight, ShoppingBag, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function SaharaLayout({
  products,
  tokens: t,
  currency,
  slug,
  brandName,
  heroHeading,
  heroSubheading,
  heroCta,
  onAddToCart,
}: LayoutProps) {
  const featured = products.slice(0, 6);

  return (
    <div style={{ fontFamily: t.fontFamily, backgroundColor: t.bg, color: t.fg }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden px-6 py-20 md:py-32"
        style={{
          background: `linear-gradient(160deg, ${t.surface} 0%, ${t.bg} 50%, ${t.primary}12 100%)`,
        }}
      >
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <p
            className="text-xs uppercase tracking-[0.35em] mb-6"
            dir="auto"
            style={{ color: t.muted }}
          >
            {brandName}
          </p>
          <div className="w-16 h-0.5 mx-auto mb-8" style={{ backgroundColor: t.primary }} />
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p
            className="mt-6 text-lg md:text-xl max-w-2xl mx-auto"
            dir="auto"
            style={{ color: t.muted }}
          >
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="mt-10 inline-flex items-center gap-3 px-10 py-4 text-sm font-semibold uppercase tracking-wider transition-transform hover:scale-105"
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

      {/* Featured Treasures */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16">
          <h2
            className="text-2xl md:text-3xl font-bold mb-2"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Featured Treasures
          </h2>
          <div className="w-12 h-0.5 mb-10" style={{ backgroundColor: t.primary }} />
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
            {featured.map((p) => (
              <Link
                key={p.id}
                to="/s/$slug/p/$productId"
                params={{ slug, productId: p.id }}
                className="snap-start shrink-0 w-72 md:w-80 group"
              >
                <div
                  className="relative overflow-hidden mb-4"
                  style={{
                    borderRadius: t.radius.lg,
                    aspectRatio: "3/4",
                    backgroundColor: t.surface,
                  }}
                >
                  <Img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full transition-transform duration-700 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(0deg, ${t.bg}ee 0%, transparent 50%)`,
                    }}
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-base font-semibold mb-1" dir="auto">
                      {p.name}
                    </h3>
                    <span className="text-sm font-bold">{formatPrice(p.price, currency)}</span>
                  </div>
                  {p.badge && (
                    <span
                      className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1"
                      style={{
                        backgroundColor:
                          p.badge === "sale" ? t.accent : p.badge === "new" ? t.primary : "#f59e0b",
                        color: "#fff",
                        borderRadius: t.radius.sm,
                      }}
                    >
                      {p.badge === "best-seller" ? "★ Best" : p.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Product Grid */}
      <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
        <h2
          className="text-2xl md:text-3xl font-bold mb-10"
          dir="auto"
          style={{ fontFamily: t.fontHeading }}
        >
          All Products
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <div key={p.id} className="group">
              <div
                className="relative overflow-hidden mb-3"
                style={{
                  borderRadius: t.radius.lg,
                  aspectRatio: "1/1",
                  backgroundColor: t.surface,
                }}
              >
                <Link
                  to="/s/$slug/p/$productId"
                  params={{ slug, productId: p.id }}
                  className="block"
                >
                  <Img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </Link>
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(0deg, ${t.bg}cc 0%, transparent 40%)`,
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <Link to="/s/$slug/p/$productId" params={{ slug, productId: p.id }}>
                    <h3 className="text-sm font-semibold line-clamp-2" dir="auto">
                      {p.name}
                    </h3>
                  </Link>
                  <span className="text-sm font-bold mt-1 block">
                    {formatPrice(p.price, currency)}
                  </span>
                </div>
                {p.badge && (
                  <span
                    className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5"
                    style={{
                      backgroundColor:
                        p.badge === "sale" ? t.accent : p.badge === "new" ? t.primary : "#f59e0b",
                      color: "#fff",
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
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{formatPrice(p.price, currency)}</span>
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

      {/* Newsletter */}
      <section className="px-6 py-20" style={{ backgroundColor: t.primary }}>
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            dir="auto"
            style={{ color: t.onPrimary, fontFamily: t.fontHeading }}
          >
            Join Our Newsletter
          </h2>
          <p className="text-sm mb-8" dir="auto" style={{ color: t.onPrimary, opacity: 0.85 }}>
            Get exclusive offers and first access to new arrivals.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              placeholder="Your email address"
              className="flex-1 px-4 py-3 text-sm outline-none"
              dir="auto"
              style={{
                backgroundColor: "rgba(255,255,255,0.15)",
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
                border: `1px solid rgba(255,255,255,0.25)`,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
              style={{
                backgroundColor: t.onPrimary,
                color: t.primary,
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
