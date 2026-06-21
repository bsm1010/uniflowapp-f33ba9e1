import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Check,
  ArrowRight,
  Sparkles,
  Package,
  Palette,
  ShoppingBag,
  Store,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore } from "@/hooks/use-current-store";
import { getProgress, type SetupItem } from "@/lib/progress/get-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ITEM_ICONS: Record<string, typeof Package> = {
  product: Package,
  published: Rocket,
  store_customized: Palette,
  first_order: ShoppingBag,
  store_launched: Store,
};

const ITEM_ACTIONS: Record<string, string> = {
  product: "/dashboard/products",
  published: "/dashboard/products",
  store_customized: "/customize",
  first_order: "/dashboard/orders",
  store_launched: "/dashboard/store",
};

const STEP_DESCRIPTIONS: Record<string, string> = {
  product: "Add your first product to the catalog",
  published: "Publish a product so customers can see it",
  store_customized: "Set your store colors, hero image, and theme",
  first_order: "Receive your first customer order",
  store_launched: "Activate your store so it's publicly visible",
};

export function StoreProgressCard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentStore } = useCurrentStore();
  const callGetProgress = useServerFn(getProgress);
  const [items, setItems] = useState<SetupItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentStore?.id) {
        setLoading(false);
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      try {
        const result = await callGetProgress({
          data: { accessToken: session.access_token, storeId: currentStore.id },
        });
        setItems(result.setupItems);
        setProgress(result.setupProgress);
      } catch (err) {
        console.error("Failed to load progress:", err);
      }
      setLoading(false);
    };
    load();
  }, [currentStore?.id, callGetProgress]);

  const nextIncomplete = items.find((i) => !i.completed);
  const allDone = items.length > 0 && items.every((i) => i.completed);
  const completedCount = items.filter((i) => i.completed).length;

  if (loading) return null;

  return (
    <Card className="border-border/50 border-l-2 border-l-violet-500 overflow-hidden">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {t("progress.setup.title")}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Complete these steps to launch your store
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-lg font-bold text-foreground">
              {completedCount} / {items.length || 5}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Steps completed
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          />
        </div>

        {/* Vertical timeline */}
        {items.length > 0 && (
          <div className="relative">
            {/* Dashed connector line */}
            <div className="absolute left-[17px] top-[18px] bottom-[18px] border-l-2 border-dashed border-border z-0" />

            <div className="space-y-1">
              {items.map((item, idx) => {
                const Icon = ITEM_ICONS[item.key] || Package;
                const isCurrent = !item.completed && items.slice(0, idx).every((i) => i.completed);
                const isFuture = !item.completed && !isCurrent;

                return (
                  <motion.div
                    key={item.key}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className={cn(
                      "relative flex items-center gap-3 py-2 px-1 rounded-lg cursor-pointer transition-colors z-10",
                      !isFuture && "hover:bg-muted/50",
                    )}
                    onClick={() => {
                      if (!isFuture) {
                        navigate({ to: ITEM_ACTIONS[item.key] || "/dashboard" });
                      }
                    }}
                  >
                    {/* Step circle */}
                    <div
                      className={cn(
                        "h-9 w-9 rounded-full flex items-center justify-center shrink-0 transition-all relative",
                        item.completed
                          ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                          : isCurrent
                            ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                            : "bg-muted",
                      )}
                    >
                      {item.completed ? (
                        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            isCurrent ? "text-primary-foreground" : "text-muted-foreground",
                          )}
                        >
                          {idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            item.completed
                              ? "text-muted-foreground line-through"
                              : "text-foreground",
                          )}
                        >
                          {t(item.label)}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-medium bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300 rounded-full px-2 py-0.5">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {STEP_DESCRIPTIONS[item.key]}
                      </p>
                    </div>

                    {/* Chevron */}
                    {!isFuture && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom button */}
        {allDone ? (
          <p className="text-xs text-muted-foreground text-center py-1">
            {t("progress.setup.completeAll")}
          </p>
        ) : nextIncomplete ? (
          <Button
            size="sm"
            className="w-full gap-1.5 bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => navigate({ to: ITEM_ACTIONS[nextIncomplete.key] || "/dashboard" })}
          >
            Continue Setup
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
