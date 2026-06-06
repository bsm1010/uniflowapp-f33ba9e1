import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const Schema = z.object({
  accessToken: z.string().min(1),
  achievementId: z.string().min(1),
});

export type ShareAchievementResult = {
  shared: boolean;
  xpAwarded: number;
};

export const shareAchievement = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: { user }, error: authError } = await client.auth.getUser(data.accessToken);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: existing } = await client
      .from("user_achievements")
      .select("*")
      .eq("user_id", user.id)
      .eq("id", data.achievementId)
      .maybeSingle();

    if (!existing) throw new Error("Achievement not found");
    if (existing.shared) return { shared: true, xpAwarded: 0 } satisfies ShareAchievementResult;

    await Promise.all([
      supabaseAdmin.from("user_achievements").update({ shared: true }).eq("id", data.achievementId),
      supabaseAdmin.from("xp_events").insert({ user_id: user.id, event_type: "share_achievement", xp_amount: 15, metadata: { achievement_id: data.achievementId } }),
      supabaseAdmin.from("user_gamification").upsert({ user_id: user.id, xp: (await supabaseAdmin.from("user_gamification").select("xp").eq("user_id", user.id).maybeSingle()).data?.xp + 15 }, { onConflict: "user_id" }),
    ]);

    return { shared: true, xpAwarded: 15 } satisfies ShareAchievementResult;
  });
