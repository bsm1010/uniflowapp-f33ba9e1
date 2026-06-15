import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const Schema = z.object({
  accessToken: z.string().min(1),
});

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  isNewDay: boolean;
  xpAwarded: number;
};

export const processStreak = createServerFn({ method: "POST" })
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

    const today = new Date().toISOString().split("T")[0];

    const { data: gami } = await client
      .from("user_gamification")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!gami) {
      await supabaseAdmin.from("user_gamification").insert({
        user_id: user.id,
        xp: 10,
        level: 1,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
      });
      await supabaseAdmin.from("xp_events").insert({
        user_id: user.id,
        event_type: "daily_login",
        xp_amount: 10,
        metadata: { streak: 1 },
      });
      return {
        currentStreak: 1,
        longestStreak: 1,
        isNewDay: true,
        xpAwarded: 10,
      } satisfies StreakResult;
    }

    if (gami.last_active_date === today) {
      return {
        currentStreak: gami.current_streak,
        longestStreak: gami.longest_streak,
        isNewDay: false,
        xpAwarded: 0,
      } satisfies StreakResult;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    let newStreak = gami.current_streak || 0;
    if (gami.last_active_date === yesterdayStr) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const longestStreak = Math.max(gami.longest_streak || 0, newStreak);

    await Promise.all([
      supabaseAdmin.from("user_gamification").upsert(
        {
          user_id: user.id,
          xp: (gami.xp || 0) + 10,
          level: gami.level,
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_active_date: today,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      ),
      supabaseAdmin.from("xp_events").insert({
        user_id: user.id,
        event_type: "daily_login",
        xp_amount: 10,
        metadata: { streak: newStreak },
      }),
    ]);

    return {
      currentStreak: newStreak,
      longestStreak: longestStreak,
      isNewDay: true,
      xpAwarded: 10,
    } satisfies StreakResult;
  });
