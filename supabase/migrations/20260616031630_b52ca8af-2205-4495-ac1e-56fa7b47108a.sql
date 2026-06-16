-- developer_profiles.stripe_connect_id
REVOKE SELECT ON public.developer_profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, display_name, bio, website, avatar_url, created_at, updated_at)
  ON public.developer_profiles TO anon, authenticated;

-- stores telegram fields
REVOKE SELECT ON public.stores FROM anon, authenticated;
GRANT SELECT (
  id, owner_id, name, slug, logo_url, description, category,
  currency, is_default, is_active, tiktok_pixel_id, created_at, updated_at
) ON public.stores TO anon, authenticated;

-- team_members.invite_token
REVOKE SELECT ON public.team_members FROM authenticated;
GRANT SELECT (
  id, owner_id, email, role, status, invited_at, accepted_at, created_at, updated_at
) ON public.team_members TO authenticated;

-- ig_messages: drop misleading service_role check in INSERT policy
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='ig_messages' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.ig_messages', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Owners can insert their ig messages"
ON public.ig_messages FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ig_conversations c
    WHERE c.id = ig_messages.conversation_id
      AND c.user_id = auth.uid()
  )
);