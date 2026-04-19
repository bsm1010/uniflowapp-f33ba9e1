import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  StorefrontShell,
  getStoreTokens,
} from "@/components/storefront/StorefrontShell";
import { useCart } from "@/hooks/use-cart";

type StoreSettings = Tables<"store_settings">;

export const Route = createFileRoute("/s/$slug/cart")({
  component: CartPage,
  head: () => ({ meta: [{ title: "Cart — Storely" }] }),
});

function CartPage() {
  const { slug } = Route.useParams();
  const { t: tr } = useTranslation();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const cart = useCart(slug);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      setSettings(data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>{tr("storefront.notFound")}</p>
      </div>
    );
  }

  const t = getStoreTokens(settings);
  const radius =
    settings.theme === "minimal" ? 0 : settings.theme === "grid" ? 8 : 16;

  return (
    <StorefrontShell settings={settings}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/s/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-1.5 text-sm hover:opacity-70"
          style={{ color: t.muted }}
        >
          <ArrowLeft className="h-4 w-4" /> {tr("storefront.cart.continue")}
        </Link>

        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">
          {tr("storefront.cart.title")}
        </h1>

        {cart.items.length === 0 ? (
          <div
            className="mt-8 p-16 text-center"
            style={{
              borderRadius: radius,
              border: `1px solid ${t.border}`,
              backgroundColor: t.surface,
            }}
          >
            <ShoppingBag
              className="h-8 w-8 mx-auto"
              style={{ color: t.muted }}
            />
            <p className="mt-4 font-medium">{tr("storefront.cart.empty")}</p>
            <Link
              to="/s/$slug"
              params={{ slug }}
              className="inline-flex items-center justify-center mt-6 px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: radius / 2,
              }}
            >
              {tr("storefront.cart.browse")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-4 p-4"
                  style={{
                    border: `1px solid ${t.border}`,
                    backgroundColor: t.surface,
                    borderRadius: radius,
                  }}
                >
                  <Link
                    to="/s/$slug/p/$productId"
                    params={{ slug, productId: item.productId }}
                    className="h-20 w-20 shrink-0 overflow-hidden"
                    style={{
                      borderRadius: radius / 2,
                      backgroundColor: t.bg,
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{
                          background: `linear-gradient(135deg, ${t.primary}22, ${t.primary}05)`,
                        }}
                      />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to="/s/$slug/p/$productId"
                          params={{ slug, productId: item.productId }}
                          className="font-medium text-sm hover:underline truncate block"
                        >
                          {item.name}
                        </Link>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: t.muted }}
                        >
                          ${item.price.toFixed(2)} {tr("storefront.cart.each")}
                        </div>
                      </div>
                      <button
                        onClick={() => cart.remove(item.productId)}
                        className="hover:opacity-70"
                        style={{ color: t.muted }}
                        aria-label={tr("storefront.cart.remove")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div
                        className="inline-flex items-center"
                        style={{
                          border: `1px solid ${t.border}`,
                          borderRadius: radius / 2,
                        }}
                      >
                        <button
                          onClick={() =>
                            cart.setQty(item.productId, item.quantity - 1)
                          }
                          className="h-8 w-8 inline-flex items-center justify-center hover:opacity-70"
                          aria-label={tr("storefront.cart.decrease")}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            cart.setQty(item.productId, item.quantity + 1)
                          }
                          className="h-8 w-8 inline-flex items-center justify-center hover:opacity-70"
                          aria-label={tr("storefront.cart.increase")}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="text-sm font-semibold">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="p-6 h-fit lg:sticky lg:top-24"
              style={{
                border: `1px solid ${t.border}`,
                backgroundColor: t.surface,
                borderRadius: radius,
              }}
            >
              <h2 className="font-semibold">{tr("storefront.cart.summary")}</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: t.muted }}>{tr("storefront.cart.subtotal")}</span>
                  <span className="font-medium">
                    ${cart.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: t.muted }}>{tr("storefront.cart.shipping")}</span>
                  <span style={{ color: t.muted }}>{tr("storefront.cart.calcAtCheckout")}</span>
                </div>
              </div>
              <div
                className="mt-4 pt-4 flex justify-between text-base font-semibold"
                style={{ borderTop: `1px solid ${t.border}` }}
              >
                <span>{tr("storefront.cart.total")}</span>
                <span>${cart.subtotal.toFixed(2)}</span>
              </div>
              <Link
                to="/s/$slug/checkout"
                params={{ slug }}
                className="mt-6 inline-flex items-center justify-center w-full px-6 h-12 text-sm font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: t.primary,
                  color: t.onPrimary,
                  borderRadius: radius / 2,
                }}
              >
                {tr("storefront.cart.checkout")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </StorefrontShell>
  );
}
