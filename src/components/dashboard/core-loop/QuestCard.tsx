import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Gift, Sparkles, Package, ShoppingBag, LayoutDashboard, LogIn, Truck, Palette, Layers, TrendingUp, DollarSign, Users, Flame, Award, type LucideIcon } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { claimQuest } from "@/lib/core-loop/claim-quest";
import type { QuestWithProgress } from "@/lib/core-loop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  LogIn, LayoutDashboard, Package, ShoppingBag, Truck, Palette, Layers, TrendingUp, DollarSign, Users, Flame, Award, Sparkles, Gift,
};

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  achievement: "Achievement",
};

const TYPE_COLORS: Record<string, string> = {
  daily: "from-blue-500 to-cyan-500",
  weekly: "from-violet-500 to-purple-500",
  achievement: "from-amber-500 to-orange-500",
};

interface QuestCardProps {
  quest: QuestWithProgress;
  onClaimed?: () => void;
}

export function QuestCard({ quest, onClaimed }: QuestCardProps) {
  const Icon = ICON_MAP[quest.icon] || Sparkles;
  const callClaim = useServerFn(claimQuest);
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await callClaim({ data: { accessToken: session.access_token, questId: quest.id } });
      onClaimed?.();
    } catch { /* ignore */ }
    setClaiming(false);
  };

  return (
    <Card className={cn(
      "border-border/60 shadow-soft transition-all",
      quest.completed && quest.claimed && "opacity-60",
    )}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn(
          "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br",
          quest.completed ? "from-emerald-500 to-teal-500" : TYPE_COLORS[quest.type],
        )}>
          {quest.completed ? (
            <CheckCircle2 className="h-4 w-4 text-white" />
          ) : (
            <Icon className="h-4 w-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {TYPE_LABELS[quest.type]}
              </span>
              <p className="text-sm font-semibold leading-tight mt-0.5">{quest.title}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">+{quest.xpReward} XP</span>
            </div>
          </div>
          {quest.description && (
            <p className="text-xs text-muted-foreground mt-1">{quest.description}</p>
          )}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(quest.progress / quest.target) * 100}%` }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "h-full rounded-full",
                  quest.completed ? "bg-emerald-500" : "bg-gradient-to-r from-violet-500 to-fuchsia-500",
                )}
              />
            </div>
            <span className="text-[11px] text-muted-foreground font-medium tabular-nums">
              {quest.progress}/{quest.target}
            </span>
          </div>
          {quest.completed && !quest.claimed && (
            <Button
              size="sm"
              className="mt-2 h-7 text-xs gap-1"
              onClick={handleClaim}
              disabled={claiming}
            >
              <Gift className="h-3 w-3" />
              {claiming ? "Claiming..." : "Claim Reward"}
            </Button>
          )}
          {quest.completed && quest.claimed && (
            <div className="mt-2 flex items-center gap-1 text-xs text-emerald-500">
              <CheckCircle2 className="h-3 w-3" /> Claimed
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
