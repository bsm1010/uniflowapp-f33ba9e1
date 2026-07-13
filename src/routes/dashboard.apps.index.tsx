import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import {
  Check,
  Code2,
  ChevronRight,
  Loader2,
  Search,
  Star,
  LayoutGrid,
  Store,
  Crown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { APPS, APP_CATEGORIES, type AppDef } from "@/lib/apps";
import { useInstalledApps } from "@/hooks/use-installed-apps";
import { cn } from "@/lib/utils";

const InstallModal = lazy(() =>
  import("@/components/dashboard/AppInstallModal").then((m) => ({ default: m.AppInstallModal })),
);
const MarketplaceTab = lazy(() =>
  import("./-dashboard.apps.marketplace").then((m) => ({ default: m.MarketplaceComponent }))
);
const DeveloperTab = lazy(() =>
  import("./-dashboard.developer").then((m) => ({ default: m.DeveloperComponent }))
);

export const Route = createFileRoute("/dashboard/apps/")({
  component: AppsPage,
  head: () => ({
    meta: [
      { title: "App Store — Fennecly" },
      { name: "description", content: "Extend your store with powerful apps and integrations." },
    ],
  }),
});

const CATEGORY_COLORS: Record<string, string> = {
  Marketing: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  AI: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Sales: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Growth: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Analytics: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Algeria: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

type SortOption = "popular" | "rating" | "name";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "popular", label: "Popular" },
  { value: "rating", label: "Top Rated" },
  { value: "name", label: "Name" },
];

function AppsPage() {
  const { isInstalled, loading } = useInstalledApps();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [modalApp, setModalApp] = useState<AppDef | null>(null);
  const [installing, setInstalling] = useState(false);
  const navigate = useNavigate();
  const { install: installApp } = useInstalledApps();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = APPS.filter((a) => {
      const matchesCat = activeCategory === "All" || a.category === activeCategory;
      const matchesQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
    if (sortBy === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
    else if (sortBy === "name") result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    else result = [...result].sort((a, b) => b.reviewCount - a.reviewCount);
    return result;
  }, [query, activeCategory, sortBy]);

  const handleInstallClick = (e: React.MouseEvent, app: AppDef) => {
    e.preventDefault();
    e.stopPropagation();
    setModalApp(app);
  };

  const handleInstallConfirm = async () => {
    if (!modalApp) return;
    setInstalling(true);
    const { error } = await installApp(modalApp.key);
    setInstalling(false);
    if (error) {
      toast.error("Failed to install app");
      return;
    }
    toast.success(`${modalApp.name} installed`);
    setModalApp(null);
  };

  const handleOpen = (e: React.MouseEvent, app: AppDef) => {
    e.preventDefault();
    e.stopPropagation();
    if (app.route) navigate({ to: app.route });
  };

  return (
    <>
      {modalApp && (
        <Suspense fallback={null}>
          <InstallModal
            app={modalApp}
            onClose={() => setModalApp(null)}
            onConfirm={handleInstallConfirm}
            installing={installing}
          />
        </Suspense>
      )}

      <div className="space-y-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-8 sm:p-10 text-white">
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px, 50px 50px",
            }}
          />
          <div
            aria-hidden
            className="absolute -top-16 -right-16 size-64 rounded-full bg-white/10 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-10 size-60 rounded-full bg-amber-300/20 blur-3xl"
          />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                <LayoutGrid className="h-3.5 w-3.5" />
                APPS & INTEGRATIONS
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">App Store</h1>
              <p className="text-white/80 max-w-lg">
                Extend your store with powerful apps and integrations. Find the perfect tools to grow
                your business.
              </p>
            </div>
            {/* Decorative icons */}
            <div className="hidden sm:flex items-center gap-3 opacity-60">
              <div className="size-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center rotate-[-8deg]">
                <Sparkles className="size-6" />
              </div>
              <div className="size-14 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center rotate-[5deg]">
                <Store className="size-7" />
              </div>
              <div className="size-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center rotate-[12deg]">
                <Crown className="size-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/dashboard/apps"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-primary text-primary-foreground shadow-sm"
          >
            <LayoutGrid className="h-4 w-4" /> App Store
          </Link>
          <Link
            to="/dashboard/apps"
            search={{ tab: "marketplace" } as never}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-border hover:bg-muted transition-colors"
          >
            <Store className="h-4 w-4" /> Marketplace
          </Link>
          <Link
            to="/dashboard/apps"
            search={{ tab: "developer" } as never}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border border-border hover:bg-muted transition-colors"
          >
            <Code2 className="h-4 w-4" /> Developer
          </Link>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              className="pl-9 h-11 rounded-xl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="h-11 px-4 rounded-xl border border-border bg-background text-sm font-medium cursor-pointer"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                Sort by: {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap items-center gap-2">
          {APP_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-foreground hover:bg-muted",
              )}
            >
              {cat}
            </button>
          ))}
          <button className="ml-auto text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
            View All Categories <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* App Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No apps match your search.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((app) => {
              const installed = isInstalled(app.key);
              const Icon = app.icon;
              const catColor = CATEGORY_COLORS[app.category] ?? "bg-muted text-muted-foreground";
              return (
                <Link
                  key={app.key}
                  to="/dashboard/apps/listing/$appKey"
                  params={{ appKey: app.key }}
                  className="group block"
                >
                  <div className="relative h-full p-5 rounded-xl border border-border/60 bg-card hover:border-foreground/20 hover:shadow-md transition-all">
                    <div className="flex flex-col h-full gap-3">
                      {/* Top row: icon + badges */}
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br overflow-hidden",
                            app.gradient,
                            "text-white shadow-sm",
                          )}
                        >
                          {app.icon_url ? (
                            <img src={app.icon_url} alt={app.name} className="h-full w-full object-cover" />
                          ) : (
                            <Icon className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {installed && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <Check className="h-3.5 w-3.5" />
                              Installed
                            </span>
                          )}
                          <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", catColor)}>
                            {app.category}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold leading-tight">{app.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {app.description}
                        </p>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-1.5 text-sm">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{app.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({app.reviewCount.toLocaleString()})
                        </span>
                      </div>

                      {/* Action */}
                      {installed ? (
                        <button
                          onClick={(e) => handleOpen(e, app)}
                          className="w-full flex items-center justify-between py-2.5 px-4 rounded-lg border border-border/60 text-sm font-medium hover:bg-muted/50 transition-colors"
                        >
                          Open <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleInstallClick(e, app)}
                          className="w-full flex items-center justify-between py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          Install <ChevronRight className="h-4 w-4 opacity-70" />
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Premium Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-pink-50 dark:from-violet-950/30 dark:via-fuchsia-950/30 dark:to-pink-950/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Looking for premium solutions?</h3>
              <p className="text-sm text-muted-foreground">
                Discover premium apps and advanced integrations to take your store to the next level.
              </p>
            </div>
          </div>
          <Button
            className="shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white border-0 shadow-md"
            size="lg"
          >
            Browse Premium Apps <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </>
  );
}
