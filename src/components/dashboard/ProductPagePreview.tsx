import { ShoppingBag, Search, Heart, User, ChevronLeft, Star, Truck, Shield, RotateCcw } from "lucide-react";
import {
  getStoreTokens,
  getNavLinks,
  getButtonLabels,
  formatPrice,
  type StoreSettings,
} from "@/lib/storeTheme";

interface Props {
  settings: StoreSettings;
  products?: { name: string; price: number; images: string[] }[];
}

export function ProductPagePreview({ settings, products = [] }: Props) {
  const t = getStoreTokens(settings);
  const navLinks = getNavLinks(settings);
  const labels = getButtonLabels(settings);
  const currency = settings.currency || "USD";

  const product = products[0] ?? {
    name: "Sample Product",
    price: 89,
    images: [],
  };
  const related = (products.length ? products.slice(1, 5) : Array.from({ length: 4 })).map((p, i) =>
    p && "name" in (p as object)
      ? (p as { name: string; price: number; images: string[] })
      : { name: `Related ${i + 1}`, price: 39 + i * 10, images: [] as string[] },
  );

  return (
    <div
      className="h-full w-full overflow-y-auto"
      style={{
        backgroundColor: t.bg,
        color: t.fg,
        fontFamily: t.fontFamily,
      }}
    >
      {/* Topbar */}
      <div
        className="sticky top-0 z-10 backdrop-blur-md"
        style={{
          backgroundColor: t.bg + "e6",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div className="px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt={settings.store_name} className="h-7 w-7 rounded object-cover" />
            ) : (
              <div className="h-7 w-7 rounded" style={{ backgroundColor: t.primary }} />
            )}
            <span className="font-semibold text-sm tracking-tight">{settings.store_name}</span>
          </div>
          <div className="hidden sm:flex items-center gap-5 text-xs" style={{ color: t.muted }}>
            {navLinks.slice(0, 4).map((l) => (
              <span key={l.label}>{l.label}</span>
            ))}
          </div>
          <div className="flex items-center gap-3" style={{ color: t.muted }}>
            <Search className="h-4 w-4" />
            <Heart className="h-4 w-4" />
            <User className="h-4 w-4" />
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="px-6 pt-5 flex items-center gap-1.5 text-xs" style={{ color: t.muted }}>
        <ChevronLeft className="h-3.5 w-3.5" />
        <span>Back to shop</span>
      </div>

      {/* Product detail */}
      <div className="px-6 py-6 grid grid-cols-2 gap-8">
        {/* Gallery */}
        <div>
          <div
            className="overflow-hidden"
            style={{
              backgroundColor: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: t.radius.lg,
              aspectRatio: "1 / 1",
            }}
          >
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full"
                style={{ background: `linear-gradient(135deg, ${t.primary}33, ${t.accent}1a)` }}
              />
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden"
                style={{
                  backgroundColor: t.surface,
                  border: `1px solid ${i === 0 ? t.primary : t.border}`,
                  borderRadius: t.radius.md,
                }}
              >
                {product.images?.[i] && (
                  <img src={product.images[i]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <p className="text-xs uppercase tracking-wider" style={{ color: t.muted }}>
            New arrival
          </p>
          <h1 className="text-3xl font-bold tracking-tight mt-1.5">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: t.muted }}>
            <div className="flex" style={{ color: t.accent }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <span>(128 reviews)</span>
          </div>

          <div className="mt-4 text-2xl font-semibold">{formatPrice(product.price, currency)}</div>

          <p className="mt-4 text-sm leading-relaxed" style={{ color: t.muted }}>
            Crafted with attention to detail, this piece blends timeless design with modern comfort.
            A versatile staple that works for every season.
          </p>

          {/* Variant */}
          <div className="mt-5">
            <p className="text-xs font-medium mb-2">Size</p>
            <div className="flex gap-2">
              {["S", "M", "L", "XL"].map((s, i) => (
                <div
                  key={s}
                  className="h-9 w-9 inline-flex items-center justify-center text-xs font-medium"
                  style={{
                    border: `1px solid ${i === 1 ? t.primary : t.border}`,
                    color: i === 1 ? t.primary : t.fg,
                    borderRadius: t.radius.md,
                    backgroundColor: i === 1 ? `${t.primary}10` : "transparent",
                  }}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-6 flex gap-2">
            <button
              className="flex-1 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              {labels.add_to_cart}
            </button>
            <button
              className="h-12 w-12 inline-flex items-center justify-center"
              style={{
                border: `1px solid ${t.border}`,
                borderRadius: t.buttonRadius,
                color: t.fg,
              }}
            >
              <Heart className="h-4 w-4" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-xs" style={{ color: t.muted }}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Truck className="h-4 w-4" style={{ color: t.primary }} />
              <span>Free shipping</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <RotateCcw className="h-4 w-4" style={{ color: t.primary }} />
              <span>30-day returns</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Shield className="h-4 w-4" style={{ color: t.primary }} />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related */}
      <div className="px-6 py-8" style={{ borderTop: `1px solid ${t.border}` }}>
        <h2 className="text-lg font-bold mb-4">You may also like</h2>
        <div className="grid grid-cols-4 gap-4">
          {related.map((p, i) => (
            <div key={i}>
              <div
                className="overflow-hidden"
                style={{
                  backgroundColor: t.surface,
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius.lg,
                  aspectRatio: "1 / 1",
                }}
              >
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div
                    className="h-full w-full"
                    style={{ background: `linear-gradient(135deg, ${t.primary}22, ${t.accent}10)` }}
                  />
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium line-clamp-1">{p.name}</span>
                <span className="text-xs font-semibold whitespace-nowrap">
                  {formatPrice(p.price, currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
