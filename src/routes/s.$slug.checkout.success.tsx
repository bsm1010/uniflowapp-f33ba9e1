import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  StorefrontShell,
  getStoreTokens,
} from "@/components/storefront/StorefrontShell";

type StoreSettings = Tables<"store_settings">;

const searchSchema = z.object({
  order: z.string().optional(),
});

export const Route = createFileRoute("/s/$slug/checkout/success")({
  component: SuccessPage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Order placed — Storely" }] }),
});

function SuccessPage() {
  const { slug } = Route.useParams();
  const { order } = Route.useSearch();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

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
        <p>Store not found.</p>
      </div>
    );
  }

  const t = getStoreTokens(settings);
  const radius =
    settings.theme === "minimal" ? 0 : settings.theme === "grid" ? 8 : 16;

  return (
    <StorefrontShell settings={settings}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div
          className="inline-flex items-center justify-center h-16 w-16 rounded-full"
          style={{ backgroundColor: t.primary + "1f", color: t.primary }}
        >
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight">
          Thank you for your order!
        </h1>
        <p className="mt-3 text-sm" style={{ color: t.muted }}>
          We've received your order and sent a confirmation to your email. The
          shop will be in touch shortly to arrange shipping.
        </p>
        {order && (
          <div
            className="mt-6 inline-block px-4 py-2 text-xs font-mono"
            style={{
              backgroundColor: t.surface,
              border: `1px solid ${t.border}`,
              borderRadius: radius / 2,
              color: t.muted,
            }}
          >
            Order #{order.slice(0, 8).toUpperCase()}
          </div>
        )}
        <div className="mt-8">
          <Link
            to="/s/$slug"
            params={{ slug }}
            className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: t.primary,
              color: t.onPrimary,
              borderRadius: radius / 2,
            }}
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </StorefrontShell>
  );
}
