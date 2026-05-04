import { Link } from "@tanstack/react-router";
import { ShoppingBag, Eye } from "lucide-react";
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
  onAdd?: (p: ProductCardData) => void;
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
  const out = (product.stock ?? 1) <= 0;
  const isNew = false; // Could be driven by created_at logic

  return (
    <div className="group relative flex flex-col">
      {/* Image container */}
      <Link
        to="/s/$slug/p/$productId"
        params={{ slug, productId: product.id }}
        className="block relative overflow-hidden"
        style={{
          backgroundColor: t.surface,
          borderRadius: t.radius.lg + 4,
          aspectRatio: "3 / 4",
        }}
      >
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div
            className="h-full w-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${t.surface}, ${t.surfaceStrong})`,
            }}
          >
            <ShoppingBag className="h-12 w-12 opacity-20" style={{ color: t.muted }} />
          </div>
        )}

        {/* Second image on hover */}
        {product.images[1] && (
          <img
            src={product.images[1]}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {out && (
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 backdrop-blur-sm"
              style={{
                backgroundColor: t.fg + "dd",
                color: t.bg,
                borderRadius: t.radius.sm + 2,
              }}
            >
              {tr("storefront.card.soldOut")}
            </span>
          )}
          {!out && (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5 && (
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 backdrop-blur-sm"
              style={{
                backgroundColor: t.accent + "ee",
                color: t.onAccent,
                borderRadius: t.radius.sm + 2,
              }}
            >
              {tr("storefront.card.lowStock")}
            </span>
          )}
          {isNew && !out && (
            <span
              className="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 backdrop-blur-sm"
              style={{
                backgroundColor: t.primary + "ee",
                color: t.onPrimary,
                borderRadius: t.radius.sm + 2,
              }}
            >
              {tr("storefront.card.new", { defaultValue: "New" })}
            </span>
          )}
        </div>

        {/* Quick actions overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          {onAdd && !out && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd(product);
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold backdrop-blur-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: t.primary + "ee",
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
              }}
            >
              <ShoppingBag className="h-4 w-4" />
              {addLabel}
            </button>
          )}
          <Link
            to="/s/$slug/p/$productId"
            params={{ slug, productId: product.id }}
            className="inline-flex items-center justify-center h-[44px] w-[44px] backdrop-blur-md transition-all duration-200 hover:scale-110"
            style={{
              backgroundColor: t.bg + "cc",
              color: t.fg,
              borderRadius: t.buttonRadius,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>
      </Link>

      {/* Product info */}
      <div className="mt-4 px-1">
        {product.category && (
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-1.5"
            style={{ color: t.primary }}
          >
            {product.category}
          </div>
        )}
        <Link
          to="/s/$slug/p/$productId"
          params={{ slug, productId: product.id }}
          className="text-base font-semibold line-clamp-2 block leading-snug transition-colors duration-200"
          style={{ color: t.fg }}
        >
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="text-lg font-bold"
            style={{ color: t.fg }}
          >
            {formatPrice(Number(product.price), currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
