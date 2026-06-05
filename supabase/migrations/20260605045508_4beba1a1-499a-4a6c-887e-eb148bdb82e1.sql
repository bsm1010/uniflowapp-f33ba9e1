
-- 1) consent_audit_log: require existing store
DROP POLICY IF EXISTS "cal_insert" ON public.consent_audit_log;
CREATE POLICY "cal_insert" ON public.consent_audit_log
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id));

-- 2) cookie_consents: tighten insert+update
DROP POLICY IF EXISTS "cc_insert" ON public.cookie_consents;
CREATE POLICY "cc_insert" ON public.cookie_consents
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id));

DROP POLICY IF EXISTS "cc_update" ON public.cookie_consents;
CREATE POLICY "cc_update" ON public.cookie_consents
  FOR UPDATE TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id));

-- 3) data_export_requests: require existing store
DROP POLICY IF EXISTS "der_insert" ON public.data_export_requests;
CREATE POLICY "der_insert" ON public.data_export_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id));

-- 4) developer_profiles: hide stripe_connect_id
REVOKE SELECT ON public.developer_profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, display_name, bio, website, avatar_url, created_at, updated_at)
  ON public.developer_profiles TO anon, authenticated;

-- 5) instagram_connections: hide access_token
REVOKE SELECT ON public.instagram_connections FROM authenticated;
GRANT SELECT (id, user_id, instagram_user_id, instagram_username, page_id, page_name,
              token_expires_at, status, last_synced_at, profile_picture_url, created_at, updated_at)
  ON public.instagram_connections TO authenticated;

-- 6) store_delivery_companies: hide api_key + api_secret
REVOKE SELECT ON public.store_delivery_companies FROM authenticated;
GRANT SELECT (id, store_id, company_id, enabled, is_default, created_at, updated_at)
  ON public.store_delivery_companies TO authenticated;

-- 7) team_members: hide invite_token
REVOKE SELECT ON public.team_members FROM authenticated;
GRANT SELECT (id, owner_id, email, role, status, invited_at, accepted_at, created_at, updated_at)
  ON public.team_members TO authenticated;

-- 8) Gamification: no UPDATE/DELETE for authenticated
DROP POLICY IF EXISTS "Users manage own gamification" ON public.user_gamification;
CREATE POLICY "Users read own gamification" ON public.user_gamification
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own gamification" ON public.user_gamification
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own xp events" ON public.xp_events;
CREATE POLICY "Users read own xp events" ON public.xp_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own xp events" ON public.xp_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage own achievements" ON public.user_achievements;
CREATE POLICY "Users read own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
