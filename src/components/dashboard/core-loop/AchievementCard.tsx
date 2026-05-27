import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Lock, Share2, Sparkles, Package, ShoppingBag, Palette, Layers, TrendingUp, Award, DollarSign, Star, Zap, Users, Flame, Rocket, type LucideIcon } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { shareAchievement } from "@/lib/core-loop/share-achievement";
import type { AchievementWithStatus } from "@/lib/core-loop";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Package, Rocket, ShoppingBag, Layers, TrendingUp, Award, Star, DollarSign, Zap, Users, Flame, Palette, Sparkles,
};

interface AchievementCardProps {
  achievement: AchievementWithStatus;
  onShared?: () => void;
}

export function AchievementCard({ achievement, onShared }: AchievementCardProps) {
  const Icon = ICON_MAP[achievement.icon] || Sparkles;
  const callShare = useServerFn(shareAchievement);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    setSharing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await callShare({ data: { accessToken: session.access_token, achievementId: achievement.id } });
      onShared?.();
    } catch { /* ignore */ }
    setSharing(false);
  };

  return (
    <Card className={cn(
      "border-border/60 shadow-soft transition-all",
      achievement.earned ? "bg-gradient-to-br from-emerald-500/[0.04] to-transparent" : "opacity-60",
    )}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
          achievement.earned
            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20"
            : "bg-muted text-muted-foreground/50",
        )}>
          {achievement.earned ? (
            <Icon className="h-5 w-5" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className={cn(
                "text-sm font-semibold",
                achievement.earned ? "text-foreground" : "text-muted-foreground",
              )}>
                {achievement.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{achievement.description}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Sparkles className="h-3 w-3 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">+{achievement.xpReward}</span>
            </div>
          </div>
          {achievement.earned && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-emerald-500">
                <CheckCircle2 className="h-3 w-3" /> Unlocked
              </div>
              {!achievement.shared && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                  onClick={handleShare}
                  disabled={sharing}
                >
                  <Share2 className="h-3 w-3" />
                  {sharing ? "..." : "Share"}
                </Button>
              )}
              {achievement.shared && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Share2 className="h-3 w-3" /> Shared
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
