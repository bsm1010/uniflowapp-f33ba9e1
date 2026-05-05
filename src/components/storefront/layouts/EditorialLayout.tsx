/**
 * Editorial Layout — Large imagery, asymmetric grids, serif headings.
 * Used by: Luxe, Habitat, Jewelry, Furniture, Watches.
 */
import { ArrowRight, Star } from "lucide-react";
import type { LayoutProps } from "./index";
import { formatPrice } from "@/lib/storeTheme";

function EditorialLayout({
  products,
  tokens: t,
  currency,
  brandName,
  heroHeading,
  heroSubheading,
  heroCta,
  onAddToCart,
}: LayoutProps) {
  const featured = products.slice(0, 4);
  const rest = products.slice(4);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  return (
    <div>
      {/* Hero — Full-width editorial with overlaid text */}
      <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-end overflow-hidden">
        {products[0]?.images[0] && (
          <img
            src={products[0].images[0]}
            alt=""
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(0deg, ${t.bg}ee 0%, ${t.bg}66 40%, transparent 70%)` }}
        />
        <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 pb-16 md:pb-24">
          <p className="text-xs uppercase tracking-[0.3em] mb-4" style={{ color: t.muted }}>
            {brandName}
          </p>
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.05] max-w-3xl"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p className="mt-4 text-lg max-w-xl" style={{ color: t.muted }}>
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="inline-flex items-center gap-3 mt-8 text-sm font-semibold uppercase tracking-wider group"
            style={{ color: t.fg }}
          >
            {heroCta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </section>

      {/* Asymmetric featured grid — 2 large + 2 small */}
      <section className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <p className="text-xs uppercase tracking-[0.25em] mb-8" style={{ color: t.muted }}>
          Selected Pieces
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured.map((p, i) => (
            <div
              key={p.id}
              className={`group relative overflow-hidden ${i === 0 ? "md:row-span-2" : ""}`}
              style={{ borderRadius: t.radius.lg, aspectRatio: i === 0 ? "3/4" : "4/3" }}
            >
              {p.images[0] ? (
                <img
                  src={p.images[0]}
                  alt={p.name}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full" style={{ backgroundColor: t.surface }} />
              )}
              <div
                className="absolute inset-0 flex flex-col justify-end p-6"
                style={{ background: `linear-gradient(0deg, ${t.bg}cc, transparent 60%)` }}
              >
                {p.badge && (
                  <span
                    className="self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 mb-3"
                    style={{
                      backgroundColor: p.badge === "sale" ? t.accent : t.primary,
                      color: p.badge === "sale" ? t.onAccent : t.onPrimary,
                      borderRadius: t.radius.sm,
                    }}
                  >
                    {p.badge}
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-base font-bold">{formatPrice(p.price, currency)}</span>
                  {onAddToCart && (
                    <button
                      onClick={() => onAddToCart(p)}
                      className="text-xs font-semibold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: t.primary }}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories strip */}
      {categories.length > 0 && (
        <section className="border-t border-b" style={{ borderColor: t.border }}>
          <div className="max-w-7xl mx-auto px-6 sm:px-10 py-12 flex flex-wrap gap-6 md:gap-12">
            {categories.map((c) => (
              <a
                key={c}
                href="#shop"
                className="text-sm uppercase tracking-[0.2em] transition-colors hover:opacity-70"
                style={{ color: t.fg }}
              >
                {c}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Remaining products — clean 2-column grid */}
      <section id="shop" className="max-w-7xl mx-auto px-6 sm:px-10 py-20">
        <h2 className="text-2xl md:text-3xl font-bold mb-12" style={{ fontFamily: t.fontHeading }}>
          All Pieces
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
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: t.muted }}>
                {p.category}
              </p>
              <h3 className="text-sm font-semibold leading-tight">{p.name}</h3>
              <p className="text-sm font-bold mt-1">{formatPrice(p.price, currency)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default EditorialLayout;
void Star;
