import { Link } from "@tanstack/react-router";
import { Lock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstalledApps } from "@/hooks/use-installed-apps";
import { APPS_BY_KEY } from "@/lib/apps";

/**
 * Gate an app route behind installation. If the app is not installed for the
 * current user, render a friendly prompt with a one-click install action.
 */
export function RequireApp({
  appKey,
  children,
}: {
  appKey: string;
  children: React.ReactNode;
}) {
  const { isInstalled, install, loading } = useInstalledApps();
  const app = APPS_BY_KEY[appKey];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (isInstalled(appKey)) return <>{children}</>;

  const Icon = app?.icon ?? Lock;

  return (
    <div className="max-w-xl mx-auto py-16">
      <Card className="border-dashed border-border/60">
        <CardContent className="p-10 flex flex-col items-center text-center">
          <div
            className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${
              app?.gradient ?? "from-muted to-muted"
            } flex items-center justify-center ring-1 ring-border`}
          >
            <Icon className="h-7 w-7 text-foreground" />
          </div>
          <h1 className="mt-4 text-xl font-display font-bold">
            Install {app?.name ?? "this app"} to use it
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {app?.description ??
              "This app isn't installed on your store yet."}
          </p>
          <div className="mt-6 flex items-center gap-2">
            <Button
              onClick={async () => {
                const { error } = await install(appKey);
                if (error) toast.error("Failed to install");
                else toast.success(`${app?.name ?? "App"} installed`);
              }}
            >
              <Plus className="h-4 w-4" />
              Install app
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/apps">Browse App Store</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
