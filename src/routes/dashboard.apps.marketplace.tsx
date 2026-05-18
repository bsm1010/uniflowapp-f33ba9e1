import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Star, Store, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/apps/marketplace")({
  component: MarketplacePage,
  head: () => ({
    meta: [
      { title: "Community Marketplace — Fennecly" },
      { name: "description", content: "Discover apps built by the community." },
    ],
  }),
});

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

function MarketplacePage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All");

  useEffect(() => {
    supabase
      .from("apps")
      .select("id,title,slug,short_description,category,icon_url,screenshots,price,is_free,developer_id,created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setApps((data as AppRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return apps.filter((a) => {
      const matchesCat = cat === "All" || a.category === cat;
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.short_description.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [apps, query, cat]);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] p-8 sm:p-12 text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Store className="h-3.5 w-3.5" />
              Community Marketplace
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
              Apps by developers
            </h1>
            <p className="mt-3 text-lg text-white/90">
              Install community-built apps or publish your own.
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-[#7C3AED] hover:bg-white/90">
            <Link to="/dashboard/apps/submit">
              <Plus className="h-4 w-4 mr-1" />
              Submit an app
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search marketplace..."
            className="pl-9 h-11"
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
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                cat === c
                  ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          No community apps yet. Be the first to{" "}
          <Link to="/dashboard/apps/submit" className="text-primary underline">
            submit one
          </Link>
          .
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((app) => (
            <Link
              key={app.id}
              to="/dashboard/apps/m/$appId"
              params={{ appId: app.id }}
              className="group block"
            >
              <Card className="relative h-full overflow-hidden p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#7C3AED]/40">
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center ring-1 ring-border overflow-hidden">
                      {app.icon_url ? (
                        <img src={app.icon_url} alt={app.title} className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-7 w-7 text-[#7C3AED]" />
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">{app.category}</Badge>
                  </div>
                  <div className="flex-1 space-y-1.5">
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
