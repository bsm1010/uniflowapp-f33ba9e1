/**
 * Showcase Layout — Full-bleed hero, large product cards, bold typography.
 * Used by: Streetwear, Fitness, Sneakers, Gaming.
 */
import { ShoppingBag, ArrowRight, Flame } from "lucide-react";
import type { LayoutProps } from "./index";
import { formatPrice } from "@/lib/storeTheme";

function ShowcaseLayout({
  products,
  tokens: t,
  currency,
  brandName,
  heroHeading,
  heroSubheading,
  heroCta,
  onAddToCart,
}: LayoutProps) {
  const hero1 = products[0];
  const featured = products.slice(0, 6);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div>
      {/* Hero — Full-bleed dramatic */}
      <section className="relative min-h-[80vh] md:min-h-[90vh] flex items-center overflow-hidden">
        {hero1?.images[0] && (
          <img
            src={hero1.images[0]}
            alt=""
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${t.bg}f0 0%, ${t.bg}aa 40%, ${t.bg}55 100%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 w-full">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] mb-6 px-4 py-2"
            style={{ backgroundColor: t.primary + "22", color: t.primary, borderRadius: t.radius.sm }}
          >
            <Flame className="h-3.5 w-3.5" />
            New Drop
          </div>
          <h1
            className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase leading-[0.95] tracking-tight"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p className="mt-6 text-base md:text-lg max-w-lg" style={{ color: t.muted }}>
            {heroSubheading}
          </p>
          <div className="mt-10 flex gap-4">
            <a
              href="#shop"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all hover:scale-105"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
              }}
            >
              {heroCta}
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Scrollable categories */}
      {categories.length > 0 && (
        <section className="py-6 px-6 overflow-x-auto" style={{ backgroundColor: t.surface }}>
          <div className="max-w-7xl mx-auto flex gap-4 min-w-max">
            {categories.map((c) => (
              <a
                key={c}
                href="#shop"
                className="text-xs font-bold uppercase tracking-wider px-5 py-3 transition-all hover:scale-105"
                style={{
                  border: `2px solid ${t.border}`,
                  borderRadius: t.radius.md,
                  color: t.fg,
                }}
              >
                {c}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Featured — large cards 2-col */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-10">
          Featured
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {featured.map((p) => (
            <div
              key={p.id}
              className="group relative overflow-hidden"
              style={{ borderRadius: t.radius.lg, aspectRatio: "4/5" }}
            >
              {p.images[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full" style={{ backgroundColor: t.surface }} />
              )}
              <div
                className="absolute inset-0 flex flex-col justify-end p-6"
                style={{ background: `linear-gradient(0deg, ${t.bg}dd, transparent 50%)` }}
              >
                {p.badge && (
                  <span
                    className="self-start text-[10px] font-black uppercase tracking-wider px-3 py-1.5 mb-3"
                    style={{
                      backgroundColor: p.badge === "sale" ? t.accent : t.primary,
                      color: p.badge === "sale" ? t.onAccent : t.onPrimary,
                      borderRadius: t.radius.sm,
                    }}
                  >
                    {p.badge}
                  </span>
                )}
                <h3 className="text-xl font-black uppercase">{p.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold">{formatPrice(p.price, currency)}</span>
                  {onAddToCart && (
                    <button
                      onClick={() => onAddToCart(p)}
                      className="h-10 w-10 flex items-center justify-center transition-all opacity-80 group-hover:opacity-100 hover:scale-110"
                      style={{
                        backgroundColor: t.primary,
                        color: t.onPrimary,
                        borderRadius: t.radius.sm + 2,
                      }}
                    >
                      <ShoppingBag className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All products grid */}
      <section id="shop" className="max-w-7xl mx-auto px-6 sm:px-10 py-16">
        <h2 className="text-2xl font-black uppercase tracking-tight mb-8">All Products</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="group">
              <div
                className="relative overflow-hidden mb-3"
                style={{ borderRadius: t.radius.md, aspectRatio: "1/1", backgroundColor: t.surface }}
              >
                {p.images[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
                {p.badge && (
                  <span
                    className="absolute top-2 left-2 text-[9px] font-black uppercase px-2 py-1"
                    style={{
                      backgroundColor: p.badge === "sale" ? t.accent : t.primary,
                      color: p.badge === "sale" ? t.onAccent : t.onPrimary,
                      borderRadius: t.radius.sm,
                    }}
                  >
                    {p.badge}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold uppercase line-clamp-1">{p.name}</h3>
              <p className="text-sm font-bold mt-0.5">{formatPrice(p.price, currency)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default ShowcaseLayout;
