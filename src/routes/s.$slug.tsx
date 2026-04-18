import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ShoppingBag, Mail, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { StorefrontHero } from "@/components/storefront/StorefrontHero";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  getStoreTokens,
  getButtonLabels,
  getSectionTitles,
  type StoreSettings,
} from "@/lib/storeTheme";
import { useCart } from "@/hooks/use-cart";

type Product = Pick<
  Tables<"products">,
  "id" | "name" | "price" | "images" | "category" | "stock"
>;

export const Route = createFileRoute("/s/$slug")({
  component: StorefrontHome,
  head: ({ params }) => ({
    meta: [{ title: `${params.slug} — Storely` }],
  }),
});

type SortKey = "newest" | "price-asc" | "price-desc" | "name";

function StorefrontHome() {
  const { slug } = Route.useParams();
  const router = useRouter();
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
    })();
    return () => {
      active = false;
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
        <h1 className="text-3xl font-bold">Store not found</h1>
        <p className="mt-2 text-muted-foreground max-w-sm">
          The storefront <code className="font-mono">{slug}</code> doesn't exist
          or hasn't been published yet.
        </p>
        <button
          onClick={() => router.navigate({ to: "/" })}
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </button>
      </div>
    );
  }

  const t = getStoreTokens(settings);
  const labels = getButtonLabels(settings);
  const titles = getSectionTitles(settings);
  const template = settings.theme;
  const currency = settings.currency || "USD";

  const featured = products.slice(0, template === "grid" ? 8 : 6);

  const gridClass =
    template === "grid"
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      : template === "minimal"
        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 md:gap-10"
        : template === "editorial"
          ? "grid-cols-2 md:grid-cols-3 gap-6 md:gap-8"
          : template === "bold"
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5"
            : "grid-cols-2 md:grid-cols-3 gap-6";

  const handleQuickAdd = (p: Product) => {
    cart.add({
      productId: p.id,
      name: p.name,
      price: Number(p.price),
      image: p.images[0] ?? null,
    });
    toast.success(`${p.name} added to cart`);
  };

  return (
    <StorefrontShell settings={settings}>
      {settings.show_hero && <StorefrontHero settings={settings} tokens={t} />}

      {/* Categories strip */}
      {settings.show_categories && categories.length > 1 && (
        <section
          id="categories"
          className="px-4 sm:px-6 py-12 md:py-16 max-w-6xl mx-auto w-full"
        >
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {titles.categories}
              </h2>
              <p className="mt-1 text-sm" style={{ color: t.muted }}>
                {titles.categories_sub}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(1).map((c) => {
              const productInCat = products.find((p) => p.category === c);
              return (
                <button
                  key={c}
                  onClick={() => {
                    setActiveCategory(c);
                    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group relative overflow-hidden flex items-center gap-3 px-4 py-3 transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: t.radius.md,
                  }}
                >
                  {productInCat?.images[0] && (
                    <img
                      src={productInCat.images[0]}
                      alt=""
                      className="h-10 w-10 object-cover"
                      style={{ borderRadius: t.radius.sm }}
                    />
                  )}
                  <span className="text-sm font-medium pr-2">{c}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: t.primary }}
                  />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Featured products */}
      {settings.show_featured && featured.length > 0 && (
        <section
          id="featured"
          className="px-4 sm:px-6 py-12 md:py-16 max-w-6xl mx-auto w-full"
          style={{ borderTop: `1px solid ${t.border}` }}
        >
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {titles.featured}
              </h2>
              <p className="mt-1 text-sm" style={{ color: t.muted }}>
                {titles.featured_sub}
              </p>
            </div>
            <a
              href="#shop"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-medium hover:gap-2 transition-all"
              style={{ color: t.primary }}
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
      )}

      {/* All products + search/filter */}
      <section
        id="shop"
        className="px-4 sm:px-6 py-12 md:py-16 max-w-6xl mx-auto w-full"
        style={{ borderTop: `1px solid ${t.border}` }}
      >
        <div className="flex flex-col gap-6 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              All products
            </h2>
            <p className="mt-1 text-sm" style={{ color: t.muted }}>
              {filtered.length} {filtered.length === 1 ? "item" : "items"}
              {activeCategory !== "All" && ` in ${activeCategory}`}
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            {settings.show_search && (
              <div
                className="relative flex-1 max-w-md"
                style={{
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius.md,
                  backgroundColor: t.surface,
                }}
              >
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: t.muted }}
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={labels.search_placeholder}
                  className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm outline-none"
                  style={{ color: t.fg }}
                />
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              {categories.length > 1 && (
                <select
                  value={activeCategory}
                  onChange={(e) => setActiveCategory(e.target.value)}
                  className="text-sm px-3 py-2.5 outline-none cursor-pointer"
                  style={{
                    border: `1px solid ${t.border}`,
                    borderRadius: t.radius.md,
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
                className="text-sm px-3 py-2.5 outline-none cursor-pointer"
                style={{
                  border: `1px solid ${t.border}`,
                  borderRadius: t.radius.md,
                  backgroundColor: t.surface,
                  color: t.fg,
                }}
              >
                <option value="newest" style={{ backgroundColor: t.bg }}>Newest</option>
                <option value="price-asc" style={{ backgroundColor: t.bg }}>Price: Low to High</option>
                <option value="price-desc" style={{ backgroundColor: t.bg }}>Price: High to Low</option>
                <option value="name" style={{ backgroundColor: t.bg }}>Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            className="p-16 text-center"
            style={{
              borderRadius: t.radius.lg,
              border: `1px solid ${t.border}`,
              backgroundColor: t.surface,
            }}
          >
            <ShoppingBag className="h-8 w-8 mx-auto" style={{ color: t.muted }} />
            <p className="mt-4 font-medium">
              {products.length === 0 ? "No products yet" : "No matches"}
            </p>
            <p className="mt-1 text-sm" style={{ color: t.muted }}>
              {products.length === 0
                ? "Check back soon — new items are on the way."
                : "Try a different search or category."}
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

      {/* Newsletter */}
      {settings.show_newsletter && (
        <section
          id="contact"
          className="px-4 sm:px-6 py-16 md:py-24 text-center"
          style={{
            backgroundColor: t.surface,
            borderTop: `1px solid ${t.border}`,
          }}
        >
          <div className="max-w-xl mx-auto">
            <div
              className="inline-flex items-center justify-center h-12 w-12 mb-5"
              style={{
                backgroundColor: t.primary + "22",
                borderRadius: t.radius.md,
              }}
            >
              <Mail className="h-5 w-5" style={{ color: t.primary }} />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold tracking-tight">
              {titles.newsletter}
            </h3>
            <p className="mt-2 text-sm md:text-base" style={{ color: t.muted }}>
              {titles.newsletter_sub}
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Thanks for subscribing!");
              }}
              className="mt-6 flex max-w-md mx-auto gap-2"
            >
              <input
                type="email"
                required
                placeholder="you@email.com"
                className="flex-1 px-4 py-3 text-sm outline-none focus:ring-2"
                style={{
                  backgroundColor: t.bg,
                  color: t.fg,
                  border: `1px solid ${t.border}`,
                  borderRadius: t.buttonRadius,
                }}
              />
              <button
                type="submit"
                className="px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: t.primary,
                  color: t.onPrimary,
                  borderRadius: t.buttonRadius,
                }}
              >
                {labels.subscribe}
              </button>
            </form>
          </div>
        </section>
      )}
    </StorefrontShell>
  );
}

// Suppress unused Link import warning (kept for potential future use)
void Link;
