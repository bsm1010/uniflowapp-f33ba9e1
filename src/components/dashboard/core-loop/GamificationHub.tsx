import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Flame, CheckCircle2, Gift, TrendingUp, ArrowRight, Trophy, Users, Package, ShoppingBag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import type { GamificationData } from "@/lib/core-loop";
import { XPBar } from "./XPBar";
import { StreakFlame } from "./StreakFlame";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GamificationHubProps {
  data: GamificationData;
  loading?: boolean;
  compact?: boolean;
}

export function GamificationHub({ data, loading, compact }: GamificationHubProps) {
  const navigate = useNavigate();
  const [showLevelUp, setShowLevelUp] = useState(false);

  if (loading) {
    return (
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-2 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const dailyCompleted = data.dailyQuests.filter((q) => q.completed).length;
  const weeklyCompleted = data.weeklyQuests.filter((q) => q.completed).length;
  const achievementCompleted = data.achievementQuests.filter((q) => q.completed).length;
  const earnedAchievements = data.achievements.filter((a) => a.earned).length;
  const earnedUnlocks = data.unlockables.filter((u) => u.unlocked).length;

  if (compact) {
    return (
      <Card className="border-border/50 shadow-sm overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
        onClick={() => navigate({ to: "/dashboard/gamification" })}
      >
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">Your Progress</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              View <ArrowRight className="h-3 w-3" />
            </div>
          </div>
          <XPBar
            xp={data.xp}
            level={data.level}
            xpForCurrent={data.xpForCurrent}
            xpForNext={data.xpForNext}
            animate
            size="sm"
            showLevel
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <StreakFlame streak={data.currentStreak} longestStreak={data.longestStreak} size="sm" />
            <span>{dailyCompleted}/{data.dailyQuests.length} daily</span>
            <span>{earnedAchievements} achievements</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* XP & Level Card */}
      <Card className="border-0 shadow-soft overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-700 text-white">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Zap className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <p className="text-sm text-white/70">Current Level</p>
                <p className="text-2xl font-bold font-display">Level {data.level}</p>
              </div>
            </div>
            <StreakFlame streak={data.currentStreak} longestStreak={data.longestStreak} size="md" />
          </div>
          <XPBar
            xp={data.xp}
            level={data.level}
            xpForCurrent={data.xpForCurrent}
            xpForNext={data.xpForNext}
            animate
            size="lg"
          />
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Daily Quests", value: `${dailyCompleted}/${data.dailyQuests.length}`, icon: Flame, color: "text-blue-500" },
          { label: "Weekly Quests", value: `${weeklyCompleted}/${data.weeklyQuests.length}`, icon: TrendingUp, color: "text-violet-500" },
          { label: "Achievements", value: `${earnedAchievements}/${data.achievements.length}`, icon: Trophy, color: "text-amber-500" },
          { label: "Unlocks", value: `${earnedUnlocks}/${data.unlockables.length}`, icon: Gift, color: "text-emerald-500" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border border-border/60 bg-card p-4 flex items-center gap-3 shadow-soft"
          >
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quests section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-0 shadow-soft">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Flame className="h-4 w-4 text-blue-500" />
                Daily Quests
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate({ to: "/dashboard/quests" })}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {data.dailyQuests.slice(0, 3).map((q) => (
                <div key={q.id} className="flex items-center gap-2.5 text-xs">
                  {q.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={cn("flex-1", q.completed && "text-muted-foreground line-through")}>
                    {q.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{q.progress}/{q.target}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-violet-500" />
                Weekly Quests
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate({ to: "/dashboard/quests" })}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <div className="space-y-2">
              {data.weeklyQuests.map((q) => (
                <div key={q.id} className="flex items-center gap-2.5 text-xs">
                  {q.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={cn("flex-1", q.completed && "text-muted-foreground line-through")}>
                    {q.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{q.progress}/{q.target}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="border-0 shadow-soft">
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Recent Activity
          </h3>
          {data.recentEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Start interacting with your store to earn XP!
            </p>
          ) : (
            <div className="space-y-1.5">
              {data.recentEvents.slice(0, 10).map((e) => (
                <div key={e.id} className="flex items-center justify-between py-1.5 text-xs border-b border-border/40 last:border-0">
                  <span className="capitalize text-muted-foreground">
                    {e.eventType.replace(/_/g, " ")}
                  </span>
                  <span className="font-medium text-amber-400">+{e.xpAmount} XP</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
