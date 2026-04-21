import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, ExternalLink, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { APPS } from "@/lib/apps";
import { useInstalledApps } from "@/hooks/use-installed-apps";

export const Route = createFileRoute("/dashboard/apps/")({
  component: AppsPage,
  head: () => ({
    meta: [
      { title: "App Store — Storely" },
      {
        name: "description",
        content: "Browse and install apps to power up your store.",
      },
    ],
  }),
});

function AppsPage() {
  const { isInstalled, install: installApp, loading } = useInstalledApps();
  const [pending, setPending] = useState<string | null>(null);

  const install = async (appKey: string, appName: string) => {
    setPending(appKey);
    const { error } = await installApp(appKey);
    setPending(null);
    if (error) {
      toast.error("Failed to install app");
      return;
    }
    toast.success(`${appName} installed`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Marketplace"
        title="App Store"
        description="Extend your store with powerful apps. Install with one click."
        icon={LayoutGrid}
        gradient="from-fuchsia-500 via-pink-500 to-rose-500"
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPS.map((app) => {
            const installed = isInstalled(app.key);
            const isPending = pending === app.key;
            const Icon = app.icon;
            return (
              <Card
                key={app.key}
                className="group relative overflow-hidden p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/40"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
                />
                <div className="relative flex flex-col h-full gap-4">
                  <div className="flex items-start justify-between">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${app.gradient} flex items-center justify-center ring-1 ring-border`}
                    >
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {installed && (
                        <Badge className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/15 animate-in fade-in zoom-in-95 duration-300">
                          <Check className="h-3 w-3" />
                          Installed
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {app.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold leading-tight">{app.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                  {installed ? (
                    <Button
                      size="sm"
                      asChild
                      className="w-full transition-all duration-300 animate-in fade-in"
                    >
                      <Link to="/dashboard/apps/$appKey" params={{ appKey: app.key }}>
                        <ExternalLink className="h-4 w-4" />
                        Open App
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => install(app.key, app.name)}
                      className="w-full transition-all duration-300"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Installing...
                        </>
                      ) : (
                        "Install App"
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
