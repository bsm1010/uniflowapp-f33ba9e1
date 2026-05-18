DROP POLICY IF EXISTS "Anyone can submit a contact message" ON public.contact_messages;

CREATE POLICY "Anyone can submit a contact message"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.store_settings ss
    WHERE ss.user_id = contact_messages.store_owner_id
      AND ss.slug = contact_messages.store_slug
  )
);