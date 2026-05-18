import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Check,
  Loader2,
  Search,
  Star,
  LayoutGrid,
  X,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { APPS, APP_CATEGORIES, type AppDef } from "@/lib/apps";
import { useInstalledApps } from "@/hooks/use-installed-apps";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/apps/")({
  component: AppsPage,
  head: () => ({
    meta: [
      { title: "App Marketplace — Fennecly" },
      { name: "description", content: "Extend your store with powerful apps." },
    ],
  }),
});

// ── Installation Modal ──────────────────────────────────────────────
function InstallModal({
  app,
  onClose,
  onConfirm,
  installing,
}: {
  app: AppDef;
  onClose: () => void;
  onConfirm: () => void;
  installing: boolean;
}) {
  const Icon = app.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero gradient header */}
        <div
          className={cn(
            "bg-gradient-to-br p-8 flex flex-col items-center text-center",
            app.gradient.replace("/20", ""),
          )}
        >
          <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4 shadow-lg ring-1 ring-white/30">
            <Icon className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">{app.name}</h2>
          <p className="text-white/80 text-sm mt-1">by {app.developer}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
            <span className="text-white font-medium text-sm">
              {app.rating.toFixed(1)}
            </span>
            <span className="text-white/70 text-sm">
              ({app.reviewCount.toLocaleString()} reviews)
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed text-center">
            {app.longDescription ?? app.description}
          </p>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "Instant setup" },
              { icon: Shield, label: "Secure & safe" },
              { icon: Clock, label: "Free to start" },
            ].map(({ icon: TrustIcon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1.5 bg-muted/50 rounded-xl p-3"
              >
                <TrustIcon className="h-5 w-5 text-[#7C3AED]" />
                <span className="text-xs font-medium text-center leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Top features */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              What you get
            </p>
            <ul className="space-y-2">
              {app.features.slice(0, 4).map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm">
                  <div className="h-5 w-5 rounded-full bg-[#7C3AED]/15 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-[#7C3AED]" strokeWidth={3} />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={onConfirm}
              disabled={installing}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-12 text-base font-semibold rounded-xl"
            >
              {installing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Installing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Install Now — It's Free
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="w-full text-muted-foreground"
            >
              Maybe later
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            By installing you agree to Fennecly's{" "}
            <span className="underline cursor-pointer">Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
function AppsPage() {
  const { isInstalled, install: installApp, loading } = useInstalledApps();
  const [pending, setPending] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [modalApp, setModalApp] = useState<AppDef | null>(null);
  const [installing, setInstalling] = useState(false);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return APPS.filter((a) => {
      const matchesCat =
        activeCategory === "All" || a.category === activeCategory;
      const q = query.trim().toLowerCase();
      const matchesQ =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [query, activeCategory]);

  const handleInstallClick = (
    e: React.MouseEvent,
    app: AppDef,
  ) => {
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
    toast.success(`${modalApp.name} installed successfully! 🎉`);
    setModalApp(null);
  };

  const handleOpen = (e: React.MouseEvent, app: AppDef) => {
    e.preventDefault();
    e.stopPropagation();
    if (app.route) navigate({ to: app.route });
  };

  return (
    <>
      {/* Install Modal */}
      {modalApp && (
        <InstallModal
          app={modalApp}
          onClose={() => setModalApp(null)}
          onConfirm={handleInstallConfirm}
          installing={installing}
        />
      )}

      <div className="space-y-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#A855F7] p-8 sm:p-12 text-white">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <LayoutGrid className="h-3.5 w-3.5" />
              Marketplace
            </div>
            <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
              App Marketplace
            </h1>
            <p className="mt-3 text-lg text-white/90">
              Extend your store with powerful apps.
            </p>
          </div>
        </div>

        {/* Search + Tabs */}
        <div className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apps..."
              className="pl-9 h-11"
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
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  activeCategory === cat
                    ? "bg-[#7C3AED] text-white shadow-md shadow-purple-500/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
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
          <div className="text-center py-20 text-muted-foreground">
            No apps match your search.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((app) => {
              const installed = isInstalled(app.key);
              const isPending = pending === app.key;
              const Icon = app.icon;
              return (
                <Link
                  key={app.key}
                  to="/dashboard/apps/listing/$appKey"
                  params={{ appKey: app.key }}
                  className="group block"
                >
                  <Card className="relative h-full overflow-hidden p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-[#7C3AED]/40">
                    <div className="flex flex-col h-full gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div
                          className={cn(
                            "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center ring-1 ring-border shadow-sm",
                            app.gradient,
                          )}
                        >
                          <Icon className="h-7 w-7 text-foreground" />
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          {installed && (
                            <Badge className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15">
                              <Check className="h-3 w-3" />
                              Installed
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {app.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <h3 className="font-semibold leading-tight text-base">
                          {app.name}
                        </h3>
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
                          onClick={(e) => handleOpen(e, app)}
                          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                        >
                          Open App
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={(e) => handleInstallClick(e, app)}
                          className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Installing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-1" />
                              Install
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
