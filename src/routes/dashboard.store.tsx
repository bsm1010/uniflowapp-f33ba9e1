import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CircleDot,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Package,
  Palette,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ExpiredOverlay } from "@/components/dashboard/ExpiredOverlay";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type StoreSettings = Tables<"store_settings">;

export const Route = createFileRoute("/dashboard/store")({
  component: StorePage,
  head: () => ({ meta: [{ title: "My Store — Storely" }] }),
});

function StorePage() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([
      supabase
        .from("store_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]).then(([s, p]) => {
      if (!active) return;
      setSettings(s.data);
      setProductCount(p.count ?? 0);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const slug = settings?.slug;
  const liveUrl = slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${slug}`
    : "";
  const themePicked =
    settings != null && settings.store_name !== "My Store";

  const checklist: {
    title: string;
    done: boolean;
    to: string;
    external?: boolean;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      title: "Add your first product",
      done: productCount > 0,
      to: "/dashboard/products",
      icon: Package,
    },
    {
      title: "Customize your storefront",
      done: themePicked,
      to: "/customize",
      external: true,
      icon: Palette,
    },
    {
      title: "Share your store URL",
      done: false,
      to: "/customize",
      external: true,
      icon: Globe,
    },
  ];

  const copyUrl = () => {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl);
    toast.success("Store URL copied");
  };

  return (
    <div className="max-w-7xl mx-auto">
      {isExpired && <ExpiredOverlay />}
      <PageHeader
        eyebrow="Storefront"
        title="My Store"
        description="Your storefront at a glance."
        icon={Store}
        gradient="from-sky-500 via-blue-500 to-indigo-500"
        actions={
          slug ? (
            <Button variant="outline" asChild>
              <a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> View live store
              </a>
            </Button>
          ) : null
        }
      />

      <Card className="border-border/60 shadow-soft overflow-hidden">
        <div
          className="h-32 relative"
          style={{
            background: settings?.primary_color
              ? `linear-gradient(135deg, ${settings.primary_color}, ${settings.primary_color}88)`
              : undefined,
          }}
        >
          <div className="absolute inset-0 bg-soft-radial opacity-60" />
        </div>
        <CardContent className="p-6 -mt-10 relative">
          <div className="h-20 w-20 rounded-2xl bg-background border-4 border-background shadow-soft flex items-center justify-center overflow-hidden">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-12 w-12 rounded-xl"
                style={{ backgroundColor: settings?.primary_color }}
              />
            )}
          </div>
          <div className="mt-4 flex items-start justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold font-display truncate">
                {settings?.store_name ?? "Your Store"}
              </h2>
              {slug ? (
                <button
                  onClick={copyUrl}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="font-mono">/s/{slug}</span>
                  <Copy className="h-3 w-3" />
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No store URL set yet
                </p>
              )}
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            >
              <CircleDot className="h-3 w-3 fill-emerald-500 text-emerald-500" />
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h3 className="font-semibold mb-4">Setup checklist</h3>
        <div className="grid gap-3">
          {checklist.map((item) => {
            const card = (
              <Card className="border-border/60 shadow-soft hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                      item.done
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-accent text-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.done ? "Completed" : "Not started"}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {item.done ? "Edit" : "Start"}
                  </Button>
                </CardContent>
              </Card>
            );
            if (item.external) {
              return (
                <a
                  key={item.title}
                  href={item.to}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {card}
                </a>
              );
            }
            return (
              <Link
                key={item.title}
                to={item.to as "/dashboard/products"}
              >
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
