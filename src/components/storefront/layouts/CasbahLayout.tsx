import { ArrowRight, ShoppingBag, Truck, Shield, RotateCcw } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function CasbahLayout({
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
      {/* Hero — Geometric border pattern */}
      <section className="px-6 py-20 md:py-28">
        <div
          className="max-w-4xl mx-auto text-center p-10 md:p-16 relative"
          style={{
            border: `3px solid ${t.primary}`,
            borderRadius: t.radius.lg,
          }}
        >
          <div
            className="absolute inset-3"
            style={{
              border: `1px solid ${t.border}`,
              borderRadius: t.radius.md,
            }}
          />
          <p
            className="text-xs uppercase tracking-[0.4em] mb-6 relative z-10"
            dir="auto"
            style={{ color: t.muted }}
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

      {/* Features */}
      <section
        className="px-6 py-12"
        style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Truck, title: "Free Shipping", desc: "On all orders" },
            { icon: Shield, title: "Secure Payment", desc: "100% protected" },
            { icon: RotateCcw, title: "Easy Returns", desc: "30-day policy" },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="text-center p-6"
              style={{ border: `1px solid ${t.border}`, borderRadius: t.radius.md }}
            >
              <div
                className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: t.primary + "12", borderRadius: t.radius.md }}
              >
                <Icon className="h-5 w-5" style={{ color: t.primary }} />
              </div>
              <h3 className="text-sm font-bold mb-1" dir="auto">{title}</h3>
              <p className="text-xs" dir="auto" style={{ color: t.muted }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Product Grid — Masonry-style staggered */}
      <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
        <h2
          className="text-2xl md:text-3xl font-bold mb-10"
          dir="auto"
          style={{ fontFamily: t.fontHeading }}
        >
          Our Products
        </h2>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
          {products.map((p, i) => (
            <div
              key={p.id}
              className="break-inside-avoid group"
              style={{ transform: i % 3 === 1 ? "translateY(24px)" : "none" }}
            >
              <div
                className="relative overflow-hidden mb-3 transition-colors"
                style={{
                  borderRadius: t.radius.md,
                  aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "4/3" : "1/1",
                  backgroundColor: t.surface,
                  border: `2px solid ${t.border}`,
                }}
              >
                <Img
                  src={p.images[0]}
                  alt={p.name}
                  className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                />
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

      {/* Newsletter — Blue background */}
      <section
        className="px-6 py-20"
        style={{ backgroundColor: t.primary }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            dir="auto"
            style={{ color: t.onPrimary, fontFamily: t.fontHeading }}
          >
            Join the Community
          </h2>
          <p
            className="text-sm mb-8"
            dir="auto"
            style={{ color: t.onPrimary, opacity: 0.85 }}
          >
            Get the latest news and exclusive deals.
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
