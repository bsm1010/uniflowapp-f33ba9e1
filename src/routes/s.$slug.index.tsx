import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ShoppingBag, Mail, ArrowRight, Sparkles, Star, Grid3X3, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  getStoreTokens,
  getButtonLabels,
  getSectionTitles,
  getSectionOrder,
  type StoreSettings,
  type SectionKey,
} from "@/lib/storeTheme";
import { useCart } from "@/hooks/use-cart";

type Product = Pick<
  Tables<"products">,
  "id" | "name" | "price" | "images" | "category" | "stock"
>;

export const Route = createFileRoute("/s/$slug/")({
  component: StorefrontHome,
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — Storely` }],
  }),
});

type SortKey = "newest" | "price-asc" | "price-desc" | "name";

function StorefrontHome() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const cart = useCart(slug);

  // Browsing state
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data: s } = await supabase
        .from("store_settings")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      if (!s) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const { data: p } = await supabase
        .from("products")
        .select("id,name,price,images,category,stock")
        .eq("user_id", s.user_id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setSettings(s);
      setProducts(p ?? []);
      setLoading(false);

      // Subscribe to live store_settings changes for this store
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
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.category ?? "").toLowerCase().includes(q),
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

  if (loading) {
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
  const currency = settings.currency || "USD";

  const featured = products.slice(0, 8);

  const gridClass = "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-7";

  const handleQuickAdd = (p: Product) => {
    cart.add({
      productId: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.images[0] ?? null,
    });
    toast.success(tr("storefront.product.addedToCart", { name: p.name }));
  };

  const sectionRenderers: Record<SectionKey, () => React.ReactNode> = {
    hero: () =>
      settings.show_hero ? (
        <StorefrontHero key="hero" settings={settings} tokens={t} />
      ) : null,

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
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
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
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <span className="relative text-base font-bold">{c}</span>
                  <span className="relative text-xs mt-1.5" style={{ color: t.muted }}>
                    {products.filter((p) => p.category === c).length} {tr("storefront.home.itemsLabel", { defaultValue: "items" })}
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
          <div className={`grid ${gridClass}`}>
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
          {/* Decorative */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.06] pointer-events-none rounded-full"
            style={{ background: `radial-gradient(circle, ${t.primary}, transparent 70%)` }}
          />
          <div className="relative max-w-2xl mx-auto text-center">
            <div
              className="inline-flex items-center justify-center h-16 w-16 mb-6 rounded-2xl"
              style={{
                backgroundColor: t.primary + "18",
              }}
            >
              <Mail className="h-7 w-7" style={{ color: t.primary }} />
            </div>
            <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {titles.newsletter}
            </h3>
            <p className="mt-3 text-base md:text-lg leading-relaxed" style={{ color: t.muted }}>
              {titles.newsletter_sub}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success(tr("storefront.home.subscribed"));
              }}
              className="mt-8 flex flex-col sm:flex-row max-w-lg mx-auto gap-3"
            >
              <input
                type="email"
                required
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
                className="px-8 py-4 text-base font-semibold transition-all duration-300 hover:scale-[1.03] hover:shadow-lg active:scale-[0.98]"
                style={{
                  backgroundColor: t.primary,
                  color: t.onPrimary,
                  borderRadius: t.buttonRadius,
                  boxShadow: `0 8px 30px -8px ${t.primary}44`,
                }}
              >
                {labels.subscribe}
              </button>
            </form>
          </div>
        </section>
      ) : null,
  };

  const sectionOrder = getSectionOrder(settings);

  return (
    <StorefrontShell settings={settings}>
      {sectionOrder.map((key) => sectionRenderers[key]())}

      {/* All products */}
      <section
        id="shop"
        className="px-5 sm:px-8 py-16 md:py-24 max-w-7xl mx-auto w-full"
      >
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
              {activeCategory !== "All" && tr("storefront.home.inCategory", { category: activeCategory })}
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
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="text-sm px-4 py-3 outline-none cursor-pointer font-medium"
                  style={{
                    border: `2px solid ${t.border}`,
                    borderRadius: t.radius.md + 4,
                    backgroundColor: t.surface,
                    color: t.fg,
                  }}
                >
                  {categories.map((c) => (
                    <option key={c} value={c} style={{ backgroundColor: t.bg }}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="text-sm px-4 py-3 outline-none cursor-pointer font-medium"
                style={{
                  border: `2px solid ${t.border}`,
                  borderRadius: t.radius.md + 4,
                  backgroundColor: t.surface,
                  color: t.fg,
                }}
              >
                <option value="newest" style={{ backgroundColor: t.bg }}>{tr("storefront.home.sort.newest")}</option>
                <option value="price-asc" style={{ backgroundColor: t.bg }}>{tr("storefront.home.sort.priceAsc")}</option>
                <option value="price-desc" style={{ backgroundColor: t.bg }}>{tr("storefront.home.sort.priceDesc")}</option>
                <option value="name" style={{ backgroundColor: t.bg }}>{tr("storefront.home.sort.name")}</option>
              </select>
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
              {products.length === 0 ? tr("storefront.home.noProducts") : tr("storefront.home.noMatches")}
            </p>
            <p className="mt-2 text-sm" style={{ color: t.muted }}>
              {products.length === 0
                ? tr("storefront.home.noProductsDesc")
                : tr("storefront.home.noMatchesDesc")}
            </p>
          </div>
        ) : (
          <div className={`grid ${gridClass}`}>
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
              />
            ))}
          </div>
        )}
      </section>
    </StorefrontShell>
  );
}

void Link;
void Star;
void SlidersHorizontal;
