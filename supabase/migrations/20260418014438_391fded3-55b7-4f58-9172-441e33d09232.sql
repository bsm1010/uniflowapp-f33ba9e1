ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_map_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_form_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS contact_intro text NOT NULL DEFAULT 'Have a question? We''d love to hear from you.';

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL,
  store_slug text NOT NULL,
  sender_name text NOT NULL,
  sender_email text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a contact message"
  ON public.contact_messages FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Store owners can view their contact messages"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can update their contact messages"
  ON public.contact_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can delete their contact messages"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = store_owner_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_owner ON public.contact_messages (store_owner_id, created_at DESC);