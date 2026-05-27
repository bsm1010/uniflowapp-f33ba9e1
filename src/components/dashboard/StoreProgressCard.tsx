import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight, Sparkles, Package, Palette, ShoppingBag, Store, Rocket } from "lucide-react";
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

export function StoreProgressCard() {
  const navigate = useNavigate();
  const { currentStore } = useCurrentStore();
  const callGetProgress = useServerFn(getProgress);
  const [items, setItems] = useState<SetupItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!currentStore?.id) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const result = await callGetProgress({ data: { accessToken: session.access_token, storeId: currentStore.id } });
        setItems(result.setupItems);
        setProgress(result.setupProgress);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [currentStore?.id, callGetProgress]);

  const nextIncomplete = items.find((i) => !i.completed);
  const allDone = items.length > 0 && items.every((i) => i.completed);

  if (loading) return null;

  return (
    <Card className="border-0 shadow-soft overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-200" />
            <span className="text-sm font-semibold">Store Setup</span>
          </div>
          {allDone ? (
            <span className="flex items-center gap-1 text-xs text-emerald-300 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </span>
          ) : (
            <span className="text-xs text-purple-200 font-medium">{progress}%</span>
          )}
        </div>

        <div className="h-2 rounded-full bg-white/15 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-purple-300 to-pink-300"
          />
        </div>

        {allDone ? (
          <p className="text-xs text-purple-200 text-center py-1">Everything is set up!</p>
        ) : nextIncomplete ? (
          <>
            <div className="space-y-1.5">
              {items.map((item) => {
                const Icon = ITEM_ICONS[item.key] || Circle;
                return (
                  <div key={item.key} className="flex items-center gap-2.5 text-xs">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-300 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-purple-200/50 shrink-0" />
                    )}
                    <span className={cn(item.completed ? "text-purple-200 line-through opacity-60" : "text-white")}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="w-full gap-1.5 bg-white/15 hover:bg-white/25 text-white border-0 text-xs"
              onClick={() => navigate({ to: ITEM_ACTIONS[nextIncomplete.key] || "/dashboard" })}
            >
              {nextIncomplete.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
