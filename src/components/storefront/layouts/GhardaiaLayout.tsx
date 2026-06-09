import { ArrowRight, ShoppingBag, Quote } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function GhardaiaLayout({
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
  const featured = products.slice(0, 8);

  return (
    <div style={{ fontFamily: t.fontFamily, backgroundColor: t.bg, color: t.fg }}>
      {/* Hero — Deep blue with geometric accents */}
      <section
        className="relative px-6 py-20 md:py-32 overflow-hidden"
        style={{ backgroundColor: t.primary }}
      >
        {/* Geometric shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full"
            style={{ border: `2px solid ${t.onPrimary}20` }}
          />
          <div
            className="absolute top-1/3 -left-16 w-40 h-40 rounded-full"
            style={{ border: `2px solid ${t.onPrimary}15` }}
          />
          <div
            className="absolute bottom-10 right-1/4 w-24 h-24 rounded-full"
            style={{ backgroundColor: t.onPrimary + "08" }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-px h-32 -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: t.onPrimary + "15" }}
          />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-6"
            dir="auto"
            style={{ color: t.onPrimary, opacity: 0.6 }}
          >
            {brandName}
          </p>
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            dir="auto"
            style={{ color: t.onPrimary, fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p
            className="text-base md:text-lg max-w-xl mx-auto mb-10"
            dir="auto"
            style={{ color: t.onPrimary, opacity: 0.75 }}
          >
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold transition-transform hover:scale-105"
            style={{
              backgroundColor: t.onPrimary,
              color: t.primary,
              borderRadius: t.radius.md,
            }}
            dir="auto"
          >
            {heroCta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Products — White cards with deep blue left border */}
      {featured.length > 0 && (
        <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
          <h2
            className="text-2xl md:text-3xl font-bold mb-10"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Our Collection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {featured.map((p) => (
              <div key={p.id} className="group">
                <div
                  className="relative overflow-hidden mb-3"
                  style={{
                    borderRadius: t.radius.md,
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
                        borderRadius: t.radius.sm,
                      }}
                    >
                      {p.badge === "best-seller" ? "★ Best" : p.badge}
                    </span>
                  )}
                </div>
                <div className="pl-3" style={{ borderLeft: `3px solid ${t.primary}` }}>
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
                        className="h-7 w-7 flex items-center justify-center transition-colors"
                        style={{
                          backgroundColor: t.primary,
                          color: t.onPrimary,
                          borderRadius: t.radius.sm,
                        }}
                      >
                        <ShoppingBag className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Testimonials */}
      <section className="px-6 py-16" style={{ backgroundColor: t.surface }}>
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold mb-10 text-center"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            What Our Customers Say
          </h2>
          <div
            className="relative p-8 md:p-12"
            style={{
              backgroundColor: t.bg,
              borderRadius: t.radius.lg,
              border: `1px solid ${t.border}`,
            }}
          >
            <Quote className="h-10 w-10 mb-4" style={{ color: t.primary, opacity: 0.3 }} />
            <p
              className="text-lg md:text-xl leading-relaxed mb-6"
              dir="auto"
              style={{ color: t.fg }}
            >
              Absolutely love the quality and attention to detail. Every piece feels crafted with
              care. This is exactly what I was looking for.
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{ backgroundColor: t.primary + "20", color: t.primary }}
              >
                A
              </div>
              <div>
                <p className="text-sm font-semibold" dir="auto">
                  Amina K.
                </p>
                <p className="text-xs" dir="auto" style={{ color: t.muted }}>
                  Verified Buyer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter — Deep blue bg */}
      <section className="px-6 py-20" style={{ backgroundColor: t.primary }}>
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            dir="auto"
            style={{ color: t.onPrimary, fontFamily: t.fontHeading }}
          >
            Join Our Newsletter
          </h2>
          <p className="text-sm mb-8" dir="auto" style={{ color: t.onPrimary, opacity: 0.8 }}>
            Get the latest updates and exclusive offers.
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
                borderRadius: t.radius.md,
                border: `1px solid rgba(255,255,255,0.25)`,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
              style={{
                backgroundColor: t.onPrimary,
                color: t.primary,
                borderRadius: t.radius.md,
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
