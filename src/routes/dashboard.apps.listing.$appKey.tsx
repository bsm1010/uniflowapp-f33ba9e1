import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Loader2,
  Star,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APPS_BY_KEY, type AppDef } from "@/lib/apps";
import { useInstalledApps } from "@/hooks/use-installed-apps";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/apps/listing/$appKey")({
  component: AppLandingPage,
  loader: ({ params }) => {
    const app = APPS_BY_KEY[params.appKey];
    if (!app) throw notFound();
    return { app };
  },
  notFoundComponent: () => (
    <div className="text-center py-20">
      <p className="text-muted-foreground">App not found.</p>
      <Button asChild className="mt-4">
        <Link to="/dashboard/apps">Back to App Store</Link>
      </Button>
    </div>
  ),
});

// ── Screenshot lightbox carousel ────────────────────────────────────
function Lightbox({
  app,
  index,
  onClose,
  onChange,
}: {
  app: AppDef;
  index: number;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const Icon = app.icon;
  const total = app.screenshots.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white"
      >
        <X className="h-5 w-5" />
      </button>

      <button
        onClick={() => onChange((index - 1 + total) % total)}
        className="absolute left-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div
        className={cn(
          "aspect-[16/10] w-full max-w-5xl rounded-2xl bg-gradient-to-br flex items-center justify-center",
          app.screenshots[index],
        )}
      >
        <div className="text-white/90 text-center">
          <Icon className="h-24 w-24 mx-auto mb-4 drop-shadow-lg" />
          <p className="text-sm font-medium uppercase tracking-wider">
            Screenshot {index + 1} of {total}
          </p>
        </div>
      </div>

      <button
        onClick={() => onChange((index + 1) % total)}
        className="absolute right-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────
function AppLandingPage() {
  const { app } = Route.useLoaderData() as { app: AppDef };
  const { isInstalled, install: installApp } = useInstalledApps();
  const navigate = useNavigate();
  const [installing, setInstalling] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const Icon = app.icon;
  const installed = isInstalled(app.key);
  const freePlan = app.plans.find((p) => p.price === "$0");
  const pricingLabel = freePlan ? "Free to install. Additional charges may apply." : "Paid";

  const handleInstall = async () => {
    if (installed) {
      if (app.route) navigate({ to: app.route });
      return;
    }
    setInstalling(true);
    const { error } = await installApp(app.key);
    setInstalling(false);
    if (error) {
      toast.error("Failed to install app");
      return;
    }
    toast.success(`${app.name} installed successfully! 🎉`);
  };

  // Hero = first screenshot, sidebar = the rest
  const heroIdx = 0;
  const sideShots = app.screenshots.slice(1);

  return (
    <>
      {lightboxIdx !== null && (
        <Lightbox
          app={app}
          index={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onChange={setLightboxIdx}
        />
      )}

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Back */}
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/dashboard/apps">
            <ArrowLeft className="h-4 w-4" />
            Back to App Store
          </Link>
        </Button>

        {/* Top Shopify-style layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT — meta + install */}
          <aside className="lg:col-span-3 space-y-6">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "h-14 w-14 rounded-xl bg-gradient-to-br flex items-center justify-center ring-1 ring-border shrink-0",
                  app.gradient,
                )}
              >
                <Icon className="h-7 w-7 text-foreground" />
              </div>
              <h1 className="text-lg font-bold leading-tight tracking-tight">
                {app.name}
              </h1>
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-4 text-sm">
              <div>
                <div className="font-semibold mb-1">Pricing</div>
                <div className="text-muted-foreground leading-snug">{pricingLabel}</div>
              </div>

              <div>
                <div className="font-semibold mb-1">Rating</div>
                <div className="flex items-center gap-1.5">
                  <span>{app.rating.toFixed(1)}</span>
                  <Star className="h-3.5 w-3.5 fill-foreground text-foreground" />
                  <button
                    className="text-muted-foreground hover:underline ml-1"
                    onClick={() => {
                      document.getElementById("reviews-section")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    ({app.reviewCount.toLocaleString()})
                  </button>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">Developer</div>
                <span className="underline cursor-pointer">{app.developer}</span>
              </div>
            </div>

            <Button
              onClick={handleInstall}
              disabled={installing}
              className="w-full h-12 rounded-full bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
            >
              {installing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Installing...
                </>
              ) : installed ? (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open App
                </>
              ) : (
                "Install"
              )}
            </Button>

            {installed && (
              <Badge className="w-full justify-center bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15 py-1.5">
                <Check className="h-3 w-3 mr-1" />
                Installed
              </Badge>
            )}
          </aside>

          {/* CENTER — hero screenshot */}
          <div className="lg:col-span-6">
            <button
              onClick={() => setLightboxIdx(heroIdx)}
              className={cn(
                "block w-full aspect-[4/3] rounded-2xl bg-gradient-to-br ring-1 ring-border overflow-hidden transition hover:ring-foreground/30",
                app.screenshots[heroIdx],
              )}
            >
              <div className="h-full w-full flex flex-col items-center justify-center text-white/90 p-8">
                <Icon className="h-24 w-24 mb-4 drop-shadow-lg" />
                <p className="text-3xl font-bold text-center leading-tight drop-shadow">
                  {app.name}
                </p>
                <p className="text-sm font-medium uppercase tracking-wider mt-3 opacity-80">
                  {app.category}
                </p>
              </div>
            </button>
          </div>

          {/* RIGHT — screenshot thumbnails column */}
          <div className="lg:col-span-3 grid grid-cols-3 lg:grid-cols-1 gap-3">
            {sideShots.map((shot, i) => {
              const realIdx = i + 1;
              return (
                <button
                  key={realIdx}
                  onClick={() => setLightboxIdx(realIdx)}
                  className={cn(
                    "block w-full aspect-[4/3] rounded-xl bg-gradient-to-br ring-1 ring-border overflow-hidden transition hover:ring-foreground/30 group",
                    shot,
                  )}
                >
                  <div className="h-full w-full flex items-center justify-center">
                    <Icon className="h-8 w-8 text-white/90 drop-shadow group-hover:scale-110 transition" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Long description below */}
        <div className="max-w-3xl space-y-5 pt-6">
          <h2 className="text-xl font-bold leading-snug">
            {app.description}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {app.longDescription ?? app.description}
          </p>

          {/* Key features */}
          <div className="pt-4 space-y-3">
            <h3 className="text-lg font-bold">What you get</h3>
            <ul className="space-y-2.5">
              {app.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div id="pricing" className="pt-8 space-y-4">
            <h3 className="text-lg font-bold">Pricing</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {app.plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "p-5 rounded-2xl border bg-card relative",
                    plan.highlighted && "border-foreground ring-2 ring-foreground/10",
                  )}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-2 right-4 bg-foreground text-background hover:bg-foreground">
                      Most popular
                    </Badge>
                  )}
                  <h4 className="font-semibold">{plan.name}</h4>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews placeholder anchor */}
          <div id="reviews-section" className="pt-8 space-y-4">
            <h3 className="text-lg font-bold">Reviews</h3>
            <div className="flex items-center gap-4 p-5 rounded-2xl border bg-card">
              <div className="text-center">
                <div className="text-4xl font-bold">{app.rating.toFixed(1)}</div>
                <div className="flex items-center gap-0.5 mt-1 justify-center">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.round(app.rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30",
                      )}
                    />
                  ))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {app.reviewCount.toLocaleString()} reviews
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Reviews from real users help others discover great apps. Sign in and install to leave your own.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
