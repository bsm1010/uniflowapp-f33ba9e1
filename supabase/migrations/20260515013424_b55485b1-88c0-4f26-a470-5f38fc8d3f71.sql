
-- 1. contact_messages: validate store_owner_id matches an actual store
DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;
CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_settings ss
    WHERE ss.user_id = contact_messages.store_owner_id
  )
);

-- 2. chatbot_conversations: validate store_owner_id + store_slug match
DROP POLICY IF EXISTS "Anyone can create chatbot convo" ON public.chatbot_conversations;
CREATE POLICY "Anyone can create chatbot convo"
ON public.chatbot_conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_settings ss
    WHERE ss.user_id = chatbot_conversations.store_owner_id
      AND ss.slug = chatbot_conversations.store_slug
  )
);

-- 3. profiles: restrict owner SELECT policy to authenticated role only
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 4. delivery_companies: drop api_key column (credentials live in store_delivery_companies)
ALTER TABLE public.delivery_companies DROP COLUMN IF EXISTS api_key;
