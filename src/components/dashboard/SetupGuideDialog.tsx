import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Circle,
  Rocket,
  Package,
  Palette,
  ShoppingBag,
  Store,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore } from "@/hooks/use-current-store";
import { getProgress, type SetupItem } from "@/lib/progress/get-progress";
import { cn } from "@/lib/utils";

const STEP_ICONS: Record<string, typeof Package> = {
  product: Package,
  published: Rocket,
  store_customized: Palette,
  first_order: ShoppingBag,
  store_launched: Store,
};

const STEP_ROUTES: Record<string, string> = {
  product: "/dashboard/products",
  published: "/dashboard/products",
  store_customized: "/customize",
  first_order: "/dashboard/orders",
  store_launched: "/dashboard/store",
};

const STEP_DESCRIPTION_KEYS: Record<string, string> = {
  product: "progress.guide.addProduct",
  published: "progress.guide.publishProduct",
  store_customized: "progress.guide.customizeStore",
  first_order: "progress.guide.receiveOrder",
  store_launched: "progress.guide.activateStore",
};

interface Props {
  userId: string;
}

export function SetupGuideDialog({ userId }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentStore } = useCurrentStore();
  const callGetProgress = useServerFn(getProgress);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SetupItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const storageKey = `fennecly:setup-guide-seen:${userId}`;

  useEffect(() => {
    if (!userId || !currentStore?.id) return;
    let cancelled = false;

    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session || cancelled) return;
        const result = await callGetProgress({
          data: { accessToken: session.access_token, storeId: currentStore.id },
        });
        if (cancelled) return;
        setItems(result.setupItems);
        setProgress(result.setupProgress);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, currentStore?.id, callGetProgress]);

  // Show dialog on first visit if setup is not 100%
  useEffect(() => {
    if (loading || progress === 100) return;
    try {
      if (!localStorage.getItem(storageKey)) {
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, [loading, progress, storageKey]);

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      // ignore
    }
  };

  const handleStepClick = (key: string) => {
    const route = STEP_ROUTES[key];
    if (route) {
      handleClose();
      if (route.startsWith("/customize")) {
        window.location.href = route;
      } else {
        navigate({ to: route });
      }
    }
  };

  const handleStart = () => {
    const nextIncomplete = items.find((i) => !i.completed);
    if (nextIncomplete) {
      handleStepClick(nextIncomplete.key);
    } else {
      handleClose();
    }
  };

  const completedCount = items.filter((i) => i.completed).length;
  const allDone = items.length > 0 && items.every((i) => i.completed);

  // Expose an imperative handle so other components can open this dialog
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("fennecly:open-setup-guide", handler);
    return () => window.removeEventListener("fennecly:open-setup-guide", handler);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-lg overflow-hidden border-0 p-0 shadow-2xl sm:rounded-2xl">
        {/* Header illustration */}
        <div className="relative flex h-40 items-center justify-center overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700">
          <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-8 -right-4 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
          <div className="relative text-center text-white">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-3">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold">{t("progress.guide.title")}</h2>
            <p className="text-sm text-white/80 mt-1">
              {allDone
                ? t("progress.guide.ready")
                : t("progress.guide.stepsComplete", {
                    completed: completedCount,
                    total: items.length,
                  })}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-6 pt-4">
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            {t("progress.setup.percent", { percent: progress })}
          </p>
        </div>

        {/* Checklist */}
        <div className="px-6 py-4 space-y-1.5">
          {items.map((item) => {
            const Icon = STEP_ICONS[item.key] || Circle;
            const descriptionKey = STEP_DESCRIPTION_KEYS[item.key] || "";
            return (
              <button
                key={item.key}
                onClick={() => !item.completed && handleStepClick(item.key)}
                disabled={item.completed}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-right transition-colors",
                  item.completed
                    ? "bg-emerald-500/5 cursor-default"
                    : "hover:bg-muted/50 cursor-pointer",
                )}
              >
                {item.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        item.completed ? "text-emerald-500" : "text-muted-foreground",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.completed ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {t(item.label)}
                    </span>
                  </div>
                  {!item.completed && descriptionKey && (
                    <p className="text-xs text-muted-foreground mt-0.5 mr-6">{t(descriptionKey)}</p>
                  )}
                </div>
                {!item.completed && (
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            {allDone ? t("progress.guide.close") : t("progress.guide.later")}
          </Button>
          {!allDone && (
            <Button onClick={handleStart} className="flex-1 gap-2">
              <Rocket className="h-4 w-4" />
              {items.find((i) => !i.completed)
                ? t("progress.guide.startNow")
                : t("progress.guide.close")}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
