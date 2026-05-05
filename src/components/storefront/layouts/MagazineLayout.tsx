/**
 * Magazine Layout — Mixed content blocks, promotional banners, lifestyle imagery.
 * Used by: Beauty, Pet Store, Organic Food.
 */
import { ArrowRight, Sparkles, Heart, Star } from "lucide-react";
import type { LayoutProps } from "./index";
import { formatPrice } from "@/lib/storeTheme";

function MagazineLayout({
  products,
  tokens: t,
  currency,
  brandName,
  heroHeading,
  heroSubheading,
  heroCta,
  onAddToCart,
}: LayoutProps) {
  const featured = products.slice(0, 3);
  const promo = products.find((p) => p.badge === "sale");
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div>
      {/* Hero — Split layout with large image */}
      <section className="grid grid-cols-1 md:grid-cols-2 min-h-[60vh] md:min-h-[75vh]">
        <div className="flex flex-col justify-center px-8 sm:px-12 md:px-16 py-16 md:py-24 order-2 md:order-1">
          <div
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] mb-6 px-4 py-2 self-start"
            style={{
              backgroundColor: t.primary + "12",
              color: t.primary,
              borderRadius: t.radius.pill,
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {brandName}
          </div>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1]"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p className="mt-5 text-base md:text-lg max-w-md" style={{ color: t.muted }}>
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold self-start transition-transform hover:scale-105"
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
        <div className="relative overflow-hidden order-1 md:order-2 min-h-[300px]">
          {products[0]?.images[0] && (
            <img
              src={products[0].images[0]}
              alt=""
              loading="eager"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </section>

      {/* Trust bar */}
      <section
        className="py-6 px-6"
        style={{ backgroundColor: t.surface, borderTop: `1px solid ${t.border}`, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-8 md:gap-16 text-xs uppercase tracking-[0.15em]" style={{ color: t.muted }}>
          <span>✦ Free Shipping</span>
          <span>✦ Cruelty Free</span>
          <span>✦ 30-Day Returns</span>
          <span>✦ Natural Ingredients</span>
        </div>
      </section>

      {/* Featured trio */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: t.fontHeading }}>
            Featured Picks
          </h2>
          <p className="mt-2 text-sm" style={{ color: t.muted }}>
            Our team's favourites this season
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {featured.map((p) => (
            <div key={p.id} className="group text-center">
              <div
                className="relative overflow-hidden mb-5 mx-auto"
                style={{
                  borderRadius: t.radius.lg + 8,
                  aspectRatio: "4/5",
                  backgroundColor: t.surface,
                }}
              >
                {p.images[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <button
                  className="absolute top-3 right-3 h-9 w-9 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                  style={{
                    backgroundColor: t.bg + "cc",
                    borderRadius: "50%",
                    color: t.primary,
                  }}
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="text-sm font-bold mt-1" style={{ color: t.primary }}>
                {formatPrice(p.price, currency)}
              </p>
              {onAddToCart && (
                <button
                  onClick={() => onAddToCart(p)}
                  className="mt-3 text-xs font-semibold px-5 py-2.5 transition-colors"
                  style={{
                    border: `1.5px solid ${t.primary}`,
                    color: t.primary,
                    borderRadius: t.buttonRadius,
                  }}
                >
                  Add to Cart
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Promo banner */}
      {promo && (
        <section
          className="mx-6 sm:mx-10 py-16 px-8 sm:px-12 text-center"
          style={{
            background: `linear-gradient(135deg, ${t.primary}18 0%, ${t.accent}12 100%)`,
            borderRadius: t.radius.lg + 8,
          }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: t.accent }}>
            Limited Offer
          </span>
          <h3 className="text-2xl md:text-3xl font-bold mt-3">{promo.name}</h3>
          <p className="mt-2 text-2xl font-bold" style={{ color: t.primary }}>
            {formatPrice(promo.price, currency)}
          </p>
          {onAddToCart && (
            <button
              onClick={() => onAddToCart(promo)}
              className="mt-6 px-8 py-3.5 text-sm font-bold transition-transform hover:scale-105"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
              }}
            >
              Shop Now
            </button>
          )}
        </section>
      )}

      {/* All products */}
      <section id="shop" className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <h2 className="text-2xl font-bold mb-10" style={{ fontFamily: t.fontHeading }}>
          All Products
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => (
            <div key={p.id} className="group">
              <div
                className="relative overflow-hidden mb-4"
                style={{ borderRadius: t.radius.md + 4, aspectRatio: "4/5", backgroundColor: t.surface }}
              >
                {p.images[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                {p.badge && (
                  <span
                    className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1"
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
              <h3 className="text-sm font-semibold line-clamp-1">{p.name}</h3>
              <p className="text-sm font-bold mt-1">{formatPrice(p.price, currency)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default MagazineLayout;
void Star;
