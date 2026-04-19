import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StoreTokens } from "@/lib/storeTheme";
import { formatPrice } from "@/lib/storeTheme";

export interface ProductCardData {
  id: string;
  name: string;
  price: number;
  images: string[];
  category?: string | null;
  stock?: number | null;
}

interface Props {
  product: ProductCardData;
  slug: string;
  tokens: StoreTokens;
  template: string;
  currency: string;
  addLabel: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onAdd?: (p: any) => void;
}

export function ProductCard({
  product,
  slug,
  tokens: t,
  template,
  currency,
  addLabel,
  onAdd,
}: Props) {
  const { t: tr } = useTranslation();
  const isMinimal = template === "minimal";
  const isEditorial = template === "editorial";
  const cardRadius = isMinimal ? 0 : t.radius.lg;
  const out = (product.stock ?? 1) <= 0;

  return (
    <div className="group relative flex flex-col">
      <Link
        to="/s/$slug/p/$productId"
        params={{ slug, productId: product.id }}
        className="block relative overflow-hidden"
        style={{
          backgroundColor: t.surface,
          border: isMinimal ? "none" : `1px solid ${t.border}`,
          borderRadius: cardRadius,
          aspectRatio: isEditorial ? "3 / 4" : "1 / 1",
        }}
      >
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${t.primary}22, ${t.accent}10)`,
            }}
          >
            <ShoppingBag className="h-8 w-8" style={{ color: t.muted }} />
          </div>
        )}

        {/* Hover image overlay (second image if available) */}
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {out && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1"
              style={{
                backgroundColor: t.fg,
                color: t.bg,
                borderRadius: t.radius.sm,
              }}
            >
              {tr("storefront.card.soldOut")}
            </span>
          )}
          {!out && (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5 && (
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1"
              style={{
                backgroundColor: t.accent,
                color: t.onAccent,
                borderRadius: t.radius.sm,
              }}
            >
              {tr("storefront.card.lowStock")}
            </span>
          )}
        </div>

        {/* Quick add button on hover */}
        {onAdd && !out && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAdd(product);
            }}
            className="absolute bottom-3 left-3 right-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 backdrop-blur-sm"
            style={{
              backgroundColor: t.primary,
              color: t.onPrimary,
              borderRadius: t.buttonRadius,
            }}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {addLabel}
          </button>
        )}
      </Link>

      <div
        className={`mt-3 flex items-start justify-between gap-2 ${
          isEditorial ? "text-center flex-col items-center mt-4" : ""
        }`}
      >
        <div className="min-w-0">
          {product.category && (
            <div
              className="text-[10px] uppercase tracking-wider mb-0.5"
              style={{ color: t.muted }}
            >
              {product.category}
            </div>
          )}
          <Link
            to="/s/$slug/p/$productId"
            params={{ slug, productId: product.id }}
            className="text-sm font-medium hover:underline line-clamp-1 block"
          >
            {product.name}
          </Link>
        </div>
        <span className="text-sm font-semibold whitespace-nowrap">
          {formatPrice(Number(product.price), currency)}
        </span>
      </div>
    </div>
  );
}
