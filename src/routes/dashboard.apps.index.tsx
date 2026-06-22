import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useMemo, useState } from "react";
import { Check, Code2, Loader2, Search, Star, LayoutGrid, Zap, Store } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      { title: "Apps & Integrations — Fennecly" },
      { name: "description", content: "Extend your store with powerful apps." },
    ],
  }),
});

function AppsPage() {
  const { isInstalled, install: installApp, loading } = useInstalledApps();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [modalApp, setModalApp] = useState<AppDef | null>(null);
  const [installing, setInstalling] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APPS.filter((a) => {
      const matchesCat = activeCategory === "All" || a.category === activeCategory;
      const matchesQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [query, activeCategory]);

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
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <LayoutGrid className="h-3.5 w-3.5" />
            Apps & Integrations
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Apps</h1>
          <p className="text-muted-foreground">Extend your store, browse the marketplace, or build your own.</p>
        </div>

        <Tabs defaultValue="store" className="space-y-4">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="store" className="gap-1.5">
              <LayoutGrid className="h-4 w-4" /> App Store
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="gap-1.5">
              <Store className="h-4 w-4" /> Marketplace
            </TabsTrigger>
            <TabsTrigger value="developer" className="gap-1.5">
              <Code2 className="h-4 w-4" /> Developer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="store">
            {/* Search + Categories */}
            <div className="space-y-3 mb-6">
              <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search apps..."
                  className="pl-9 h-10"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {APP_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors",
                      activeCategory === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
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
                  return (
                    <Link
                      key={app.key}
                      to="/dashboard/apps/listing/$appKey"
                      params={{ appKey: app.key }}
                      className="group block"
                    >
                      <Card className="relative h-full p-5 transition-colors hover:border-foreground/30">
                        <div className="flex flex-col h-full gap-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border">
                              <Icon className="h-6 w-6 text-foreground" />
                            </div>
                            <div className="flex flex-col items-end gap-1.5">
                              {installed && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Check className="h-3 w-3" />
                                  Installed
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {app.category}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold leading-tight text-base">{app.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {app.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{app.rating.toFixed(1)}</span>
                            <span className="text-muted-foreground">
                              ({app.reviewCount.toLocaleString()})
                            </span>
                          </div>
                          {installed ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => handleOpen(e, app)}
                              className="w-full"
                            >
                              Open
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => handleInstallClick(e, app)}
                              className="w-full"
                            >
                              <Zap className="h-4 w-4 mr-1" />
                              Install
                            </Button>
                          )}
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketplace">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[300px]">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <MarketplaceTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="developer">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[300px]">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              }
            >
              <DeveloperTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
