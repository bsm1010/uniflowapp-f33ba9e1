
DROP POLICY IF EXISTS "Users read own gamification" ON public.user_gamification;
DROP POLICY IF EXISTS "Users insert own gamification" ON public.user_gamification;
CREATE POLICY "Users manage own gamification" ON public.user_gamification
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own xp events" ON public.xp_events;
DROP POLICY IF EXISTS "Users insert own xp events" ON public.xp_events;
CREATE POLICY "Users manage own xp events" ON public.xp_events
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users read own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Users insert own achievements" ON public.user_achievements;
CREATE POLICY "Users manage own achievements" ON public.user_achievements
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
