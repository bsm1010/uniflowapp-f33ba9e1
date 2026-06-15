import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const xpForLevel = (level: number) => (100 * level * (level + 1)) / 2;

const Schema = z.object({
  accessToken: z.string().min(1),
  questId: z.string().min(1),
});

export type ClaimQuestResult = {
  xpAwarded: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  questTitle: string;
};

export const claimQuest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(data.accessToken);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: quest } = await client.from("quests").select("*").eq("id", data.questId).single();
    if (!quest) throw new Error("Quest not found");

    const { data: gami } = await client
      .from("user_gamification")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!gami) throw new Error("Gamification record not found");

    const newXp = (gami.xp || 0) + quest.xp_reward;
    let newLevel = gami.level;
    while (xpForLevel(newLevel + 1) <= newXp) newLevel++;

    await Promise.all([
      supabaseAdmin.from("xp_events").insert({
        user_id: user.id,
        event_type: "complete_quest",
        xp_amount: quest.xp_reward,
        metadata: { quest_id: quest.id, quest_key: quest.key, quest_title: quest.title },
      }),
      supabaseAdmin
        .from("user_gamification")
        .upsert(
          { user_id: user.id, xp: newXp, level: newLevel, updated_at: new Date().toISOString() },
          { onConflict: "user_id" },
        ),
      client
        .from("user_quests")
        .update({ claimed: true, updated_at: new Date().toISOString() })
        .eq("user_id", user.id)
        .eq("quest_id", data.questId),
    ]);

    return {
      xpAwarded: quest.xp_reward,
      totalXp: newXp,
      level: newLevel,
      leveledUp: newLevel > gami.level,
      questTitle: quest.title,
    } satisfies ClaimQuestResult;
  });
