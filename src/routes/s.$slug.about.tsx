import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontShell } from "@/components/storefront/StorefrontShell";
import { getStoreTokens, type StoreSettings } from "@/lib/storeTheme";

export const Route = createFileRoute("/s/$slug/about")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error || !data) throw notFound();
    return { settings: data as StoreSettings };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.settings.about_title} — ${loaderData.settings.store_name}`
          : "About",
      },
      {
        name: "description",
        content: loaderData?.settings.about_content?.slice(0, 155) ?? "",
      },
    ],
  }),
  component: AboutPage,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center text-center p-8">
      <div>
        <h1 className="text-2xl font-semibold mb-2">Store not found</h1>
        <p className="text-muted-foreground">This store does not exist.</p>
      </div>
    </div>
  ),
});

function AboutPage() {
  const { settings } = Route.useLoaderData();
  const t = getStoreTokens(settings);

  const title = settings.about_title || "About us";
  const content =
    settings.about_content ||
    "Welcome to our store. We are passionate about offering quality products and a delightful shopping experience.";

  return (
    <StorefrontShell settings={settings}>
      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <div className="space-y-3 mb-10">
          <div
            className="text-xs uppercase tracking-[0.2em] font-medium"
            style={{ color: t.muted }}
          >
            {settings.store_name}
          </div>
          <h1
            className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight"
            style={{ fontFamily: t.fontHeading, color: t.fg }}
          >
            {title}
          </h1>
        </div>

        {settings.about_image_url && (
          <img
            src={settings.about_image_url}
            alt={title}
            className="w-full object-cover mb-10"
            style={{
              borderRadius: t.radius.lg,
              maxHeight: 480,
              border: `1px solid ${t.border}`,
            }}
          />
        )}

        <div
          className="prose prose-lg max-w-none space-y-5 text-base md:text-lg leading-relaxed"
          style={{ color: t.fg }}
        >
          {content.split(/\n\s*\n/).map((para, i) => (
            <p key={i} style={{ opacity: 0.92 }}>
              {para}
            </p>
          ))}
        </div>

        <div
          className="mt-12 pt-8 flex flex-wrap items-center gap-4"
          style={{ borderTop: `1px solid ${t.border}` }}
        >
          <Link
            to="/s/$slug"
            params={{ slug: settings.slug }}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: t.primary,
              color: t.onPrimary,
              borderRadius: t.buttonRadius,
            }}
          >
            Continue shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </StorefrontShell>
  );
}
