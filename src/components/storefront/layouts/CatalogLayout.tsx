/**
 * Catalog Layout — Structured, conversion-focused, filter-heavy.
 * Used by: Electronics, Sports, General/Dropshipping.
 */
import { ShoppingBag, Star, Truck, Shield, RotateCcw, ArrowRight } from "lucide-react";
import type { LayoutProps } from "./index";
import { formatPrice } from "@/lib/storeTheme";

function CatalogLayout({
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
  const bestsellers = products.filter((p) => p.badge === "best-seller").slice(0, 4);
  const deals = products.filter((p) => p.badge === "sale");

  return (
    <div>
      {/* Hero — Compact with CTA focus */}
      <section
        className="py-16 md:py-24 px-6 text-center"
        style={{
          background: `linear-gradient(180deg, ${t.primary}10 0%, ${t.bg} 100%)`,
        }}
      >
        <div className="max-w-4xl mx-auto">
          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight"
            style={{ fontFamily: t.fontHeading }}
          >
            {heroHeading}
          </h1>
          <p className="mt-4 text-base md:text-lg max-w-2xl mx-auto" style={{ color: t.muted }}>
            {heroSubheading}
          </p>
          <a
            href="#shop"
            className="mt-8 inline-flex items-center gap-2 px-8 py-4 text-sm font-bold transition-transform hover:scale-105"
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

      {/* Trust signals */}
      <section
        className="py-5 px-6"
        style={{ backgroundColor: t.surface, borderBottom: `1px solid ${t.border}` }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Truck, label: "Free Shipping" },
            { icon: Shield, label: "Secure Checkout" },
            { icon: RotateCcw, label: "Easy Returns" },
            { icon: Star, label: "Top Rated" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2 py-2">
              <Icon className="h-4 w-4" style={{ color: t.primary }} />
              <span className="text-xs font-semibold">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Category grid */}
      {categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-xl font-bold mb-6">Shop by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((c) => (
              <a
                key={c}
                href="#shop"
                className="group flex flex-col items-center gap-2 py-5 px-3 text-center transition-all hover:scale-105"
                style={{
                  backgroundColor: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius.md,
                }}
              >
                <span className="text-sm font-semibold">{c}</span>
                <span className="text-xs" style={{ color: t.muted }}>
                  {products.filter((p) => p.category === c).length} items
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Deals banner */}
      {deals.length > 0 && (
        <section
          className="mx-6 sm:mx-10 p-6 sm:p-10 mb-8"
          style={{
            background: `linear-gradient(135deg, ${t.accent}15, ${t.primary}10)`,
            borderRadius: t.radius.lg,
            border: `1px solid ${t.accent}30`,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">🔥 Today's Deals</h2>
            <a href="#shop" className="text-xs font-semibold" style={{ color: t.primary }}>
              View All →
            </a>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {deals.map((p) => (
              <CatalogCard key={p.id} p={p} t={t} currency={currency} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* Bestsellers */}
      {bestsellers.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-12">
          <h2 className="text-xl font-bold mb-6">⭐ Best Sellers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {bestsellers.map((p) => (
              <CatalogCard key={p.id} p={p} t={t} currency={currency} onAdd={onAddToCart} />
            ))}
          </div>
        </section>
      )}

      {/* All products */}
      <section id="shop" className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-xl font-bold mb-8">All Products</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((p) => (
            <CatalogCard key={p.id} p={p} t={t} currency={currency} onAdd={onAddToCart} />
          ))}
        </div>
      </section>
    </div>
  );
}

function CatalogCard({
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
    <div
      className="group flex flex-col overflow-hidden transition-shadow hover:shadow-md"
      style={{
        borderRadius: t.radius.md,
        border: `1px solid ${t.border}`,
        backgroundColor: t.bg,
      }}
    >
      <div className="relative overflow-hidden" style={{ aspectRatio: "1/1", backgroundColor: t.surface }}>
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
            className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-1"
            style={{
              backgroundColor: p.badge === "sale" ? "#ef4444" : p.badge === "new" ? t.primary : "#f59e0b",
              color: "#fff",
              borderRadius: t.radius.sm,
            }}
          >
            {p.badge === "best-seller" ? "★ Best" : p.badge}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: t.muted }}>
          {p.category}
        </p>
        <h3 className="text-xs font-semibold line-clamp-2 flex-1">{p.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-bold">{formatPrice(p.price, currency)}</span>
          {onAdd && (
            <button
              onClick={() => onAdd(p)}
              className="h-7 w-7 flex items-center justify-center transition-colors"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.radius.sm,
              }}
            >
              <ShoppingBag className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CatalogLayout;
