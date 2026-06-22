import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Search,
  ShoppingBag,
  Mail,
  ArrowRight,
  Sparkles,
  Star,
  Grid3X3,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { ProductCard, type ProductCardData } from "@/components/storefront/ProductCard";
import { ProductQuickView } from "@/components/storefront/ProductQuickView";
import { FloatingCartDrawer } from "@/components/storefront/FloatingCartDrawer";
import { LAYOUT_COMPONENTS, type LayoutTemplate } from "@/components/storefront/layouts";
import {
  getStoreTokens,
  getButtonLabels,
  getSectionTitles,
  getSectionOrder,
  type StoreSettings,
  type SectionKey,
} from "@/lib/storeTheme";
import { useCart } from "@/hooks/use-cart";
import { fetchSettings, getCachedSettings, setCachedSettings } from "@/lib/storefrontCache";
import { SearchableSelect } from "@/components/ui/searchable-select";

type Product = Pick<
  Tables<"products">,
  "id" | "name" | "price" | "images" | "category" | "stock" | "created_at"
>;

function StoreSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-64 bg-muted/40 w-full" />
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
        <div className="h-8 w-48 bg-muted/40 rounded" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-3">
              <div className="aspect-square bg-muted/40 rounded" />
              <div className="h-4 w-3/4 bg-muted/40 rounded" />
              <div className="h-4 w-1/2 bg-muted/40 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/s/$slug/")({
  component: StorefrontHome,
  pendingComponent: StoreSkeleton,
  pendingMs: 0,
  loader: async ({ params }) => {
    try {
      return await fetchSettings(params.slug);
    } catch {
      return null;
    }
  },
  head: ({ params, loaderData }) => {
    const storeName = loaderData?.store_name ?? params.slug;
    const tagline = loaderData?.tagline ?? loaderData?.about_content ?? null;
    const description = tagline
      ? String(tagline).slice(0, 160)
      : `Shop ${storeName} online — discover products with fast checkout and delivery, powered by Fennecly.`;
    const title = `${storeName} — Online store`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: storeName },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Store",
            name: storeName,
            description,
            url: `https://fennecly.online/s/${params.slug}`,
          }),
        },
      ],
    };
  },
});

type SortKey = "newest" | "price-asc" | "price-desc" | "name";

const ALGERIAN_LAYOUTS = new Set<string>([
  "sahara",
  "mediterranean",
  "casbah",
  "atlas",
  "tlemcen",
  "constantine",
  "oran",
  "ghardaia",
  "kabyle",
  "algiers",
]);

// ── TikTok Pixel injection ────────────────────────────────────────
const TIKTOK_PIXEL_ID_PATTERN = /^[A-Za-z0-9]{1,30}$/;

function TikTokPixel({ pixelId }: { pixelId: string }) {
  useEffect(() => {
    if (!pixelId) return;
    // Validate against strict allowlist to prevent script injection
    if (!TIKTOK_PIXEL_ID_PATTERN.test(pixelId)) {
      console.warn("Invalid TikTok pixel ID format; skipping injection.");
      return;
    }
    // Avoid duplicate injection
    if (document.getElementById("tt-pixel")) return;

    const script = document.createElement("script");
    script.id = "tt-pixel";
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;
        var ttq=w[t]=w[t]||[];
        ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
        for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
        ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("tt-pixel");
      if (el) el.remove();
    };
  }, [pixelId]);

  return null;
}

function StorefrontHome() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const initialSettings = getCachedSettings(slug);
  const [settings, setSettings] = useState<StoreSettings | null>(initialSettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!initialSettings);
  const [notFound, setNotFound] = useState(false);
  const [tiktokPixelId, setTiktokPixelId] = useState<string>("");
  const cart = useCart(slug);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("newest");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductCardData | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      let s = await fetchSettings(slug);
      // Retry up to 2 times on transient failures
      for (let attempt = 0; !s && attempt < 2; attempt++) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        if (!active) return;
        s = await fetchSettings(slug);
      }
      if (!active) return;
      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setSettings(s);
      setCachedSettings(slug, s);

      // Fetch products
      const { data: p } = await supabase
        .from("products")
        .select("id,name,price,images,category,stock,created_at")
        .eq("user_id", s.user_id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setProducts(p ?? []);

      // ── Fetch TikTok Pixel ID from stores table ──
      const { data: storeRow } = await supabase
        .from("stores")
        .select("tiktok_pixel_id")
        .eq("slug", slug)
        .maybeSingle();
      if (active && storeRow?.tiktok_pixel_id) {
        setTiktokPixelId(storeRow.tiktok_pixel_id);
      }

      setLoading(false);

      channel = supabase
        .channel(`store-settings-${s.user_id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "store_settings",
            filter: `user_id=eq.${s.user_id}`,
          },
          (payload) => {
            if (!active) return;
            setSettings(payload.new as StoreSettings);
          },
        )
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [slug]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set).sort()];
  }, [products]);

  const filtered = useMemo(() => {
    let list = products;
    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        sorted.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [products, activeCategory, query, sort]);

  if (loading && !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center">
        <h1 className="text-3xl font-bold">{tr("storefront.notFound")}</h1>
        <p className="mt-2 text-muted-foreground max-w-sm">
          {tr("storefront.notFoundDesc", { slug })}
        </p>
        <button
          onClick={() => router.navigate({ to: "/" })}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {tr("storefront.goHome")}
        </button>
      </div>
    );
  }

  const t = getStoreTokens(settings);
  const labels = getButtonLabels(settings);
  const titles = getSectionTitles(settings);
  const template = settings.theme;
  const isBold = template === "bold";
  const isMinimal = template === "minimal";
  const currency = settings.currency || "DZD";
  const featured = products.slice(0, 8);

  const gridClass =
    template === "grid"
      ? "grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
      : template === "minimal"
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
        : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8";

  const isAlgerianLayout = ALGERIAN_LAYOUTS.has(template);

  const handleQuickAdd = useCallback(
    (p: { id: string; name: string; price: number; images: string[] }) => {
      cart.add({
        productId: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.images[0] ?? null,
      });
      toast.success(tr("storefront.product.addedToCart", { name: p.name }));
    },
    [cart, tr],
  );

  const handleQuickViewAdd = useCallback(
    (p: ProductCardData, qty: number) => {
      cart.add(
        {
          productId: p.id,
          name: p.name,
          price: Number(p.price),
          image: p.images[0] ?? null,
        },
        qty,
      );
      toast.success(tr("storefront.product.addedToCart", { name: p.name }));
    },
    [cart, tr],
  );

  // ── Algerian layout rendering ──
  if (isAlgerianLayout) {
    const LayoutComponent = LAYOUT_COMPONENTS[template as LayoutTemplate];
    const layoutProducts = filtered.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      images: p.images as string[],
      category: p.category,
      stock: p.stock,
    }));

    return (
      <StorefrontShell settings={settings}>
        {tiktokPixelId && <TikTokPixel pixelId={tiktokPixelId} />}
        <Suspense
          fallback={
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: t.muted }} />
            </div>
          }
        >
          <LayoutComponent
            products={layoutProducts}
            tokens={t}
            currency={currency}
            slug={slug}
            brandName={settings.store_name || "Store"}
            heroHeading={settings.hero_heading || "Welcome"}
            heroSubheading={settings.hero_subheading || ""}
            heroCta={settings.hero_cta_label || "Shop Now"}
            onAddToCart={(p) => {
              cart.add({
                productId: p.id,
                name: p.name,
                price: p.price,
                image: p.images[0] ?? null,
              });
              toast.success(tr("storefront.product.addedToCart", { name: p.name }));
            }}
          />
        </Suspense>
      </StorefrontShell>
    );
  }

  // ── Legacy template rendering (fallback) ──
  const sectionRenderers: Record<SectionKey, () => React.ReactNode> = {
    hero: () =>
      settings.show_hero ? <StorefrontHero key="hero" settings={settings} tokens={t} /> : null,

    categories: () =>
      settings.show_categories && categories.length > 1 ? (
        <section
          key="categories"
          id="categories"
          className="px-5 sm:px-8 py-16 md:py-24 max-w-7xl mx-auto w-full"
        >
          <div className="flex items-end justify-between mb-10">
            <div>
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] mb-3 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: t.primary + "12", color: t.primary }}
              >
                <Grid3X3 className="h-3 w-3" />
                {tr("storefront.home.browse", { defaultValue: "Browse" })}
              </div>
              <h2
                className={`tracking-tight ${
                  isMinimal
                    ? "text-4xl md:text-5xl font-light"
                    : isBold
                      ? "text-3xl md:text-5xl font-black uppercase"
                      : "text-3xl md:text-4xl font-extrabold"
                }`}
              >
                {titles.categories}
              </h2>
              <p className="mt-2 text-base" style={{ color: t.muted }}>
                {titles.categories_sub}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.slice(1).map((c) => {
              const productInCat = products.find((p) => p.category === c);
              return (
                <button
                  key={c}
                  onClick={() => {
                    setActiveCategory(c);
                    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group relative overflow-hidden flex flex-col items-center justify-center text-center p-6 md:p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
                  style={{
                    backgroundColor: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: t.radius.lg + 4,
                    minHeight: 140,
                  }}
                >
                  {productInCat?.images[0] && (
                    <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
                      <img
                        src={productInCat.images[0]}
                        alt=""
                        role="presentation"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <span className="relative text-base font-bold">{c}</span>
                  <span className="relative text-xs mt-1.5" style={{ color: t.muted }}>
                    {products.filter((p) => p.category === c).length}{" "}
                    {tr("storefront.home.itemsLabel", { defaultValue: "items" })}
                  </span>
                  <ArrowRight
                    className="relative h-4 w-4 mt-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
                    style={{ color: t.primary }}
                  />
                </button>
              );
            })}
          </div>
        </section>
      ) : null,

    featured: () =>
      settings.show_featured && featured.length > 0 ? (
        <section
          key="featured"
          id="featured"
          className="px-5 sm:px-8 py-16 md:py-24 max-w-7xl mx-auto w-full"
        >
          <div className="flex items-end justify-between mb-10">
            <div>
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] mb-3 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: t.primary + "12", color: t.primary }}
              >
                <Sparkles className="h-3 w-3" />
                {tr("storefront.home.curated", { defaultValue: "Curated" })}
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {titles.featured}
              </h2>
              <p className="mt-2 text-base" style={{ color: t.muted }}>
                {titles.featured_sub}
              </p>
            </div>
            <a
              href="#shop"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: t.surface, color: t.fg, border: `1px solid ${t.border}` }}
            >
              {labels.view_all} <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
          <div className={`grid ${gridClass} stagger-reveal`}>
            {featured.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                slug={slug}
                tokens={t}
                template={template}
                currency={currency}
                addLabel={labels.add_to_cart}
                onAdd={handleQuickAdd}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        </section>
      ) : null,

    newsletter: () =>
      settings.show_newsletter ? (
        <section
          key="newsletter"
          id="contact"
          className="relative overflow-hidden px-5 sm:px-8 py-20 md:py-28"
          style={{
            backgroundColor: t.isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.02)",
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.06] pointer-events-none rounded-full"
            style={{ background: `radial-gradient(circle, ${t.primary}, transparent 70%)` }}
          />
          <div className="relative max-w-2xl mx-auto text-center">
            <div
              className="inline-flex items-center justify-center h-16 w-16 mb-6 rounded-2xl"
              style={{ backgroundColor: t.primary + "18" }}
            >
              <Mail className="h-7 w-7" style={{ color: t.primary }} />
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {titles.newsletter}
            </h3>
            <p className="mt-3 text-base md:text-lg leading-relaxed" style={{ color: t.muted }}>
              {titles.newsletter_sub}
            </p>
            {/* ── Newsletter subscriber table (create if missing):
                CREATE TABLE newsletter_subscribers (
                  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                  store_id uuid REFERENCES store_settings(user_id),
                  email text NOT NULL,
                  subscribed_at timestamptz DEFAULT now(),
                  UNIQUE(store_id, email)
                );
            ── */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newsletterEmail.trim()) return;
                setNewsletterLoading(true);
                const { error } = await (supabase as any).from("newsletter_subscribers").insert({
                  email: newsletterEmail.trim(),
                  store_id: settings?.user_id,
                  subscribed_at: new Date().toISOString(),
                });
                setNewsletterLoading(false);
                if (error) {
                  if (error.code === "23505") {
                    toast.success(tr("storefront.home.alreadySubscribed", { defaultValue: "You're already subscribed!" }));
                  } else {
                    toast.error(tr("storefront.home.subscribeError", { defaultValue: "Something went wrong. Please try again." }));
                  }
                } else {
                  toast.success(tr("storefront.home.subscribed"));
                  setNewsletterEmail("");
                }
              }}
              className="mt-8 flex flex-col sm:flex-row max-w-lg mx-auto gap-3"
            >
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder={tr("storefront.home.emailPh")}
                className="flex-1 px-5 py-4 text-base outline-none transition-all duration-200 focus:shadow-lg"
                style={{
                  backgroundColor: t.bg,
                  color: t.fg,
                  border: `2px solid ${t.border}`,
                  borderRadius: t.buttonRadius,
                }}
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="px-8 py-4 text-base font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  backgroundColor: t.primary,
                  color: t.onPrimary,
                  borderRadius: t.buttonRadius,
                  boxShadow: `0 8px 30px -8px ${t.primary}44`,
                }}
              >
                {newsletterLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  labels.subscribe
                )}
              </button>
            </form>
          </div>
        </section>
      ) : null,
  };

  const sectionOrder = getSectionOrder(settings);

  return (
    <StorefrontShell settings={settings}>
      {/* ── TikTok Pixel (injected if seller has set a pixel ID) ── */}
      {tiktokPixelId && <TikTokPixel pixelId={tiktokPixelId} />}

      {/* ── Quick View Modal ── */}
      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          tokens={t}
          currency={currency}
          slug={slug}
          addLabel={labels.add_to_cart}
          onClose={() => setQuickViewProduct(null)}
          onAdd={handleQuickViewAdd}
        />
      )}

      {/* ── Floating Cart Drawer ── */}
      <FloatingCartDrawer
        slug={slug}
        tokens={t}
        currency={currency}
        open={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
      />

      {/* ── Floating Cart Button ── */}
      {cart.count > 0 && (
        <button
          onClick={() => setCartDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-[100] h-14 w-14 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95"
          style={{
            backgroundColor: t.primary,
            color: t.onPrimary,
            borderRadius: t.buttonRadius,
            boxShadow: `0 12px 40px -8px ${t.primary}66`,
          }}
          aria-label="Open cart"
        >
          <ShoppingBag className="h-5 w-5" />
          <span
            className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-[11px] font-bold"
            style={{
              backgroundColor: t.accent,
              color: t.onAccent,
              borderRadius: 999,
            }}
          >
            {cart.count}
          </span>
        </button>
      )}

      <div style={{ backgroundColor: t.bg, color: t.fg }}>
        {sectionOrder.map((key) => sectionRenderers[key]())}

        {/* All products */}
        <section id="shop" className="px-5 sm:px-8 py-16 md:py-24 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-8 mb-10">
            <div>
              <div
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] mb-3 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: t.primary + "12", color: t.primary }}
              >
                <ShoppingBag className="h-3 w-3" />
                {tr("storefront.home.collection", { defaultValue: "Collection" })}
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                {tr("storefront.home.allProducts")}
              </h2>
              <p className="mt-2 text-base" style={{ color: t.muted }}>
                {tr("storefront.home.items", { count: filtered.length })}
                {activeCategory !== "All" &&
                  tr("storefront.home.inCategory", { category: activeCategory })}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              {settings.show_search && (
                <div
                  className="relative flex-1 max-w-md group"
                  style={{
                    border: `2px solid ${t.border}`,
                    borderRadius: t.radius.md + 4,
                    backgroundColor: t.surface,
                  }}
                >
                  <Search
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px]"
                    style={{ color: t.muted }}
                  />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={labels.search_placeholder}
                    className="w-full bg-transparent pl-12 pr-4 py-3.5 text-sm outline-none"
                    style={{ color: t.fg }}
                  />
                </div>
              )}
              <div className="flex items-center gap-3 flex-wrap">
                {categories.length > 1 && (
                  <SearchableSelect
                    value={activeCategory}
                    onChange={setActiveCategory}
                    options={categories}
                    placeholder={tr("storefront.home.allCategories", { defaultValue: "All Categories" })}
                    triggerStyle={{
                      border: `2px solid ${t.border}`,
                      borderRadius: t.radius.md + 4,
                      backgroundColor: t.surface,
                      color: t.fg,
                    }}
                  />
                )}
                <SearchableSelect
                  value={sort}
                  onChange={(v) => setSort(v as SortKey)}
                  options={["newest", "price-asc", "price-desc", "name"]}
                  placeholder={tr("storefront.home.sort.placeholder", { defaultValue: "Sort by" })}
                  triggerStyle={{
                    border: `2px solid ${t.border}`,
                    borderRadius: t.radius.md + 4,
                    backgroundColor: t.surface,
                    color: t.fg,
                  }}
                />
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div
              className="p-20 text-center"
              style={{
                borderRadius: t.radius.lg + 4,
                border: `2px solid ${t.border}`,
                backgroundColor: t.surface,
              }}
            >
              <ShoppingBag className="h-12 w-12 mx-auto opacity-30" style={{ color: t.muted }} />
              <p className="mt-5 text-lg font-semibold">
                {products.length === 0
                  ? tr("storefront.home.noProducts")
                  : tr("storefront.home.noMatches")}
              </p>
              <p className="mt-2 text-sm" style={{ color: t.muted }}>
                {products.length === 0
                  ? tr("storefront.home.noProductsDesc")
                  : tr("storefront.home.noMatchesDesc")}
              </p>
            </div>
          ) : (
            <div className={`grid ${gridClass} stagger-reveal`}>
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  slug={slug}
                  tokens={t}
                  template={template}
                  currency={currency}
                  addLabel={labels.add_to_cart}
                  onAdd={handleQuickAdd}
                  onQuickView={setQuickViewProduct}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </StorefrontShell>
  );
}
