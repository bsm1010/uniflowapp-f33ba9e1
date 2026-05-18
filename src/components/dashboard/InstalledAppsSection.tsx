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
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-white">
            <Blocks className="h-6 w-6 text-purple-400" />
            Your Apps
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Apps installed on your store.
          </p>
        </div>

        <Button
          size="sm"
          asChild
          className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/40"
        >
          <Link to="/dashboard/apps">
            <Plus className="mr-2 h-4 w-4" />
            Browse Apps
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card
              key={i}
              className="rounded-3xl border border-white/10 bg-[#111117]/80 backdrop-blur-xl"
            >
              <CardContent className="p-6">
                <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/10" />

                <div className="mt-5 h-5 w-40 animate-pulse rounded bg-white/10" />

                <div className="mt-3 h-4 w-full animate-pulse rounded bg-white/10" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : installed.length === 0 ? (
        <Card className="rounded-3xl border border-dashed border-white/10 bg-[#111117]/80 backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/20">
              <Blocks className="h-8 w-8 text-white" />
            </div>

            <p className="mt-5 text-lg font-semibold text-white">
              No apps installed yet
            </p>

            <p className="mt-2 max-w-sm text-sm text-gray-400">
              Visit the App Store to discover apps that supercharge your store.
            </p>

            <Button
              size="sm"
              asChild
              className="mt-6 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-all duration-300 hover:scale-[1.02]"
            >
              <Link to="/dashboard/apps">
                <Plus className="mr-2 h-4 w-4" />
                Browse App Store
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {installed.map((app) => {
            const Icon = app.icon;

            return (
              <Card
                key={app.key}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#111117]/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-purple-500/40 hover:shadow-2xl hover:shadow-purple-500/20"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${app.gradient} opacity-10 blur-2xl transition-all duration-500 group-hover:opacity-30`}
                />

                <CardContent className="relative flex h-full flex-col gap-5 p-6">
                  <div className="flex items-start justify-between">
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${app.gradient} shadow-lg shadow-purple-500/20`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    <Badge className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
                      {app.category}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold leading-tight text-white">
                      {app.name}
                    </h3>

                    <p className="line-clamp-2 text-sm leading-relaxed text-gray-400">
                      {app.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      className="flex-1 rounded-2xl border-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/30"
                      asChild
                    >
                      <Link
                        to="/dashboard/apps/listing/$appKey"
                        params={{ appKey: app.key }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRemoving(app)}
                      aria-label={`Remove ${app.name}`}
                      className="rounded-2xl border-white/10 bg-white/5 transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/20"
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
        <AlertDialogContent className="border border-white/10 bg-[#111117] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {removing?.name}?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-gray-400">
              This will uninstall the app from your dashboard. You can reinstall
              it anytime from the App Store.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.section>
  );
}
