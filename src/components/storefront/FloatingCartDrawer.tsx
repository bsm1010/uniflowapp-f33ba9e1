import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Img } from "@/components/ui/Img";
import { formatPrice, type StoreTokens } from "@/lib/storeTheme";
import { useCart, type CartItem } from "@/hooks/use-cart";
import { cn } from "@/lib/utils";

interface Props {
  slug: string;
  tokens: StoreTokens;
  currency: string;
  open: boolean;
  onClose: () => void;
}

export function FloatingCartDrawer({ slug, tokens: t, currency, open, onClose }: Props) {
  const cart = useCart(slug);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[180] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[190] h-full w-full max-w-md bg-card border-l shadow-2xl flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        style={{ borderColor: t.border }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: t.border }}
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" style={{ color: t.primary }} />
            <span className="font-semibold text-lg" style={{ color: t.fg }}>
              Cart ({cart.count})
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
            style={{ color: t.muted }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-12 w-12 mb-4 opacity-15" style={{ color: t.muted }} />
              <p className="font-medium" style={{ color: t.muted }}>
                Your cart is empty
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cart.items.map((item) => (
                <CartItemRow key={item.productId} item={item} cart={cart} tokens={t} currency={currency} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="px-6 py-5 border-t" style={{ borderColor: t.border }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm" style={{ color: t.muted }}>Subtotal</span>
              <span className="text-xl font-bold" style={{ color: t.fg }}>
                {formatPrice(cart.subtotal, currency)}
              </span>
            </div>
            <Link
              to="/s/$slug/checkout"
              params={{ slug }}
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: t.buttonRadius,
                boxShadow: `0 8px 30px -8px ${t.primary}44`,
              }}
            >
              Checkout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function CartItemRow({
  item,
  cart,
  tokens: t,
  currency,
}: {
  item: CartItem;
  cart: ReturnType<typeof useCart>;
  tokens: StoreTokens;
  currency: string;
}) {
  return (
    <div className="flex gap-3">
      <div
        className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden"
        style={{ backgroundColor: t.surface }}
      >
        {item.image ? (
          <Img src={item.image} alt={item.name} objectFit="cover" className="h-full w-full" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 opacity-15" style={{ color: t.muted }} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: t.fg }}>
          {item.name}
        </p>
        <p className="text-sm mt-0.5" style={{ color: t.muted }}>
          {formatPrice(item.price, currency)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div
            className="inline-flex items-center border text-xs"
            style={{ borderColor: t.border, borderRadius: t.radius.sm }}
          >
            <button
              onClick={() => cart.setQty(item.productId, item.quantity - 1)}
              className="h-7 w-7 flex items-center justify-center hover:opacity-70"
              style={{ color: t.fg }}
            >
              <Minus className="h-3 w-3" />
            </button>
            <span
              className="h-7 w-8 flex items-center justify-center font-medium border-x"
              style={{ borderColor: t.border, color: t.fg }}
            >
              {item.quantity}
            </span>
            <button
              onClick={() => cart.setQty(item.productId, item.quantity + 1)}
              className="h-7 w-7 flex items-center justify-center hover:opacity-70"
              style={{ color: t.fg }}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <button
            onClick={() => cart.remove(item.productId)}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
            style={{ color: t.muted }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
