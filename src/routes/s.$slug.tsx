import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  StorefrontShell,
  getStoreTokens,
} from "@/components/storefront/StorefrontShell";

type StoreSettings = Tables<"store_settings">;
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

function StorefrontHome() {
  const { slug } = Route.useParams();
  const router = useRouter();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
  const grid =
    settings.theme === "grid"
      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      : settings.theme === "minimal"
        ? "grid-cols-1 md:grid-cols-2 gap-10"
        : "grid-cols-2 md:grid-cols-3 gap-6";
  const cardRadius =
    settings.theme === "minimal"
      ? "rounded-none"
      : settings.theme === "grid"
        ? "rounded-md"
        : "rounded-2xl";

  return (
    <StorefrontShell settings={settings}>
      {settings.show_hero && (
        <section
          className="px-4 sm:px-6 py-20 md:py-28 text-center"
          style={{ borderBottom: `1px solid ${t.border}` }}
        >
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {settings.hero_heading}
            </h1>
            <p
              className="mt-5 text-base md:text-lg"
              style={{ color: t.muted }}
            >
              {settings.hero_subheading}
            </p>
            <a
              href="#shop"
              className="inline-flex items-center justify-center mt-8 px-7 py-3 text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: t.primary,
                color: t.onPrimary,
                borderRadius: settings.theme === "minimal" ? 0 : 999,
              }}
            >
              {settings.hero_cta_label}
            </a>
          </div>
        </section>
      )}

      <section id="shop" className="px-4 sm:px-6 py-12 md:py-16 max-w-6xl mx-auto w-full">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              All products
            </h2>
            <p className="mt-1 text-sm" style={{ color: t.muted }}>
              {products.length} {products.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {products.length === 0 ? (
          <div
            className="rounded-2xl border p-16 text-center"
            style={{
              borderColor: t.border,
              backgroundColor: t.surface,
            }}
          >
            <ShoppingBag
              className="h-8 w-8 mx-auto"
              style={{ color: t.muted }}
            />
            <p className="mt-4 font-medium">No products yet</p>
            <p className="mt-1 text-sm" style={{ color: t.muted }}>
              Check back soon — new items are on the way.
            </p>
          </div>
        ) : (
          <div className={`grid ${grid}`}>
            {products.map((p) => (
              <Link
                key={p.id}
                to="/s/$slug/p/$productId"
                params={{ slug, productId: p.id }}
                className="group block"
              >
                <div
                  className={`aspect-square overflow-hidden ${cardRadius}`}
                  style={{
                    backgroundColor: t.surface,
                    border: `1px solid ${t.border}`,
                  }}
                >
                  {p.images[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    {p.category && (
                      <div
                        className="text-xs mt-0.5"
                        style={{ color: t.muted }}
                      >
                        {p.category}
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">
                    ${Number(p.price).toFixed(2)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </StorefrontShell>
  );
}
