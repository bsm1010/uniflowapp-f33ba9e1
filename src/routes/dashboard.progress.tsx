import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, CheckCircle2, Circle, ArrowRight, Package, Palette,
  ShoppingBag, Store, Rocket, Trophy, Zap, Star, TrendingUp,
  DollarSign, Layers, Award, Lock, Gem, Crown,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { getProgress, type ProgressData } from "@/lib/progress/get-progress";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/progress")({
  component: ProgressPage,
  head: () => ({ meta: [{ title: "Store Progress — Fennecly" }] }),
});

const ITEM_ICONS: Record<string, typeof Package> = {
  product: Package, published: Rocket, store_customized: Palette,
  first_order: ShoppingBag, store_launched: Store,
};

const ITEM_ACTIONS: Record<string, string> = {
  product: "/dashboard/products", published: "/dashboard/products",
  store_customized: "/customize",
  first_order: "/dashboard/orders", store_launched: "/dashboard/store",
};

const LEVELS = [
  { level: 1, label: "Beginners", icon: Star, color: "from-zinc-400 to-zinc-300" },
  { level: 2, label: "Rising Star", icon: Gem, color: "from-violet-400 to-fuchsia-400" },
  { level: 5, label: "Merchant", icon: Award, color: "from-amber-400 to-orange-400" },
  { level: 10, label: "Elite", icon: Crown, color: "from-yellow-400 to-rose-400" },
  { level: 20, label: "Legend", icon: Trophy, color: "from-cyan-400 to-blue-500" },
];

function calculateLevel(xp: number) {
  let lvl = 1;
  while (100 * lvl * (lvl + 1) / 2 <= xp) lvl++;
  return lvl;
}

function LevelProgress({ xp }: { xp: number }) {
  const level = calculateLevel(xp);
  const currentLevelXp = level === 1 ? 0 : 100 * (level - 1) * level / 2;
  const nextLevelXp = 100 * level * (level + 1) / 2;
  const progress = Math.min(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100, 100);
  return { level, progress, xp, nextLevelXp, currentLevelXp };
}

function ProgressPage() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const navigate = useNavigate();
  const callGetProgress = useServerFn(getProgress);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
          <div className="h-10 w-10 rounded-full border-2 border-fuchsia-500/20 border-b-fuchsia-500 animate-spin absolute inset-3" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">Could not load progress data.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const { setupProgress, setupItems, milestones, stats } = data;
  const allSetupDone = setupItems.every((i) => i.completed);
  const unlockedMilestones = milestones.filter((m) => m.unlocked).length;

  const xpEstimate = stats.products * 10 + stats.orders * 25 + stats.published * 15 + unlockedMilestones * 50;
  const { level, progress, xp, nextLevelXp, currentLevelXp } = LevelProgress({ xp: xpEstimate });
  const currentLevelDef = [...LEVELS].reverse().find((l) => level >= l.level) || LEVELS[0];
  const nextLevelDef = LEVELS.find((l) => l.level > level);

  return (
    <div className="relative space-y-8">
      {/* Animated background glow */}
      <div
        className="fixed pointer-events-none inset-0 -z-10 opacity-30 dark:opacity-20 transition-all duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139,92,246,0.15), transparent 60%)`,
        }}
      />

      <PageHeader
        eyebrow="Progress"
        title="Store Progress"
        gradient="from-purple-500 via-violet-500 to-pink-500"
      />

      {/* Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10 p-6"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5" />
        <div className="relative flex items-center gap-5">
          <div className={cn(
            "h-16 w-16 rounded-2xl flex items-center justify-center bg-gradient-to-br shadow-lg shrink-0",
            currentLevelDef.color,
          )}>
            <currentLevelDef.icon className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold">Level {level}</h2>
              <Badge variant="secondary" className="text-xs bg-violet-500/10 text-violet-600 dark:text-violet-400">
                {currentLevelDef.label}
              </Badge>
              {nextLevelDef && (
                <Badge variant="outline" className="text-xs text-muted-foreground ml-auto">
                  Next: Level {nextLevelDef.level} · {nextLevelDef.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
            </p>
            <div className="mt-3 h-3 rounded-full bg-muted/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Products", value: stats.products, icon: Package, color: "from-emerald-500 to-teal-500" },
          { label: "Published", value: stats.published, icon: Rocket, color: "from-sky-500 to-blue-500" },
          { label: "Orders", value: stats.orders, icon: ShoppingBag, color: "from-amber-500 to-orange-500" },
          { label: "Revenue", value: `${stats.revenue.toLocaleString("fr-DZ")} DA`, icon: TrendingUp, color: "from-violet-500 to-purple-500" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-xl border border-border/40 bg-card/50 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
          >
            <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-gradient-to-br opacity-[0.03] dark:opacity-[0.06] group-hover:opacity-[0.08] transition-opacity" style={{ backgroundImage: `linear-gradient(to bottom right, var(--${s.color})` }} />
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm",
                s.color,
              )}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Setup Checklist */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                Setup Checklist
                <Badge variant="secondary" className="ml-auto text-xs font-mono">
                  {setupProgress}%
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${setupProgress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </motion.div>
              </div>
              <div className="space-y-1">
                {setupItems.map((item, i) => {
                  const Icon = ITEM_ICONS[item.key] || Circle;
                  return (
                    <motion.div
                      key={item.key}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl transition-all group hover:bg-muted/40",
                        item.completed && "bg-emerald-500/5",
                      )}
                    >
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                        item.completed
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted/50 text-muted-foreground/40",
                      )}>
                        {item.completed ? (
                          <CheckCircle2 className="h-4.5 w-4.5" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn(
                          "text-sm font-medium",
                          item.completed && "text-emerald-600 dark:text-emerald-400 line-through decoration-emerald-500/30",
                        )}>
                          {item.label}
                        </span>
                      </div>
                      {!item.completed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-all text-xs h-7 shrink-0 hover:bg-violet-500/10 hover:text-violet-600"
                          onClick={() => navigate({ to: ITEM_ACTIONS[item.key] || "/dashboard" })}
                        >
                          Go <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                      {item.completed && (
                        <Badge variant="ghost" className="text-[10px] text-emerald-500 h-5 shrink-0">Done</Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              {allSetupDone && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-3"
                >
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-4 py-1.5 shadow-lg">
                    <Trophy className="h-3.5 w-3.5 mr-1.5" />
                    All setup complete!
                  </Badge>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-md overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                Milestones
                <Badge variant="secondary" className="ml-auto text-xs font-mono">
                  {unlockedMilestones}/{milestones.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {milestones.map((m, i) => {
                  const Icon = ITEM_ICONS[m.icon] || TierIcon;
                  const isProgress = !m.unlocked && m.progress !== undefined && m.progress > 0;
                  const isUnlocked = m.unlocked;
                  return (
                    <motion.div
                      key={m.key}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.04 }}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-xl transition-all",
                        isUnlocked
                          ? "bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/15"
                          : "bg-muted/20 border border-border/40 hover:bg-muted/30",
                      )}
                    >
                      <div className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
                        isUnlocked
                          ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm"
                          : "bg-muted/50 text-muted-foreground/40",
                      )}>
                        {isUnlocked ? <Icon className="h-4.5 w-4.5" /> : <Lock className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={cn(
                            "text-sm font-medium",
                            isUnlocked ? "text-emerald-700 dark:text-emerald-400" : "text-foreground",
                          )}>
                            {m.label}
                          </p>
                          {isUnlocked && (
                            <Badge variant="ghost" className="h-5 text-[10px] text-emerald-500 shrink-0">
                              <CheckCircle2 className="h-3 w-3 mr-0.5" /> Earned
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
                        {isProgress && m.target && (
                          <div className="mt-2 h-1.5 rounded-full bg-muted/60 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${m.progress}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Level progression table */}
              <div className="mt-5 pt-4 border-t border-border/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Zap className="h-3 w-3" /> Level Tiers
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {LEVELS.map((l) => {
                    const reached = level >= l.level;
                    return (
                      <div
                        key={l.level}
                        className={cn(
                          "rounded-xl p-3 text-center transition-all border",
                          reached
                            ? "bg-gradient-to-br border-violet-500/20 shadow-sm shadow-violet-500/5"
                            : "bg-muted/20 border-border/40 opacity-50",
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-lg mx-auto mb-1.5 flex items-center justify-center bg-gradient-to-br",
                          reached ? l.color : "from-muted to-muted",
                        )}>
                          <l.icon className={cn("h-4 w-4", reached ? "text-white" : "text-muted-foreground/50")} />
                        </div>
                        <p className="text-xs font-bold tabular-nums">Lv.{l.level}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{l.label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

function TierIcon(props: any) {
  return <Star className={props.className} />;
}
