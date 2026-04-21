import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Blocks, ExternalLink, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { APPS_BY_KEY, type AppDef } from "@/lib/apps";
import { useInstalledApps } from "@/hooks/use-installed-apps";

export function InstalledAppsSection() {
  const { installed: installedKeys, uninstall, loading } = useInstalledApps();
  const [removing, setRemoving] = useState<AppDef | null>(null);

  const installed = useMemo(
    () =>
      Array.from(installedKeys)
        .map((k) => APPS_BY_KEY[k])
        .filter(Boolean),
    [installedKeys],
  );

  const confirmRemove = async () => {
    if (!removing) return;
    const app = removing;
    setRemoving(null);
    const { error } = await uninstall(app.key);
    if (error) {
      toast.error("Failed to remove app");
      return;
    }
    toast.success(`${app.name} removed`);
  };


  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="mt-8"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Blocks className="h-5 w-5 text-primary" />
            Your apps
          </h2>
          <p className="text-sm text-muted-foreground">
            Apps installed on your store.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard/apps">
            <Plus className="h-4 w-4" />
            Browse apps
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-border/60 shadow-soft">
              <CardContent className="p-5">
                <div className="h-12 w-12 rounded-xl bg-muted animate-pulse" />
                <div className="mt-4 h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="mt-2 h-3 w-full bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : installed.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="p-10 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
              <Blocks className="h-6 w-6 text-accent-foreground" />
            </div>
            <p className="mt-4 font-medium">No apps installed yet</p>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Visit the App Store to discover apps that supercharge your store.
            </p>
            <Button size="sm" className="mt-4" asChild>
              <Link to="/dashboard/apps">
                <Plus className="h-4 w-4" />
                Browse App Store
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {installed.map((app) => {
            const Icon = app.icon;
            return (
              <Card
                key={app.key}
                className="group relative overflow-hidden border-border/60 shadow-soft transition-all duration-300 hover:shadow-glow/20 hover:-translate-y-0.5"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
                />
                <CardContent className="relative p-5 flex flex-col h-full gap-4">
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
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1"
                      asChild
                    >
                      <Link to="/dashboard/apps/$appKey" params={{ appKey: app.key }}>
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRemoving(app)}
                      aria-label={`Remove ${app.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will uninstall the app from your dashboard. You can reinstall
              it anytime from the App Store.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.section>
  );
}
