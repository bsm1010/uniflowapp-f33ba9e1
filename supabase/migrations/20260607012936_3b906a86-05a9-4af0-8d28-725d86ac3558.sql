
-- developer_profiles: exclude stripe_connect_id from client reads
REVOKE ALL ON public.developer_profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, display_name, bio, website, avatar_url, created_at, updated_at)
  ON public.developer_profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.developer_profiles TO authenticated;
GRANT ALL ON public.developer_profiles TO service_role;

-- stores: exclude telegram_* from client reads (both anon and authenticated)
REVOKE ALL ON public.stores FROM anon, authenticated;
GRANT SELECT (id, owner_id, name, slug, logo_url, description, category, currency,
              is_default, is_active, tiktok_pixel_id, created_at, updated_at)
  ON public.stores TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;

-- team_members: exclude invite_token from client reads
REVOKE ALL ON public.team_members FROM anon, authenticated;
GRANT SELECT (id, owner_id, email, role, status, invited_at, accepted_at, created_at, updated_at)
  ON public.team_members TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

-- store_delivery_companies: exclude api_key, api_secret from client reads
REVOKE ALL ON public.store_delivery_companies FROM anon, authenticated;
GRANT SELECT (id, store_id, company_id, enabled, is_default, created_at, updated_at)
  ON public.store_delivery_companies TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.store_delivery_companies TO authenticated;
GRANT ALL ON public.store_delivery_companies TO service_role;

-- instagram_connections: exclude access_token, token_expires_at from client reads
REVOKE ALL ON public.instagram_connections FROM anon, authenticated;
GRANT SELECT (id, user_id, instagram_user_id, instagram_username, page_id, page_name,
              status, last_synced_at, profile_picture_url, created_at, updated_at)
  ON public.instagram_connections TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instagram_connections TO authenticated;
GRANT ALL ON public.instagram_connections TO service_role;

-- cookie_consents: drop unrestricted anon INSERT (writes now exclusively server-side)
DROP POLICY IF EXISTS cc_insert ON public.cookie_consents;
