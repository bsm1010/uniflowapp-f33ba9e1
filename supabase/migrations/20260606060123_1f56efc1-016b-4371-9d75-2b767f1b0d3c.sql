
-- Lock down gamification tables: only service_role can write; authenticated users can only read their own rows.

DROP POLICY IF EXISTS "Users manage own gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "Users manage own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users manage own unlocks" ON public.user_unlocks;
DROP POLICY IF EXISTS "Users manage own xp events" ON public.xp_events;

-- SELECT-only policies for authenticated users on their own rows
CREATE POLICY "Users view own gamification" ON public.user_gamification
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users view own unlocks" ON public.user_unlocks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users view own xp events" ON public.xp_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Revoke write privileges from authenticated; service_role bypasses RLS so writes still work server-side.
REVOKE INSERT, UPDATE, DELETE ON public.user_gamification FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_achievements FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.user_unlocks FROM authenticated, anon;
REVOKE INSERT, UPDATE, DELETE ON public.xp_events FROM authenticated, anon;

GRANT ALL ON public.user_gamification TO service_role;
GRANT ALL ON public.user_achievements TO service_role;
GRANT ALL ON public.user_unlocks TO service_role;
GRANT ALL ON public.xp_events TO service_role;
