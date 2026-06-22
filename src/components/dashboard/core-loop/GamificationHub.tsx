import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Zap,
  Trophy,
  Flame,
  Star,
  ArrowRight,
  Crown,
  Sparkles,
  Target,
  Award,
  CheckCircle,
  Heart,
  Share2,
  Gift,
  Package,
  Rocket,
  Palette,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  getGamification,
  type GamificationData,
} from "@/lib/core-loop/get-gamification";
import { StreakFlame } from "./StreakFlame";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface GamificationHubProps {
  compact?: boolean;
  data?: GamificationData | null;
}

export function GamificationHub({ compact = false, data: propData }: GamificationHubProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentStore } = useCurrentStore();
  const callGetGamification = useServerFn(getGamification);

  const [fetchedData, setFetchedData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(!propData);

  const data = propData ?? fetchedData;

  useEffect(() => {
    if (propData) {
      setLoading(false);
      return;
    }
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
        const result = await callGetGamification({
          data: {
            accessToken: session.access_token,
            storeId: currentStore.id,
          },
        });
        setFetchedData(result);
      } catch (err) {
        console.error("Failed to load gamification:", err);
      }
      setLoading(false);
    };
    load();
  }, [currentStore?.id, callGetGamification, propData]);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showUnlockables, setShowUnlockables] = useState(false);
  const [sharingAchievement, setSharingAchievement] = useState<string | null>(
    null
  );
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  const dailyCompleted = data
    ? data.dailyQuests.filter((q) => q.completed).length
    : 0;
  const weeklyCompleted = data
    ? data.weeklyQuests.filter((q) => q.completed).length
    : 0;
  const earnedAchievements = data
    ? data.achievements.filter((a) => a.earned).length
    : 0;
  const totalAchievements = data ? data.achievements.length : 0;

  const xpProgressPercent = data
    ? ((data.xp - data.xpForCurrent) / (data.xpForNext - data.xpForCurrent)) *
      100
    : 0;

  const nextUnlockable = data?.unlockables.find((u) => !u.unlocked);
  const recentUnlocks = data?.achievements.filter((a) => a.earned) || [];

  const levelTitle = data
    ? data.level >= 100
      ? "Legendary Store Owner"
      : data.level >= 50
        ? "Master Merchant"
        : data.level >= 25
          ? "Expert Seller"
          : data.level >= 10
            ? "Growing Business"
            : data.level >= 5
              ? "Rising Star"
              : "New Entrepreneur"
    : "";

  const getAchievementIcon = (key: string) => {
    switch (key) {
      case "first_product":
        return Package;
      case "products_10":
      case "products_50":
        return Target;
      case "first_order":
      case "orders_10":
        return Trophy;
      case "revenue_1000":
      case "revenue_5000":
      case "revenue_10000":
        return Crown;
      case "store_launched":
        return Rocket;
      case "store_customized":
        return Palette;
      case "first_share":
        return Share2;
      case "referrals_5":
      case "referrals_10":
        return Heart;
      default:
        return Award;
    }
  };

  const getUnlockableIcon = (key: string) => {
    switch (key) {
      case "store_customized":
      case "store_customized_2":
        return Palette;
      case "revenue_milestone":
        return Crown;
      case "orders_milestone":
        return Trophy;
      default:
        return Gift;
    }
  };

  const handleShare = async (achievement: any) => {
    setSharingAchievement(achievement.key);
    const shareData = {
      title: `${achievement.title} Achievement Unlocked!`,
      text: `I just unlocked the "${achievement.title}" achievement on Fennecly! ${achievement.description} #Fennecly #Ecommerce`,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setShareMessage("Achievement shared successfully!");
        setTimeout(() => setShareMessage(null), 3000);
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );
        setShareMessage("Achievement copied to clipboard!");
        setTimeout(() => setShareMessage(null), 3000);
      } catch (err) {
        console.error("Clipboard error:", err);
      }
    }
    setSharingAchievement(null);
  };

  if (loading) {
    return (
      <Card className="border-border/50 border-l-2 border-l-amber-500 overflow-hidden">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
              <Zap className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">Your Progress</h3>
              <div className="space-y-3 mt-4">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-3 bg-muted rounded w-3/4 mb-1" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  if (compact) {
    const circumference = 2 * Math.PI * 36;
    const strokeDashoffset =
      circumference - (xpProgressPercent / 100) * circumference;

    return (
      <>
        <Card className="border-border/50 border-l-2 border-l-amber-500 overflow-hidden">
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                  <Zap className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t("dashboard.gamification.yourProgress")}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("dashboard.gamification.yourProgressDesc")}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs text-violet-600 dark:text-violet-400"
                onClick={() =>
                  navigate({ to: "/dashboard/progress" })
                }
              >
                {t("dashboard.gamification.viewAll")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Circular progress + Level info */}
            <div className="flex items-center gap-3">
              {/* SVG Circular Progress Ring */}
              <div className="relative shrink-0">
                <svg
                  width="72"
                  height="72"
                  viewBox="0 0 72 72"
                  className="-rotate-90"
                >
                  <circle
                    cx="36"
                    cy="36"
                    r="32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-muted/50"
                  />
                  <motion.circle
                    cx="36"
                    cy="36"
                    r="32"
                    fill="none"
                    stroke="url(#progress-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient
                      id="progress-gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="rgb(245, 158, 11)" />
                      <stop offset="100%" stopColor="rgb(249, 115, 22)" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-bold text-foreground">
                    {data.level}
                  </span>
                </div>
              </div>

              {/* Level info + XP */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5 mb-1.5">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    {t("dashboard.gamification.level")} {data.level}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate min-w-0">
                    {levelTitle}
                  </span>
                </div>
                <Progress value={xpProgressPercent} className="h-1.5" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span className="truncate min-w-0">
                    {data.xpForNext - data.xp} XP {t("dashboard.gamification.next")}
                  </span>
                  <span className="whitespace-nowrap ml-1">{Math.round(xpProgressPercent)}%</span>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-1.5 rounded-lg bg-muted/30 min-w-0">
                <div className="flex items-center justify-center mb-0.5">
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="text-sm font-bold text-foreground leading-tight">
                  {data.currentStreak}
                </div>
                <div className="text-[9px] text-muted-foreground leading-tight">
                  {t("dashboard.gamification.streakDays")}
                </div>
              </div>

              <div className="text-center p-1.5 rounded-lg bg-muted/30 min-w-0">
                <div className="flex items-center justify-center mb-0.5">
                  <Trophy className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="text-sm font-bold text-foreground leading-tight">
                  {earnedAchievements}
                </div>
                <div className="text-[9px] text-muted-foreground leading-tight">
                  {t("dashboard.gamification.badges")}
                </div>
              </div>

              <div className="text-center p-1.5 rounded-lg bg-muted/30 min-w-0">
                <div className="flex items-center justify-center mb-0.5">
                  {nextUnlockable ? (
                    <Gift className="h-3.5 w-3.5 text-violet-500" />
                  ) : (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-foreground truncate leading-tight">
                  {nextUnlockable
                    ? nextUnlockable.name
                    : t("dashboard.gamification.allUnlocked")}
                </div>
                <div className="text-[9px] text-muted-foreground leading-tight">
                  {nextUnlockable
                    ? t("dashboard.gamification.reward")
                    : t("dashboard.gamification.reward")}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                {t("dashboard.gamification.title")}
              </DialogTitle>
              <DialogDescription>
                {t("dashboard.gamification.desc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-foreground">
                    {data.level}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t("dashboard.gamification.level")}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    {levelTitle}
                  </div>
                  <Progress value={xpProgressPercent} className="h-2 mt-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>
                      {data.xp} / {data.xpForNext} XP
                    </span>
                    <span>
                      {data.xpForNext - data.xp} XP {t("dashboard.gamification.next")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StreakFlame
                  streak={data.currentStreak}
                  longestStreak={data.longestStreak}
                  size="md"
                />
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-emerald-500" />
                  <div>
                    <div className="text-sm font-medium">
                      {earnedAchievements} / {totalAchievements}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("dashboard.gamification.badges")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDetailModal(false)}
              >
                {t("dashboard.gamification.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Card className="border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            {t("dashboard.gamification.title")}
          </CardTitle>
          <CardDescription>{t("dashboard.gamification.desc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-foreground">
                {data.level}
              </div>
              <div className="text-sm text-muted-foreground">
                {t("dashboard.gamification.level")}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
                {levelTitle}
              </div>
              <Progress value={xpProgressPercent} className="h-2 mt-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>
                  {data.xp} / {data.xpForNext} XP
                </span>
                <span>
                  {data.xpForNext - data.xp} XP {t("dashboard.gamification.next")}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StreakFlame
              streak={data.currentStreak}
              longestStreak={data.longestStreak}
              size="md"
            />
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-sm font-medium">
                  {earnedAchievements} / {totalAchievements}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("dashboard.gamification.badges")}
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full gap-1.5"
            onClick={() => navigate({ to: "/dashboard/progress" })}
          >
            {t("dashboard.gamification.play")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
