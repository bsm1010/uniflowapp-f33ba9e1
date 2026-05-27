import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2, Circle, ArrowRight, Package, Palette, ShoppingBag, Store, Rocket, Trophy } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore } from "@/hooks/use-current-store";
import { getProgress, type SetupItem, type Milestone } from "@/lib/progress/get-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/dashboard/progress")({
  component: RouteComponent,
});

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

const MILESTONE_ICONS: Record<string, typeof Trophy> = {
  Package: Package,
  CheckCircle2: CheckCircle2,
  ShoppingBag: ShoppingBag,
};

function RouteComponent() {
  const navigate = useNavigate();
  const { currentStore } = useCurrentStore();
  const callGetProgress = useServerFn(getProgress);
  const [items, setItems] = useState<SetupItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
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
        setMilestones(result.milestones);
        setProgress(result.setupProgress);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [currentStore?.id, callGetProgress]);

  const nextIncomplete = items.find((i) => !i.completed);
  const allDone = items.length > 0 && items.every((i) => i.completed);

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Store Progress</h1>
          <p className="text-muted-foreground">Track your store setup and growth milestones</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Setup Checklist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => {
                      const Icon = ITEM_ICONS[item.key] || Circle;
                      return (
                        <div key={item.key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          {item.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
                          )}
                          <Icon className={cn("h-4 w-4 shrink-0", item.completed ? "text-emerald-500" : "text-muted-foreground")} />
                          <span className={cn("flex-1 text-sm", item.completed && "line-through text-muted-foreground")}>
                            {item.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {!loading && !allDone && nextIncomplete && (
                  <Button
                    className="w-full gap-2"
                    onClick={() => navigate({ to: ITEM_ACTIONS[nextIncomplete.key] || "/dashboard" })}
                  >
                    {nextIncomplete.label}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}

                {!loading && allDone && (
                  <div className="text-center py-4 text-emerald-600 font-medium text-sm">
                    All setup steps complete!
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No milestones yet</p>
                ) : (
                  <div className="space-y-3">
                    {milestones.slice(0, 6).map((m) => (
                      <div
                        key={m.key}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          m.unlocked ? "bg-amber-50 border-amber-200" : "bg-muted/30 border-transparent opacity-60"
                        )}
                      >
                        <div className={cn(
                          "p-1.5 rounded-full",
                          m.unlocked ? "bg-amber-100 text-amber-600" : "bg-muted text-muted-foreground"
                        )}>
                          <Trophy className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{m.label}</p>
                          <p className="text-xs text-muted-foreground">{m.description}</p>
                          {m.progress !== undefined && m.target && (
                            <Progress value={(m.progress / (m.target === 1 ? 100 : m.target)) * 100} className="h-1.5 mt-1.5" />
                          )}
                        </div>
                        {m.unlocked && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
