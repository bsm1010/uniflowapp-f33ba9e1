
-- 1. deletion_requests: require existing store
DROP POLICY IF EXISTS "dr_insert" ON public.deletion_requests;
CREATE POLICY "dr_insert" ON public.deletion_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = deletion_requests.store_id));

-- 2. developer_profiles: stop exposing stripe_connect_id to anon/authenticated SELECT
REVOKE SELECT ON public.developer_profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, display_name, bio, website, avatar_url, created_at, updated_at)
  ON public.developer_profiles TO anon, authenticated;
GRANT UPDATE, INSERT, DELETE ON public.developer_profiles TO authenticated;

-- 3. ig_messages: verify conversation ownership on INSERT
DROP POLICY IF EXISTS "Service role inserts ig messages" ON public.ig_messages;
CREATE POLICY "Insert ig messages with conversation ownership" ON public.ig_messages
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM public.ig_conversations c
        WHERE c.id = ig_messages.conversation_id AND c.user_id = auth.uid()
      )
    )
  );

-- 4. stores: hide telegram_link_token, telegram_link_token_expires_at, telegram_chat_id from anon
REVOKE SELECT ON public.stores FROM anon;
GRANT SELECT (id, owner_id, name, slug, logo_url, description, category, currency,
              is_default, is_active, tiktok_pixel_id, created_at, updated_at)
  ON public.stores TO anon;
