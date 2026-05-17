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
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { APPS_BY_KEY, type AppDef } from "@/lib/apps";
import { useInstalledApps } from "@/hooks/use-installed-apps";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/apps/$appKey")({
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

// Mock reviews for the Reviews tab
const mockReviews = [
  {
    name: "Sarah K.",
    rating: 5,
    date: "2 days ago",
    text: "Absolute game-changer. Setup took under a minute and the results were immediate.",
  },
  {
    name: "Ahmed B.",
    rating: 5,
    date: "1 week ago",
    text: "Worth every penny. Customer support is also incredibly responsive.",
  },
  {
    name: "Maria L.",
    rating: 4,
    date: "3 weeks ago",
    text: "Great app overall, would love to see more customization options in the future.",
  },
];

function AppLandingPage() {
  const { app } = Route.useLoaderData() as { app: AppDef };
  const { isInstalled, install: installApp } = useInstalledApps();
  const navigate = useNavigate();
  const [installing, setInstalling] = useState(false);
  const [screenshotIdx, setScreenshotIdx] = useState(0);

  const Icon = app.icon;
  const installed = isInstalled(app.key);

  const handleInstall = async () => {
    setInstalling(true);
    const { error } = await installApp(app.key);
    setInstalling(false);
    if (error) {
      toast.error("Failed to install app");
      return;
    }
    toast.success(`${app.name} installed`);
  };

  const handleOpen = () => {
    if (app.route) {
      navigate({ to: app.route });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link to="/dashboard/apps">
          <ArrowLeft className="h-4 w-4" />
          Back to App Store
        </Link>
      </Button>

      {/* Header */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <div
            className={cn(
              "h-24 w-24 rounded-3xl bg-gradient-to-br flex items-center justify-center ring-1 ring-border shadow-lg shrink-0",
              app.gradient,
            )}
          >
            <Icon className="h-12 w-12 text-foreground" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{app.category}</Badge>
              {installed && (
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15">
                  <Check className="h-3 w-3" />
                  Installed
                </Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{app.name}</h1>
            <p className="text-sm text-muted-foreground">by {app.developer}</p>
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{app.rating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({app.reviewCount.toLocaleString()} reviews)
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            {installed ? (
              <Button
                onClick={handleOpen}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white min-w-[140px]"
              >
                <ExternalLink className="h-4 w-4" />
                Open App
              </Button>
            ) : (
              <Button
                onClick={handleInstall}
                disabled={installing}
                className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white min-w-[140px]"
              >
                {installing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Installing...
                  </>
                ) : (
                  "Install"
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Screenshot carousel */}
      <Card className="p-4 sm:p-6">
        <div className="relative">
          <div
            className={cn(
              "aspect-[16/9] rounded-2xl bg-gradient-to-br flex items-center justify-center overflow-hidden transition-all duration-500",
              app.screenshots[screenshotIdx],
            )}
          >
            <div className="text-white/90 text-center">
              <Icon className="h-20 w-20 mx-auto mb-3 drop-shadow-lg" />
              <p className="text-sm font-medium uppercase tracking-wider">
                Screenshot {screenshotIdx + 1}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setScreenshotIdx(
                (screenshotIdx - 1 + app.screenshots.length) % app.screenshots.length,
              )
            }
            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="h-5 w-5 text-gray-900" />
          </button>
          <button
            onClick={() => setScreenshotIdx((screenshotIdx + 1) % app.screenshots.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition"
            aria-label="Next screenshot"
          >
            <ChevronRight className="h-5 w-5 text-gray-900" />
          </button>
        </div>
        <div className="flex justify-center gap-2 mt-4">
          {app.screenshots.map((_, i) => (
            <button
              key={i}
              onClick={() => setScreenshotIdx(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === screenshotIdx ? "w-8 bg-[#7C3AED]" : "w-2 bg-muted-foreground/30",
              )}
              aria-label={`Go to screenshot ${i + 1}`}
            />
          ))}
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="changelog">Changelog</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">About this app</h2>
            <p className="text-muted-foreground leading-relaxed">
              {app.longDescription ?? app.description}
            </p>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-lg font-semibold">Key features</h2>
            <ul className="space-y-3">
              {app.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-[#7C3AED]/15 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-[#7C3AED]" strokeWidth={3} />
                  </div>
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Pricing */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {app.plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={cn(
                    "p-6 relative",
                    plan.highlighted &&
                      "border-[#7C3AED] ring-2 ring-[#7C3AED]/20 shadow-lg",
                  )}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-2 right-4 bg-[#7C3AED] text-white hover:bg-[#7C3AED]">
                      Most popular
                    </Badge>
                  )}
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.period && (
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    )}
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-[#7C3AED] mt-0.5 shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      "w-full mt-6",
                      plan.highlighted
                        ? "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                        : "",
                    )}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    Choose {plan.name}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4 mt-6">
          <Card className="p-6">
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="text-center">
                <div className="text-4xl font-bold">{app.rating.toFixed(1)}</div>
                <div className="flex items-center gap-0.5 mt-1">
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
            </div>
            <div className="space-y-5 pt-5">
              {mockReviews.map((r) => (
                <div key={r.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{r.name}</span>
                    <span className="text-xs text-muted-foreground">{r.date}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3.5 w-3.5",
                          i < r.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="changelog" className="space-y-4 mt-6">
          <Card className="p-6 space-y-6">
            {app.changelog.map((entry) => (
              <div key={entry.version} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    v{entry.version}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{entry.date}</span>
                </div>
                <ul className="space-y-1 ml-4">
                  {entry.notes.map((note) => (
                    <li key={note} className="text-sm text-muted-foreground list-disc">
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
