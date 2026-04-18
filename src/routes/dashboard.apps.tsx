import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { APPS } from "@/lib/apps";

export const Route = createFileRoute("/dashboard/apps")({
  component: AppsPage,
  head: () => ({
    meta: [
      { title: "App Store — Storely" },
      { name: "description", content: "Browse and install apps to power up your store." },
    ],
  }),
});

function AppsPage() {
  const { user } = useAuth();
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("installed_apps")
      .select("app_key")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setInstalled(new Set((data ?? []).map((r) => r.app_key)));
        setLoading(false);
      });
  }, [user]);

  const install = async (appKey: string, appName: string) => {
    if (!user) return;
    setPending(appKey);
    const { error } = await supabase
      .from("installed_apps")
      .insert({ user_id: user.id, app_key: appKey });
    setPending(null);
    if (error) {
      toast.error("Failed to install app");
      return;
    }
    setInstalled((prev) => new Set(prev).add(appKey));
    toast.success(`${appName} installed`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="App Store"
        description="Extend your store with powerful apps. Install with one click."
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {APPS.map((app) => {
            const isInstalled = installed.has(app.key);
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
                    <Badge variant="secondary" className="text-xs">
                      {app.category}
                    </Badge>
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold leading-tight">{app.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {app.description}
                    </p>
                  </div>
                  <Button
                    variant={isInstalled ? "secondary" : "default"}
                    size="sm"
                    disabled={isInstalled || isPending}
                    onClick={() => install(app.key, app.name)}
                    className="w-full"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Installing...
                      </>
                    ) : isInstalled ? (
                      <>
                        <Check className="h-4 w-4" />
                        Installed
                      </>
                    ) : (
                      "Install App"
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
