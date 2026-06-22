import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, Search, Star, Store, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AppRow = {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  category: string;
  icon_url: string | null;
  screenshots: string[];
  price: number;
  is_free: boolean;
  developer_id: string;
  created_at: string;
};

const CATEGORIES = [
  "All",
  "Marketing",
  "Sales",
  "Analytics",
  "AI",
  "Productivity",
  "Design",
  "Other",
];

export function MarketplaceComponent() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("apps")
        .select(
          "id,title,slug,short_description,category,icon_url,screenshots,price,is_free,developer_id,created_at",
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      setApps((data as AppRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return apps.filter((a) => {
      const matchesCat = cat === "All" || a.category === cat;
      const matchesQ =
        !q || a.title.toLowerCase().includes(q) || a.short_description.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [apps, query, cat]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Store className="h-3.5 w-3.5" />
            Community Marketplace
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Apps by developers</h1>
          <p className="text-muted-foreground">Install community-built apps or publish your own.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/apps/submit">
            <Plus className="h-4 w-4 mr-1" />
            Submit an app
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplace..."
            className="pl-9 h-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                cat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No community apps yet. Be the first to{" "}
          <Link to="/dashboard/apps/submit" className="text-primary underline">
            submit one
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app) => (
            <Link
              key={app.id}
              to="/dashboard/apps/m/$appId"
              params={{ appId: app.id }}
              className="group block"
            >
              <Card className="relative h-full p-5 transition-colors hover:border-foreground/30">
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted border border-border flex items-center justify-center overflow-hidden">
                      {app.icon_url ? (
                        <img
                          src={app.icon_url}
                          alt={app.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Store className="h-6 w-6 text-foreground" />
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {app.category}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold leading-tight text-base">{app.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {app.short_description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-muted-foreground">New</span>
                    </div>
                    <span className="font-semibold text-sm">
                      {app.is_free ? "Free" : `$${Number(app.price).toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
