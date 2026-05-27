import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Circle, ArrowRight, Package, Palette, ShoppingBag, Store, Rocket, Trophy } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { getProgress, type ProgressData } from "@/lib/progress/get-progress";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { MilestonesList } from "@/components/dashboard/MilestonesList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/progress")({
  component: ProgressPage,
  head: () => ({ meta: [{ title: "Store Progress — Fennecly" }] }),
});

const ITEM_ICONS: Record<string, typeof Package> = {
  product: Package, published: Rocket, store_customized: Palette, first_order: ShoppingBag, store_launched: Store,
};

const ITEM_ACTIONS: Record<string, string> = {
  product: "/dashboard/products", published: "/dashboard/products", store_customized: "/customize",
  first_order: "/dashboard/orders", store_launched: "/dashboard/store",
};

function ProgressPage() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const navigate = useNavigate();
  const callGetProgress = useServerFn(getProgress);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !currentStore?.id) { setLoading(false); return; }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const result = await callGetProgress({ data: { accessToken: session.access_token, storeId: currentStore.id } });
        setData(result);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [user, currentStore?.id, callGetProgress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground p-8 text-center">Could not load progress data.</p>;

  const { setupProgress, setupItems, milestones, stats } = data;
  const allSetupDone = setupItems.every((i) => i.completed);
  const unlockedMilestones = milestones.filter((m) => m.unlocked).length;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Progress" title="Store Progress" gradient="from-purple-500 to-pink-500" />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Products", value: stats.products, icon: Package },
          { label: "Published", value: stats.published, icon: Rocket },
          { label: "Orders", value: stats.orders, icon: ShoppingBag },
          { label: "Revenue", value: `${stats.revenue.toLocaleString("fr-DZ")} DA`, icon: Sparkles },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3 shadow-soft"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
              <s.icon className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Setup checklist */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              Setup Checklist
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                {setupProgress}% complete
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${setupProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
              />
            </div>
            <div className="space-y-1.5 pt-1">
              {setupItems.map((item) => {
                const Icon = ITEM_ICONS[item.key] || Circle;
                return (
                  <div key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                    {item.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                    )}
                    <span className={cn("text-sm flex-1", item.completed && "text-muted-foreground line-through")}>
                      {item.label}
                    </span>
                    {!item.completed && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs h-7"
                        onClick={() => navigate({ to: ITEM_ACTIONS[item.key] || "/dashboard" })}
                      >
                        Go <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {allSetupDone && (
              <p className="text-sm text-emerald-600 font-medium text-center pt-2">All setup complete! 🎉</p>
            )}
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card className="border-0 shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-purple-500" />
              Milestones
              <span className="ml-auto text-xs text-muted-foreground font-normal">
                {unlockedMilestones}/{milestones.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MilestonesList milestones={milestones} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
