import { ArrowRight, ShoppingBag, Heart, Star, Award } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function KabyleLayout({
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
      {/* Hero — Split layout, warm earth tones */}
      <section className="px-6 py-16 md:py-24" style={{ backgroundColor: t.surface }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p
              className="text-xs uppercase tracking-[0.35em] mb-4"
              dir="auto"
              style={{ color: t.primary }}
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
                borderRadius: t.radius.lg,
              }}
              dir="auto"
            >
              {heroCta}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          <div
            className="relative overflow-hidden"
            style={{ borderRadius: t.radius.lg, aspectRatio: "4/5", backgroundColor: t.surfaceStrong }}
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

      {/* Craft section */}
      <section className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl md:text-3xl font-bold mb-10 text-center"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Handcrafted with Love
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Heart, title: "Made with Heart", desc: "Each piece carries warmth and intention" },
              { icon: Star, title: "Quality Materials", desc: "Sourced from trusted local artisans" },
              { icon: Award, title: "Heritage Craft", desc: "Rooted in centuries of tradition" },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="text-center p-8"
                style={{ backgroundColor: t.surface, borderRadius: t.radius.lg, border: `1px solid ${t.border}` }}
              >
                <div
                  className="w-14 h-14 mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: t.primary + "18", borderRadius: t.radius.lg }}
                >
                  <Icon className="h-6 w-6" style={{ color: t.primary }} />
                </div>
                <h3 className="text-sm font-bold mb-2" dir="auto">{title}</h3>
                <p className="text-xs" dir="auto" style={{ color: t.muted }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products — Warm earth-tone cards */}
      {featured.length > 0 && (
        <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
          <h2
            className="text-2xl md:text-3xl font-bold mb-10"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Our Collection
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featured.map((p) => (
              <div key={p.id} className="group">
                <div
                  className="relative overflow-hidden mb-3"
                  style={{
                    borderRadius: t.radius.lg,
                    aspectRatio: "1/1",
                    backgroundColor: t.surface,
                    border: `2px solid ${t.primary}30`,
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
                        borderRadius: t.radius.lg,
                      }}
                    >
                      {p.badge === "best-seller" ? "★ Best" : p.badge}
                    </span>
                  )}
                </div>
                <p
                  className="text-[10px] uppercase tracking-wider mb-1"
                  dir="auto"
                  style={{ color: t.primary }}
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
                        borderRadius: t.radius.lg,
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

      {/* Newsletter — Warm earth bg */}
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
            Join our community and get exclusive offers.
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
                backgroundColor: t.bg,
                color: t.fg,
                borderRadius: t.radius.lg,
                border: `1px solid ${t.border}`,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.radius.lg,
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
