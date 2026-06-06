
-- ============================================================
-- developer_profiles: hide stripe_connect_id from clients
-- ============================================================
DROP POLICY IF EXISTS "Anon can view public developer profile fields" ON public.developer_profiles;
DROP POLICY IF EXISTS "Authenticated can view developer profiles" ON public.developer_profiles;

CREATE POLICY "Public can view developer profiles"
  ON public.developer_profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

REVOKE SELECT ON public.developer_profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, display_name, bio, website, avatar_url, created_at, updated_at)
  ON public.developer_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.developer_profiles TO authenticated;
GRANT ALL ON public.developer_profiles TO service_role;

-- ============================================================
-- stores: hide telegram fields from public SELECT
-- ============================================================
REVOKE SELECT ON public.stores FROM anon, authenticated;
GRANT SELECT (id, owner_id, name, slug, logo_url, description, category, currency, is_default, is_active, tiktok_pixel_id, created_at, updated_at)
  ON public.stores TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

-- ============================================================
-- team_members: hide invite_token from owner reads
-- ============================================================
-- Replace the "ALL" combined policy with per-action policies so we can scope SELECT columns
DROP POLICY IF EXISTS "Owners manage team members" ON public.team_members;

CREATE POLICY "Owners select team members"
  ON public.team_members FOR SELECT TO authenticated
  USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert team members"
  ON public.team_members FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update team members"
  ON public.team_members FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete team members"
  ON public.team_members FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.team_members FROM anon, authenticated;
GRANT SELECT (id, owner_id, email, role, status, invited_at, accepted_at, created_at, updated_at)
  ON public.team_members TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

-- ============================================================
-- chatbot_conversations: require service_role inserts (no client INSERTs exist)
-- ============================================================
DROP POLICY IF EXISTS "Anyone can create chatbot convo" ON public.chatbot_conversations;
-- No replacement policy: service_role bypasses RLS, blocking anon/authenticated inserts.

-- ============================================================
-- consent_audit_log: require service_role inserts
-- ============================================================
DROP POLICY IF EXISTS cal_insert ON public.consent_audit_log;

-- ============================================================
-- cookie_consents: restrict updates to service_role (no visitor session to verify)
-- ============================================================
DROP POLICY IF EXISTS cc_update ON public.cookie_consents;
