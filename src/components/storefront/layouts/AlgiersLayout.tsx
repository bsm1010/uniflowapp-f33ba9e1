import { ArrowRight, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function AlgiersLayout({
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
      {/* Hero — Gradient black to dark gray, gold accent */}
      <section
        className="px-6 py-20 md:py-32"
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)" }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.5em] mb-6"
            dir="auto"
            style={{ color: t.accent }}
          >
            {brandName}
          </p>
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
            dir="auto"
            style={{ color: "#ffffff", fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <div className="w-24 h-px mx-auto mb-6" style={{ backgroundColor: t.accent }} />
          <p
            className="text-base md:text-lg max-w-xl mx-auto mb-10"
            dir="auto"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="inline-flex items-center gap-3 px-10 py-4 text-sm font-semibold uppercase tracking-widest transition-all hover:bg-opacity-90"
            style={{
              backgroundColor: "transparent",
              color: t.accent,
              border: `2px solid ${t.accent}`,
              borderRadius: t.radius.sm,
            }}
            dir="auto"
          >
            {heroCta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Products — Minimal cards on dark bg */}
      {featured.length > 0 && (
        <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
          <h2
            className="text-2xl md:text-3xl font-bold mb-10"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Premium Selection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
            {featured.map((p) => (
              <div key={p.id} className="group">
                <div
                  className="relative overflow-hidden mb-4 transition-all duration-300"
                  style={{
                    borderRadius: t.radius.sm,
                    aspectRatio: "3/4",
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
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                    style={{
                      background: `linear-gradient(0deg, ${t.accent}15 0%, transparent 60%)`,
                    }}
                  />
                  {p.badge && (
                    <span
                      className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-widest px-3 py-1"
                      style={{
                        backgroundColor:
                          p.badge === "sale" ? t.accent : p.badge === "new" ? "#ffffff" : t.primary,
                        color: p.badge === "new" ? "#0a0a0a" : "#fff",
                        borderRadius: t.radius.sm,
                      }}
                    >
                      {p.badge === "best-seller" ? "★ Best" : p.badge}
                    </span>
                  )}
                </div>
                <p
                  className="text-[10px] uppercase tracking-widest mb-1"
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
                  <span className="text-sm font-bold" style={{ color: t.accent }}>
                    {formatPrice(p.price, currency)}
                  </span>
                  {onAddToCart && (
                    <button
                      onClick={() => onAddToCart(p)}
                      className="h-8 w-8 flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: t.accent,
                        color: "#0a0a0a",
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
      )}

      {/* Brand Story */}
      <section className="px-6 py-16" style={{ backgroundColor: t.surface }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: t.accent }} />
          <h2
            className="text-2xl md:text-3xl font-bold mb-6"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            The Algerians' Brand
          </h2>
          <p
            className="text-sm md:text-base leading-relaxed mb-6"
            dir="auto"
            style={{ color: t.muted }}
          >
            Born from a passion for quality and heritage, we curate premium products that reflect
            the spirit of modern Algeria. Every item is chosen with care to deliver excellence to
            your doorstep.
          </p>
          <div className="w-16 h-px mx-auto" style={{ backgroundColor: t.accent }} />
        </div>
      </section>

      {/* Newsletter — Dark bg, gold text */}
      <section className="px-6 py-20" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            dir="auto"
            style={{ color: t.accent, fontFamily: t.fontHeading }}
          >
            Join the Club
          </h2>
          <p className="text-sm mb-8" dir="auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Exclusive access to premium drops and offers.
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
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "#fff",
                borderRadius: t.radius.sm,
                border: `1px solid ${t.accent}40`,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: t.accent,
                color: "#0a0a0a",
                borderRadius: t.radius.sm,
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
