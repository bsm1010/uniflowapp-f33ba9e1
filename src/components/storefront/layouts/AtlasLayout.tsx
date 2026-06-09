import { ArrowRight, ShoppingBag, TreePine, Leaf, Recycle, Heart } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function AtlasLayout({
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
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div style={{ fontFamily: t.fontFamily, backgroundColor: t.bg, color: t.fg }}>
      {/* Hero — Radial gradient overlay */}
      <section
        className="relative overflow-hidden px-6 py-24 md:py-32"
        style={{
          background: `radial-gradient(ellipse at center, ${t.primary}15 0%, ${t.bg} 70%)`,
        }}
      >
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-6">
            <TreePine className="h-5 w-5" style={{ color: t.primary }} />
            <Leaf className="h-5 w-5" style={{ color: t.primary }} />
            <Recycle className="h-5 w-5" style={{ color: t.primary }} />
          </div>
          <p
            className="text-xs uppercase tracking-[0.35em] mb-4"
            dir="auto"
            style={{ color: t.muted }}
          >
            {brandName}
          </p>
          <h1
            className="text-4xl md:text-6xl font-bold leading-tight mb-6"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p
            className="text-base md:text-lg max-w-xl mx-auto mb-8"
            dir="auto"
            style={{ color: t.muted }}
          >
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold transition-transform hover:scale-105"
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

      {/* Stats Bar */}
      <section
        className="px-6 py-8"
        style={{
          backgroundColor: t.surface,
          borderTop: `1px solid ${t.border}`,
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6">
          {[
            { value: products.length, label: "Products" },
            { value: categories.length, label: "Categories" },
            { value: "Eco", label: "Sustainable" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color: t.primary }}>
                {stat.value}
              </div>
              <div
                className="text-[10px] uppercase tracking-wider"
                dir="auto"
                style={{ color: t.muted }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
        <h2
          className="text-2xl md:text-3xl font-bold mb-10"
          dir="auto"
          style={{ fontFamily: t.fontHeading }}
        >
          Shop Sustainably
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <div key={p.id} className="group">
              <div
                className="relative overflow-hidden mb-3 transition-colors"
                style={{
                  borderRadius: t.radius.lg + 4,
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
                {p.badge && (
                  <span
                    className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1"
                    style={{
                      backgroundColor:
                        p.badge === "sale" ? t.accent : p.badge === "new" ? t.primary : "#f59e0b",
                      color: "#fff",
                      borderRadius: t.radius.pill,
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
              <Link to="/s/$slug/p/$productId" params={{ slug, productId: p.id }}>
                <h3 className="text-sm font-semibold mb-1" dir="auto">
                  {p.name}
                </h3>
              </Link>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">{formatPrice(p.price, currency)}</span>
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(p)}
                    className="h-8 w-8 flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: t.primary,
                      color: t.onPrimary,
                      borderRadius: t.radius.pill,
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

      {/* Newsletter — Earth tones, organic shapes */}
      <section className="px-6 py-20" style={{ backgroundColor: t.surface }}>
        <div
          className="max-w-xl mx-auto text-center px-8 py-12"
          style={{ borderRadius: t.radius.lg + 8 }}
        >
          <Leaf className="h-8 w-8 mx-auto mb-4" style={{ color: t.primary }} />
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Go Green With Us
          </h2>
          <p className="text-sm mb-8" dir="auto" style={{ color: t.muted }}>
            Join our community of conscious shoppers.
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
                borderRadius: t.radius.pill,
                border: `1px solid ${t.border}`,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.radius.pill,
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
