/**
 * Storytelling Layout — Narrative-driven, interleaved text & imagery.
 * Used by: Handmade Crafts, Coffee Brand.
 */
import { ArrowRight, Quote } from "lucide-react";
import type { LayoutProps } from "./index";
import { formatPrice } from "@/lib/storeTheme";

function StorytellingLayout({
  products,
  tokens: t,
  currency,
  brandName,
  heroHeading,
  heroSubheading,
  heroCta,
  onAddToCart,
}: LayoutProps) {
  const heroProduct = products[0];
  const storyProducts = products.slice(0, 3);

  return (
    <div>
      {/* Hero — Cinematic full-width with gradient */}
      <section className="relative min-h-[75vh] md:min-h-[85vh] flex items-center overflow-hidden">
        {heroProduct?.images[0] && (
          <img
            src={heroProduct.images[0]}
            alt=""
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, ${t.bg}f0 0%, ${t.bg}aa 40%, transparent 70%)`,
          }}
        />
        <div className="relative max-w-7xl mx-auto px-8 sm:px-12 w-full">
          <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: t.accent }}>
            {brandName}
          </p>
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] max-w-2xl"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p className="mt-5 text-lg max-w-md" style={{ color: t.muted }}>
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="mt-8 inline-flex items-center gap-3 px-8 py-4 text-sm font-semibold transition-transform hover:scale-105"
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
      </section>

      {/* Story blocks — alternating image/text */}
      {storyProducts.map((p, i) => (
        <section key={p.id} className="max-w-7xl mx-auto px-6 sm:px-10 py-16 md:py-24">
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center ${i % 2 === 1 ? "" : ""}`}>
            <div className={i % 2 === 1 ? "md:order-2" : ""}>
              <div
                className="overflow-hidden"
                style={{ borderRadius: t.radius.lg + 4, aspectRatio: "4/5" }}
              >
                {p.images[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
            <div className={i % 2 === 1 ? "md:order-1" : ""}>
              {p.badge && (
                <span
                  className="inline-block text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 mb-4"
                  style={{
                    backgroundColor: t.primary + "15",
                    color: t.primary,
                    borderRadius: t.radius.sm,
                  }}
                >
                  {p.badge}
                </span>
              )}
              <h2
                className="text-3xl md:text-4xl font-bold leading-tight"
                style={{ fontFamily: t.fontHeading }}
              >
                {p.name}
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: t.muted }}>
                Each piece is carefully crafted with attention to detail, using only the finest materials sourced from local artisans.
              </p>
              <div className="mt-6 flex items-center gap-4">
                <span className="text-2xl font-bold">{formatPrice(p.price, currency)}</span>
                {onAddToCart && (
                  <button
                    onClick={() => onAddToCart(p)}
                    className="px-6 py-3 text-sm font-semibold transition-transform hover:scale-105"
                    style={{
                      backgroundColor: t.primary,
                      color: t.onPrimary,
                      borderRadius: t.buttonRadius,
                    }}
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Testimonial / quote */}
      <section
        className="py-20 px-6 text-center"
        style={{ backgroundColor: t.surface }}
      >
        <Quote className="h-8 w-8 mx-auto mb-6 opacity-30" style={{ color: t.primary }} />
        <p
          className="text-xl md:text-2xl italic max-w-3xl mx-auto leading-relaxed"
          style={{ fontFamily: t.fontHeading, color: t.fg }}
        >
          "Every product tells a story. We believe in craftsmanship, sustainability, and the beauty of things made by hand."
        </p>
        <p className="mt-4 text-sm font-semibold" style={{ color: t.muted }}>
          — {brandName} Founders
        </p>
      </section>

      {/* All products */}
      <section id="shop" className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <h2
          className="text-2xl md:text-3xl font-bold mb-12"
          style={{ fontFamily: t.fontHeading }}
        >
          Our Collection
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div key={p.id} className="group">
              <div
                className="relative overflow-hidden mb-4"
                style={{ borderRadius: t.radius.md, aspectRatio: "3/4", backgroundColor: t.surface }}
              >
                {p.images[0] && (
                  <img
                    src={p.images[0]}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <h3 className="text-sm font-semibold">{p.name}</h3>
              <p className="text-sm font-bold mt-1">{formatPrice(p.price, currency)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StorytellingLayout;
