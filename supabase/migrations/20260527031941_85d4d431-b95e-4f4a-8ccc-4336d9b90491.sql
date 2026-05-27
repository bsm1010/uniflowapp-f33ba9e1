
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS shipping_wilaya text;

CREATE TABLE IF NOT EXISTS public.payment_auto_verify_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  pattern text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_auto_verify_settings TO authenticated;
GRANT ALL ON public.payment_auto_verify_settings TO service_role;

ALTER TABLE public.payment_auto_verify_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage auto-verify settings"
  ON public.payment_auto_verify_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
