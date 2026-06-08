import { ArrowRight, ShoppingBag, Truck, Shield, RotateCcw, Headphones } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function OranLayout({
  products,
  tokens: t,
  currency,
  brandName,
  heroHeading,
  heroSubheading,
  heroCta,
  onAddToCart,
}: LayoutProps) {
  const featured = products.slice(0, 6);

  return (
    <div style={{ fontFamily: t.fontFamily, backgroundColor: t.bg, color: t.fg }}>
      {/* Hero — Split layout */}
      <section className="px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p
              className="text-xs uppercase tracking-[0.35em] mb-4"
              dir="auto"
              style={{ color: t.muted }}
            >
              {brandName}
            </p>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              dir="auto"
              style={{ fontFamily: t.fontHeading }}
            >
              {heroHeading}
            </h1>
            <p
              className="text-base md:text-lg mb-8 max-w-lg"
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
                borderRadius: t.radius.md,
              }}
              dir="auto"
            >
              {heroCta}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div
            className="relative overflow-hidden"
            style={{ borderRadius: t.radius.lg, aspectRatio: "4/5", backgroundColor: t.surface }}
          >
            {products[0] && (
              <Img
                src={products[0].images[0]}
                alt={products[0].name}
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        className="px-6 py-12"
        style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, label: "Free Shipping" },
            { icon: Shield, label: "Secure Payment" },
            { icon: RotateCcw, label: "Easy Returns" },
            { icon: Headphones, label: "24/7 Support" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="text-center">
              <div
                className="w-12 h-12 mx-auto mb-3 flex items-center justify-center"
                style={{ backgroundColor: t.primary + "12", borderRadius: t.radius.md }}
              >
                <Icon className="h-5 w-5" style={{ color: t.primary }} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider" dir="auto">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Products — Clean white cards, blue hover border */}
      {featured.length > 0 && (
        <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
          <h2
            className="text-2xl md:text-3xl font-bold mb-10"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Our Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featured.map((p) => (
              <div key={p.id} className="group">
                <div
                  className="relative overflow-hidden mb-4 transition-all duration-300"
                  style={{
                    borderRadius: t.radius.lg,
                    aspectRatio: "1/1",
                    backgroundColor: t.surface,
                    border: `2px solid ${t.border}`,
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"
                    style={{ border: `2px solid ${t.primary}`, borderRadius: t.radius.lg }}
                  />
                  <Img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  {p.badge && (
                    <span
                      className="absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 z-20"
                      style={{
                        backgroundColor:
                          p.badge === "sale" ? t.accent : p.badge === "new" ? t.primary : "#f59e0b",
                        color: "#fff",
                        borderRadius: t.radius.md,
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
                        borderRadius: t.radius.md,
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

      {/* Newsletter — Light blue bg */}
      <section
        className="px-6 py-20"
        style={{ backgroundColor: t.primary + "12" }}
      >
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-3"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Stay in the Loop
          </h2>
          <p
            className="text-sm mb-8"
            dir="auto"
            style={{ color: t.muted }}
          >
            Subscribe for new arrivals and exclusive offers.
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
                backgroundColor: "#fff",
                color: t.fg,
                borderRadius: t.radius.md,
                border: `1px solid ${t.border}`,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
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
