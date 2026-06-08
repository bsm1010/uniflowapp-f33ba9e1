import { ArrowRight, ShoppingBag } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { formatPrice } from "@/lib/storeTheme";
import type { LayoutProps } from "./index";

export default function ConstantineLayout({
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
      {/* Hero — Dramatic black with red accent */}
      <section className="px-6 py-20 md:py-32 bg-black">
        <div className="max-w-5xl mx-auto text-center">
          <p
            className="text-xs uppercase tracking-[0.4em] mb-8"
            dir="auto"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {brandName}
          </p>
          <div className="w-20 h-1 mx-auto mb-10" style={{ backgroundColor: t.primary }} />
          <h1
            className="text-6xl md:text-8xl font-black uppercase leading-none tracking-tight"
            dir="auto"
          >
            {heroHeading}
          </h1>
          <p
            className="mt-8 text-base md:text-lg max-w-xl mx-auto"
            dir="auto"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="mt-10 inline-flex items-center gap-3 px-10 py-4 text-sm font-bold uppercase tracking-widest transition-colors"
            style={{
              backgroundColor: t.primary,
              color: t.onPrimary,
              borderRadius: t.radius.sm,
            }}
            dir="auto"
          >
            {heroCta}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16" style={{ backgroundColor: t.bg }}>
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-4">
          {[
            { num: "500+", label: "Products" },
            { num: "10K+", label: "Customers" },
            { num: "4.9", label: "Rating" },
          ].map((s) => (
            <div
              key={s.label}
              className="text-center p-8"
              style={{ backgroundColor: t.fg, borderRadius: t.radius.sm }}
            >
              <div
                className="text-3xl md:text-5xl font-black mb-2"
                style={{ color: t.primary }}
              >
                {s.num}
              </div>
              <div
                className="text-xs uppercase tracking-widest font-bold"
                dir="auto"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products — Stark cards */}
      {featured.length > 0 && (
        <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
          <h2
            className="text-2xl md:text-4xl font-black uppercase mb-12"
            dir="auto"
          >
            Featured
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {featured.map((p) => (
              <div key={p.id} className="group">
                <div
                  className="relative overflow-hidden mb-4 transition-colors"
                  style={{
                    borderRadius: t.radius.sm,
                    aspectRatio: "3/4",
                    backgroundColor: t.fg,
                  }}
                >
                  <Img
                    src={p.images[0]}
                    alt={p.name}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: t.primary + "20" }}
                  />
                  {p.badge && (
                    <span
                      className="absolute top-3 left-3 text-[9px] font-black uppercase tracking-widest px-3 py-1"
                      style={{
                        backgroundColor:
                          p.badge === "sale"
                            ? t.primary
                            : p.badge === "new"
                            ? t.fg
                            : t.accent,
                        color:
                          p.badge === "new" ? t.bg : "#fff",
                        borderRadius: t.radius.sm,
                      }}
                    >
                      {p.badge === "best-seller" ? "★ Best" : p.badge}
                    </span>
                  )}
                </div>
                <h3
                  className="text-sm font-bold uppercase tracking-wide mb-1"
                  dir="auto"
                >
                  {p.name}
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black">
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
      )}

      {/* Newsletter — Black bg, red button */}
      <section className="px-6 py-20 bg-black">
        <div className="max-w-xl mx-auto text-center">
          <h2
            className="text-2xl md:text-4xl font-black uppercase mb-4"
            dir="auto"
            style={{ fontFamily: t.fontHeading }}
          >
            Stay Connected
          </h2>
          <p
            className="text-sm mb-8"
            dir="auto"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            Exclusive drops and early access.
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
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "#fff",
                borderRadius: t.radius.sm,
                border: `1px solid rgba(255,255,255,0.15)`,
              }}
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
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
