import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const xpForLevel = (level: number) => 100 * level * (level + 1) / 2;

const XpValues: Record<string, number> = {
  add_product: 25,
  publish_product: 50,
  get_order: 100,
  daily_login: 10,
  customize_store: 25,
  launch_store: 100,
  refer_friend: 200,
  share_achievement: 15,
  complete_quest: 0,
};

const Schema = z.object({
  accessToken: z.string().min(1),
  eventType: z.string().min(1),
  metadata: z.record(z.any()).optional().default({}),
});

export type AwardXpResult = {
  xpAwarded: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  newAchievements: string[];
  newUnlocks: string[];
};

export const awardXp = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await client.auth.getUser(data.accessToken);
    if (authError || !user) throw new Error("Unauthorized");

    const xpAmount = XpValues[data.eventType] || 10;

    const { data: existingGami } = await client
      .from("user_gamification")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    const gami = existingGami || { xp: 0, level: 1 };
    const oldLevel = gami.level;
    const newXp = (gami.xp || 0) + xpAmount;
    let newLevel = oldLevel;
    while (xpForLevel(newLevel + 1) <= newXp) newLevel++;
    let leveledUp = newLevel > oldLevel;

    await Promise.all([
      supabaseAdmin.from("xp_events").insert({ user_id: user.id, event_type: data.eventType, xp_amount: xpAmount, metadata: data.metadata }),
      supabaseAdmin.from("user_gamification").upsert({ user_id: user.id, xp: newXp, level: newLevel, updated_at: new Date().toISOString() }, { onConflict: "user_id" }),
    ]);

    const [achievementsRes, prodRes, orderRes, settingsRes, referralRes] = await Promise.all([
      client.from("achievements").select("*"),
      client.from("products").select("id,status").eq("user_id", user.id),
      client.from("orders").select("id,total").eq("store_owner_id", user.id),
      client.from("store_settings").select("id,primary_color,background_color,hero_heading").eq("user_id", user.id).maybeSingle(),
      client.from("profiles").select("referral_code,referred_by").eq("id", user.id).maybeSingle(),
    ]);

    const achievements = achievementsRes.data ?? [];
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

    const { data: existingAchievements } = await client
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", user.id);

    const earnedIds = new Set((existingAchievements || []).map((a: any) => a.achievement_id));
    const newAchievements: string[] = [];

    for (const a of achievements) {
      if (earnedIds.has(a.id)) continue;
      let earned = false;
      switch (a.condition_type) {
        case "products": earned = productCount >= a.condition_value; break;
        case "published": earned = publishedCount >= a.condition_value; break;
        case "orders": earned = orderCount >= a.condition_value; break;
        case "revenue": earned = totalRevenue >= a.condition_value; break;
        case "customized": earned = hasCustomized; break;
        case "referrals": earned = referralCount >= a.condition_value; break;
        case "streak": earned = newLevel >= a.condition_value; break;
      }
      if (earned) {
        await supabaseAdmin.from("user_achievements").insert({ user_id: user.id, achievement_id: a.id });
        newAchievements.push(a.key);
        if (a.xp_reward > 0) {
          const bonusXp = a.xp_reward;
          const { data: cur } = await supabaseAdmin.from("user_gamification").select("xp,level").eq("user_id", user.id).maybeSingle();
          if (cur) {
            const updatedXp = cur.xp + bonusXp;
            let updatedLevel = cur.level;
            while (xpForLevel(updatedLevel + 1) <= updatedXp) updatedLevel++;
            await supabaseAdmin.from("user_gamification").upsert({ user_id: user.id, xp: updatedXp, level: updatedLevel, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
            if (updatedLevel > cur.level) leveledUp = true;
          }
        }
      }
    }

    const { data: finalGami } = await client
      .from("user_gamification")
      .select("xp,level")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: allUnlockables } = await client
      .from("unlockables")
      .select("*");

    const { data: existingUnlocks } = await client
      .from("user_unlocks")
      .select("unlockable_id")
      .eq("user_id", user.id);

    const finalLevel = finalGami?.level ?? newLevel;
    const finalXp = finalGami?.xp ?? newXp;
    const existingUnlockIds = new Set((existingUnlocks || []).map((u: any) => u.unlockable_id));
    const newUnlocks: string[] = [];
    const earnedAchievementCount = ((existingAchievements || []).length) + newAchievements.length;

    for (const u of (allUnlockables || [])) {
      if (existingUnlockIds.has(u.id)) continue;
      let shouldUnlock = false;
      switch (u.requirement_type) {
        case "level": shouldUnlock = finalLevel >= u.requirement_value; break;
        case "xp": shouldUnlock = finalXp >= u.requirement_value; break;
        case "achievement": shouldUnlock = earnedAchievementCount >= u.requirement_value; break;
      }
      if (shouldUnlock) {
        await supabaseAdmin.from("user_unlocks").insert({ user_id: user.id, unlockable_id: u.id });
        newUnlocks.push(u.key);
      }
    }

    return {
      xpAwarded: xpAmount,
      totalXp: finalXp,
      level: finalLevel,
      leveledUp,
      newAchievements,
      newUnlocks,
    } satisfies AwardXpResult;
  });
