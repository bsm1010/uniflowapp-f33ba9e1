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
      className="mt-10"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
            <Blocks className="h-5 w-5 text-muted-foreground" />
            Your Apps
          </h2>

          <p className="mt-0.5 text-sm text-muted-foreground">
            Apps installed on your store.
          </p>
        </div>

        <Button size="sm" asChild>
          <Link to="/dashboard/apps">
            <Plus className="mr-1.5 h-4 w-4" />
            Browse Apps
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="h-12 w-12 animate-pulse rounded-xl bg-muted" />
                <div className="mt-4 h-4 w-36 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : installed.length === 0 ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
              <Blocks className="h-6 w-6 text-muted-foreground" />
            </div>

            <p className="mt-4 font-semibold text-foreground">
              No apps installed yet
            </p>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Visit the App Store to discover apps that supercharge your store.
            </p>

            <Button size="sm" asChild className="mt-5">
              <Link to="/dashboard/apps">
                <Plus className="mr-1.5 h-4 w-4" />
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
                className="border-border/50 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${app.gradient} shadow-sm`}
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>

                    <Badge variant="outline" className="text-[11px] capitalize">
                      {app.category}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-1">
                    <h3 className="font-semibold text-foreground">
                      {app.name}
                    </h3>

                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {app.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" className="flex-1" asChild>
                      <Link
                        to="/dashboard/apps/listing/$appKey"
                        params={{ appKey: app.key }}
                      >
                        <ExternalLink className="mr-1.5 h-4 w-4" />
                        Open
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRemoving(app)}
                      aria-label={`Remove ${app.name}`}
                      className="shrink-0"
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
        <AlertDialogContent className="border border-border bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removing?.name}?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-muted-foreground">
              This will uninstall the app from your dashboard. You can reinstall
              it anytime from the App Store.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-border bg-muted/50 text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.section>
  );
}
