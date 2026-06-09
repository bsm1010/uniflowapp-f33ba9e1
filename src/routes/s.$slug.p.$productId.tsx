import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Img } from "@/components/ui/Img";
import { StorefrontShell, getStoreTokens } from "@/components/storefront/StorefrontShell";
import { AlgerianCheckoutForm } from "@/components/storefront/AlgerianCheckoutForm";
import { useCart } from "@/hooks/use-cart";
import { fetchSettings, getCachedSettings, setCachedSettings } from "@/lib/storefrontCache";

type StoreSettings = Tables<"store_settings">;
type Product = Tables<"products">;

export const Route = createFileRoute("/s/$slug/p/$productId")({
  component: ProductPage,
  loader: async ({ params }) => {
    const settings = await fetchSettings(params.slug);
    if (!settings) return { settings: null, product: null };
    const { data: product } = await supabase
      .from("products")
      .select("id,name,description,price,images,stock")
      .eq("id", params.productId)
      .eq("user_id", settings.user_id)
      .maybeSingle();
    return { settings, product };
  },
  head: ({ params, loaderData }) => {
    const product = loaderData?.product;
    const settings = loaderData?.settings;
    const storeName = settings?.store_name ?? params.slug;
    const title = product ? `${product.name} — ${storeName}` : `Product — ${storeName}`;
    const description = product
      ? (product.description?.slice(0, 160) ??
        `${product.name} available at ${storeName}. Order online with fast checkout.`)
      : `Browse products at ${storeName} on Fennecly.`;
    const image = product?.images?.[0];
    const meta: Array<Record<string, string>> = [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ];
    if (image) {
      meta.push({ property: "og:image", content: image });
      meta.push({ name: "twitter:image", content: image });
    }
    const scripts = product
      ? [
          {
            type: "application/ld+json",
            children: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: product.name,
              description: product.description ?? undefined,
              image: product.images ?? undefined,
              offers: {
                "@type": "Offer",
                price: String(product.price),
                priceCurrency: settings?.currency || "DZD",
                availability:
                  (product.stock ?? 0) > 0
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
              },
            }),
          },
        ]
      : undefined;
    return { meta, scripts };
  },
});

function ProductPage() {
  const { slug, productId } = Route.useParams();
  const { t: tr } = useTranslation();

  const initialSettings = getCachedSettings(slug);
  const [settings, setSettings] = useState<StoreSettings | null>(initialSettings);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const cart = useCart(slug);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await fetchSettings(slug);
      if (!active) return;
      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSettings(s);
      setCachedSettings(slug, s);
      const { data: p } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("user_id", s.user_id)
        .maybeSingle();
      if (!active) return;
      if (!p) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setProduct(p);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug, productId]);

  if (!notFound && (loading || !product)) {
    if (settings) {
      return (
        <StorefrontShell settings={settings}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </StorefrontShell>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !settings || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="text-2xl font-bold">{tr("storefront.product.notFound")}</h1>
        <Link to="/s/$slug" params={{ slug }} className="mt-4 text-sm text-primary underline">
          {tr("storefront.product.back")}
        </Link>
      </div>
    );
  }

  const t = getStoreTokens(settings);
  const outOfStock = product.stock <= 0;
  const radius = settings.theme === "minimal" ? 0 : settings.theme === "grid" ? 8 : 16;

  const handleAdd = () => {
    cart.add(
      {
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.images[0] ?? null,
      },
      qty,
    );
    toast.success(tr("storefront.product.addedToCart", { name: product.name }));
  };

  return (
    <StorefrontShell settings={settings}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/s/$slug"
          params={{ slug }}
          className="inline-flex items-center gap-1.5 text-sm hover:opacity-70"
          style={{ color: t.muted }}
        >
          <ArrowLeft className="h-4 w-4" /> {tr("storefront.product.back")}
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* Gallery */}
          <div>
            <div
              className="aspect-square overflow-hidden"
              style={{
                backgroundColor: t.surface,
                border: `1px solid ${t.border}`,
                borderRadius: radius,
              }}
            >
              {product.images[activeImage] ? (
                <Img
                  src={product.images[activeImage]}
                  alt={product.name}
                  objectFit="cover"
                  className="h-full w-full"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(135deg, ${t.primary}22, ${t.primary}05)`,
                  }}
                />
              )}
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className="aspect-square overflow-hidden transition-opacity"
                    style={{
                      borderRadius: radius / 2,
                      border: `2px solid ${i === activeImage ? t.primary : "transparent"}`,
                      opacity: i === activeImage ? 1 : 0.7,
                    }}
                  >
                    <Img src={img} alt="" objectFit="cover" className="h-full w-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details + Checkout */}
          <div className="space-y-6">
            <div>
              {product.category && (
                <div
                  className="text-xs uppercase tracking-wider font-medium"
                  style={{ color: t.muted }}
                >
                  {product.category}
                </div>
              )}
              <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">{product.name}</h1>
              <div className="mt-3 text-2xl font-semibold" style={{ color: t.primary }}>
                {Number(product.price).toFixed(2)} DA
              </div>

              {product.description && (
                <p
                  className="mt-4 text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: t.muted }}
                >
                  {product.description}
                </p>
              )}

              <div className="mt-5">
                <div
                  className="text-xs uppercase tracking-wider font-medium mb-2"
                  style={{ color: t.muted }}
                >
                  {tr("storefront.product.quantity")}
                </div>
                <div
                  className="inline-flex items-center"
                  style={{
                    border: `1px solid ${t.border}`,
                    borderRadius: radius / 2,
                  }}
                >
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="h-10 w-10 inline-flex items-center justify-center hover:opacity-70 disabled:opacity-30"
                    disabled={qty <= 1}
                    aria-label={tr("storefront.product.decrease")}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{qty}</span>
                  <button
                    onClick={() =>
                      setQty((q) => (product.stock > 0 ? Math.min(product.stock, q + 1) : q + 1))
                    }
                    className="h-10 w-10 inline-flex items-center justify-center hover:opacity-70"
                    aria-label={tr("storefront.product.increase")}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-2 text-xs" style={{ color: t.muted }}>
                  {outOfStock
                    ? tr("storefront.product.outOfStock")
                    : product.stock <= 5
                      ? tr("storefront.product.lowStockLeft", { count: product.stock })
                      : tr("storefront.product.inStock")}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAdd}
                disabled={outOfStock}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 h-11 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
                style={{
                  backgroundColor: "transparent",
                  color: t.fg,
                  border: `1px solid ${t.border}`,
                  borderRadius: radius / 2,
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                {tr("storefront.product.addToCart")}
              </button>

              {!outOfStock && (
                <div className="flex-1">
                  <AlgerianCheckoutForm
                    storeOwnerId={settings.user_id}
                    storeSlug={slug}
                    product={{
                      id: product.id,
                      name: product.name,
                      price: Number(product.price),
                      image: product.images[0] ?? null,
                    }}
                    quantity={qty}
                    tokens={t}
                    radius={radius}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StorefrontShell>
  );
}
