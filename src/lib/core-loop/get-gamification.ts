import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export type GamificationData = {
  xp: number;
  level: number;
  xpForCurrent: number;
  xpForNext: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
  stats: { products: number; published: number; orders: number; revenue: number; referrals: number; customized: boolean };
  dailyQuests: QuestWithProgress[];
  weeklyQuests: QuestWithProgress[];
  achievementQuests: QuestWithProgress[];
  achievements: AchievementWithStatus[];
  unlockables: UnlockableWithStatus[];
  recentEvents: XpEvent[];
};

export type QuestWithProgress = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  type: string;
  xpReward: number;
  icon: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
};

export type AchievementWithStatus = {
  id: string;
  key: string;
  title: string;
  description: string | null;
  icon: string;
  xpReward: number;
  earned: boolean;
  earnedAt: string | null;
  shared: boolean;
};

export type UnlockableWithStatus = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  type: string;
  icon: string;
  requirementType: string;
  requirementValue: number;
  unlocked: boolean;
  equipped: boolean;
};

export type XpEvent = {
  id: string;
  eventType: string;
  xpAmount: number;
  createdAt: string;
};

const Schema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().optional(),
});

const xpForLevel = (level: number) => 100 * level * (level + 1) / 2;

export const getGamification = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await client.auth.getUser(data.accessToken);
    if (authError || !user) {
      return {
        xp: 0, level: 1, xpForCurrent: 0, xpForNext: 100,
        currentStreak: 0, longestStreak: 0, lastActiveDate: null,
        stats: { products: 0, published: 0, orders: 0, revenue: 0, referrals: 0, customized: false },
        dailyQuests: [], weeklyQuests: [], achievementQuests: [],
        achievements: [], unlockables: [], recentEvents: [],
      } as GamificationData;
    }

    const userId = user.id;

    const ensureGamification = async () => {
      const { data: existing } = await client
        .from("user_gamification")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) return existing;

      const { data: created } = await client
        .from("user_gamification")
        .insert({ user_id: userId, xp: 0, level: 1 })
        .select()
        .single();

      return created || { user_id: userId, xp: 0, level: 1, current_streak: 0, longest_streak: 0, last_active_date: null };
    };

    const [gami, questsRes, achievementsRes, unlockablesRes, eventsRes, userQuestsRes, userAchievementsRes, userUnlocksRes, prodRes, orderRes, settingsRes, referralRes] = await Promise.all([
      ensureGamification(),
      client.from("quests").select("*").order("type", { ascending: true }).order("xp_reward", { ascending: true }),
      client.from("achievements").select("*"),
      client.from("unlockables").select("*").order("requirement_value", { ascending: true }),
      client.from("xp_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      client.from("user_quests").select("*").eq("user_id", userId),
      client.from("user_achievements").select("*").eq("user_id", userId),
      client.from("user_unlocks").select("*").eq("user_id", userId),
      data.storeId
        ? client.from("products").select("id,status").eq("store_id", data.storeId)
        : client.from("products").select("id,status").eq("user_id", userId),
      data.storeId
        ? client.from("orders").select("id,total").eq("store_id", data.storeId)
        : client.from("orders").select("id,total").eq("store_owner_id", userId),
      data.storeId
        ? client.from("store_settings").select("id,primary_color,background_color,hero_heading").eq("store_id", data.storeId).maybeSingle()
        : Promise.resolve({ data: null }),
      client.from("profiles").select("referral_code,referred_by").eq("id", userId).maybeSingle(),
    ]);

    const quests = questsRes.data ?? [];
    const achievements = achievementsRes.data ?? [];
    const unlockablesList = unlockablesRes.data ?? [];
    const events = eventsRes.data ?? [];
    const userQuests = userQuestsRes.data ?? [];
    const userAchievements = userAchievementsRes.data ?? [];
    const userUnlocks = userUnlocksRes.data ?? [];

    const products = prodRes.data ?? [];
    const orders = orderRes.data ?? [];
    const settings = settingsRes.data;
    const profile = referralRes.data;

    const productCount = products.length;
    const publishedCount = products.filter((p: any) => p.status === "published").length;
    const orderCount = orders.length;
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const hasCustomized = !!(settings?.primary_color && settings.primary_color !== "#000000" && settings?.hero_heading);

    const referralCount = profile?.referral_code
      ? (await client.from("profiles").select("id", { count: "exact", head: true }).eq("referred_by", profile.referral_code)).count ?? 0
      : 0;

    const stats = { products: productCount, published: publishedCount, orders: orderCount, revenue: totalRevenue, referrals: referralCount, customized: hasCustomized };

    const today = new Date().toISOString().split("T")[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];

    const dailyQuests: QuestWithProgress[] = [];
    const weeklyQuests: QuestWithProgress[] = [];
    const achievementQuests: QuestWithProgress[] = [];

    for (const q of quests) {
      const existingUQ = userQuests.find((uq: any) => uq.quest_id === q.id);
      let progress = existingUQ?.progress ?? 0;
      const target = (q.requirements as any)?.count ?? 1;
      const eventType = (q.requirements as any)?.event ?? "";

      if (q.type === "daily") {
        const todayEvents = events.filter((e: any) => e.event_type === eventType && e.created_at?.startsWith(today));
        progress = Math.min(todayEvents.length, target);
      } else if (q.type === "weekly") {
        const weekEvents = events.filter((e: any) => e.event_type === eventType && e.created_at >= weekStartStr);
        progress = Math.min(weekEvents.length, target);
      } else if (q.type === "achievement") {
        switch (eventType) {
          case "add_product": progress = Math.min(productCount, target); break;
          case "get_order": progress = Math.min(orderCount, target); break;
          case "customize_store": progress = hasCustomized ? 1 : 0; break;
          case "revenue": progress = Math.min(totalRevenue, target); break;
          case "referral": progress = Math.min(referralCount, target); break;
          case "streak": progress = Math.min(gami.current_streak || 0, target); break;
        }
      }

      const completed = progress >= target;
      const claimed = existingUQ?.claimed ?? false;
      const qp: QuestWithProgress = { id: q.id, key: q.key, title: q.title, description: q.description, type: q.type, xpReward: q.xp_reward, icon: q.icon, progress, target, completed, claimed };

      if (q.type === "daily") dailyQuests.push(qp);
      else if (q.type === "weekly") weeklyQuests.push(qp);
      else achievementQuests.push(qp);
    }

    const achievementsWithStatus: AchievementWithStatus[] = achievements.map((a: any) => {
      const earned = userAchievements.find((ua: any) => ua.achievement_id === a.id);
      return { id: a.id, key: a.key, title: a.title, description: a.description, icon: a.icon, xpReward: a.xp_reward, earned: !!earned, earnedAt: earned?.earned_at ?? null, shared: earned?.shared ?? false };
    });

    const unlockablesWithStatus: UnlockableWithStatus[] = unlockablesList.map((u: any) => {
      const unlocked = userUnlocks.find((uu: any) => uu.unlockable_id === u.id);
      return { id: u.id, key: u.key, name: u.name, description: u.description, type: u.type, icon: u.icon, requirementType: u.requirement_type, requirementValue: u.requirement_value, unlocked: !!unlocked, equipped: unlocked?.equipped ?? false };
    });

    const recentEvents: XpEvent[] = events.map((e: any) => ({ id: e.id, eventType: e.event_type, xpAmount: e.xp_amount, createdAt: e.created_at }));

    return {
      xp: gami.xp,
      level: gami.level,
      xpForCurrent: xpForLevel(gami.level),
      xpForNext: xpForLevel(gami.level + 1),
      currentStreak: gami.current_streak || 0,
      longestStreak: gami.longest_streak || 0,
      lastActiveDate: gami.last_active_date,
      stats,
      dailyQuests,
      weeklyQuests,
      achievementQuests,
      achievements: achievementsWithStatus,
      unlockables: unlockablesWithStatus,
      recentEvents,
    };
  });
