/**
 * Grid-Dense Layout — Compact product grid, tech/digital style.
 * Used by: Tech Gadgets, Kids Toys, Digital Products.
 */
import { ShoppingBag, Zap, TrendingUp, Star } from "lucide-react";
import type { LayoutProps } from "./index";
import { formatPrice } from "@/lib/storeTheme";

function GridDenseLayout({
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
  const bestsellers = products.filter((p) => p.badge === "best-seller");
  const newArrivals = products.filter((p) => p.badge === "new");

  return (
    <div>
      {/* Hero — Gradient background with centered text */}
      <section
        className="relative overflow-hidden py-20 md:py-32 text-center"
        style={{
          background: `radial-gradient(ellipse at top, ${t.primary}25 0%, transparent 50%), radial-gradient(ellipse at bottom right, ${t.accent}15, transparent 40%), ${t.bg}`,
        }}
      >
        <div className="relative max-w-4xl mx-auto px-6">
          <div
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] mb-6 px-4 py-2"
            style={{
              backgroundColor: t.primary + "18",
              color: t.primary,
              borderRadius: t.radius.pill,
            }}
          >
            <Zap className="h-3.5 w-3.5" />
            {brandName}
          </div>
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p className="mt-5 text-lg md:text-xl max-w-2xl mx-auto" style={{ color: t.muted }}>
            {heroSubheading}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <a
              href="#shop"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-bold transition-transform hover:scale-105 active:scale-95"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
                boxShadow: `0 8px 25px -6px ${t.primary}55`,
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              {heroCta}
            </a>
          </div>
        </div>
      </section>

      {/* Category pills */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-8 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {categories.map((c) => (
              <a
                key={c}
                href="#shop"
                className="text-xs font-semibold px-4 py-2.5 transition-colors whitespace-nowrap"
                style={{
                  backgroundColor: t.surface,
                  color: t.fg,
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius.pill,
                }}
              >
                {c}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Bestsellers row */}
      {bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-4 w-4" style={{ color: t.accent }} />
            <h2 className="text-lg font-bold">Best Sellers</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {bestsellers.map((p) => (
              <DenseCard key={p.id} p={p} t={t} currency={currency} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* New Arrivals row */}
      {newArrivals.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-4 w-4" style={{ color: t.primary }} />
            <h2 className="text-lg font-bold">New Arrivals</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {newArrivals.map((p) => (
              <DenseCard key={p.id} p={p} t={t} currency={currency} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* All products dense grid */}
      <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">All Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {products.map((p) => (
            <DenseCard key={p.id} p={p} t={t} currency={currency} onAdd={onAddToCart} />
          ))}
        </div>
      </section>
    </div>
  );
}

function DenseCard({
  p,
  t,
  currency,
  onAdd,
}: {
  p: import("./index").ProductForLayout;
  t: import("@/lib/storeTheme").StoreTokens;
  currency: string;
  onAdd?: (p: import("./index").ProductForLayout) => void;
}) {
  return (
    <div className="group relative">
      <div
        className="relative overflow-hidden mb-3"
        style={{
          borderRadius: t.radius.md,
          aspectRatio: "1/1",
          backgroundColor: t.surface,
        }}
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
            className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-1"
            style={{
              backgroundColor: p.badge === "sale" ? t.accent : p.badge === "new" ? t.primary : t.secondary,
              color: p.badge === "sale" ? t.onAccent : p.badge === "new" ? t.onPrimary : t.onSecondary,
              borderRadius: t.radius.sm,
            }}
          >
            {p.badge}
          </span>
        )}
        {onAdd && (
          <button
            onClick={() => onAdd(p)}
            className="absolute bottom-2 right-2 h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
            style={{
              backgroundColor: t.primary + "dd",
              color: t.onPrimary,
              borderRadius: t.radius.sm + 2,
            }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <h3 className="text-xs font-semibold line-clamp-2 leading-tight">{p.name}</h3>
      <p className="text-xs font-bold mt-1" style={{ color: t.primary }}>
        {formatPrice(p.price, currency)}
      </p>
    </div>
  );
}

export default GridDenseLayout;
