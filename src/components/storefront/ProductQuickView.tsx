import { useState } from "react";
import { X, ShoppingBag, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { formatPrice, type StoreTokens } from "@/lib/storeTheme";
import type { ProductCardData } from "./ProductCard";
import { cn } from "@/lib/utils";

interface QuickViewProps {
  product: ProductCardData;
  tokens: StoreTokens;
  currency: string;
  slug: string;
  addLabel: string;
  onClose: () => void;
  onAdd: (p: ProductCardData, qty: number) => void;
}

export function ProductQuickView({
  product,
  tokens: t,
  currency,
  slug,
  addLabel,
  onClose,
  onAdd,
}: QuickViewProps) {
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const images = product.images.filter(Boolean);
  const out = (product.stock ?? 1) <= 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card rounded-3xl shadow-2xl border border-border/50 animate-in zoom-in-95 fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50 hover:bg-background transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image gallery */}
          <div className="relative aspect-square md:aspect-auto md:min-h-[400px] bg-muted/30 overflow-hidden rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none">
            {images.length > 0 ? (
              <>
                <Img
                  src={images[activeImg]}
                  alt={product.name}
                  objectFit="cover"
                  className="absolute inset-0 transition-opacity duration-300"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg((i) => (i > 0 ? i - 1 : images.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50 hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setActiveImg((i) => (i < images.length - 1 ? i + 1 : 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50 hover:bg-background transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={cn(
                          "h-2 rounded-full transition-all duration-200",
                          i === activeImg ? "w-6 bg-primary" : "w-2 bg-foreground/30",
                        )}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <ShoppingBag className="h-16 w-16 opacity-15" style={{ color: t.muted }} />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 flex flex-col">
            {product.category && (
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-2"
                style={{ color: t.primary }}
              >
                {product.category}
              </div>
            )}
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: t.fg }}>
              {product.name}
            </h2>

            <div className="mt-4">
              <span className="text-3xl font-bold" style={{ color: t.fg }}>
                {formatPrice(Number(product.price), currency)}
              </span>
            </div>

            {product.stock != null && product.stock > 0 && product.stock <= 10 && (
              <p className="mt-3 text-sm" style={{ color: t.accent }}>
                Only {product.stock} left in stock
              </p>
            )}

            <div className="mt-auto pt-6">
              {!out ? (
                <>
                  {/* Quantity selector */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-medium" style={{ color: t.muted }}>
                      Qty
                    </span>
                    <div
                      className="inline-flex items-center border"
                      style={{ borderColor: t.border, borderRadius: t.buttonRadius }}
                    >
                      <button
                        onClick={() => setQty((q) => Math.max(1, q - 1))}
                        className="h-10 w-10 flex items-center justify-center hover:opacity-70 transition-opacity"
                        style={{ color: t.fg }}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span
                        className="h-10 w-12 flex items-center justify-center text-sm font-semibold border-x"
                        style={{ borderColor: t.border, color: t.fg }}
                      >
                        {qty}
                      </span>
                      <button
                        onClick={() => setQty((q) => q + 1)}
                        className="h-10 w-10 flex items-center justify-center hover:opacity-70 transition-opacity"
                        style={{ color: t.fg }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onAdd(product, qty);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: t.primary,
                      color: t.onPrimary,
                      borderRadius: t.buttonRadius,
                      boxShadow: `0 8px 30px -8px ${t.primary}44`,
                    }}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {addLabel}
                  </button>
                </>
              ) : (
                <div
                  className="w-full text-center px-6 py-3.5 text-sm font-semibold"
                  style={{
                    backgroundColor: t.surface,
                    color: t.muted,
                    borderRadius: t.buttonRadius,
                  }}
                >
                  Sold out
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
