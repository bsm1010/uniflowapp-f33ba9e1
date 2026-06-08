import { ArrowRight, ShoppingBag, Truck, Shield, Clock, Heart } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function MediterraneanLayout({
  products,
  tokens: t,
  currency,
  brandName,
  heroHeading,
  heroSubheading,
  heroCta,
  onAddToCart,
}: LayoutProps) {
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div style={{ fontFamily: t.fontFamily, backgroundColor: t.bg, color: t.fg }}>
      {/* Hero — Split layout */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p
            className="text-xs uppercase tracking-[0.3em] mb-4"
            dir="auto"
            style={{ color: t.muted }}
          >
            {brandName}
          </p>
          <h1
            className="text-3xl md:text-5xl font-bold leading-tight mb-6"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p
            className="text-base md:text-lg mb-8 max-w-md"
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
        <div
          className="relative overflow-hidden w-full aspect-square md:aspect-[4/3]"
          style={{ borderRadius: t.radius.lg, backgroundColor: t.surface }}
        >
          {products[0]?.images[0] ? (
            <Img
              src={products[0].images[0]}
              alt={products[0].name}
              className="w-full h-full"
            />
          ) : (
            <div
              className="w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${t.primary}18, ${t.accent}12, ${t.bg})`,
              }}
            />
          )}
        </div>
      </section>

      {/* Categories — Pills */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-10">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <a
                key={c}
                href="#shop"
                className="px-5 py-2 text-xs font-semibold transition-all hover:scale-105"
                dir="auto"
                style={{
                  backgroundColor: t.surface,
                  color: t.fg,
                  borderRadius: t.radius.pill,
                  border: `1px solid ${t.border}`,
                }}
              >
                {c}
              </a>
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
          Our Collection
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="group">
              <div
                className="relative overflow-hidden mb-4"
                style={{
                  borderRadius: t.radius.md,
                  aspectRatio: "1/1",
                  backgroundColor: t.surface,
                  border: `1px solid ${t.border}`,
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
                        p.badge === "sale"
                          ? t.accent
                          : p.badge === "new"
                          ? t.primary
                          : "#f59e0b",
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
              <h3 className="text-sm font-semibold mb-1" dir="auto">
                {p.name}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">
                  {formatPrice(p.price, currency)}
                </span>
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(p)}
                    className="h-8 w-8 flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: t.surface,
                      color: t.fg,
                      borderRadius: t.radius.sm,
                      border: `1px solid ${t.border}`,
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

      {/* Trust Badges */}
      <section
        className="px-6 py-10"
        style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, label: "Free Shipping" },
            { icon: Shield, label: "Secure Checkout" },
            { icon: Clock, label: "Fast Delivery" },
            { icon: Heart, label: "Carefully Packed" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3 justify-center">
              <Icon className="h-5 w-5 shrink-0" style={{ color: t.primary }} />
              <span className="text-xs font-semibold" dir="auto">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="px-6 py-20" style={{ backgroundColor: t.surface }}>
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Stay Connected
          </h2>
          <p
            className="text-sm mb-8"
            dir="auto"
            style={{ color: t.muted }}
          >
            Subscribe for updates and exclusive offers.
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
                border: `1px solid ${t.border}`,
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
