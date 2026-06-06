CREATE TABLE IF NOT EXISTS public.payment_settings (
  user_id uuid PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'DZD',
  payout_email text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_settings_currency_format CHECK (currency ~ '^[A-Z]{3}$')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Users can insert their own payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Users can update their own payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Users can delete their own payment settings" ON public.payment_settings;

CREATE POLICY "Users can view their own payment settings"
  ON public.payment_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment settings"
  ON public.payment_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment settings"
  ON public.payment_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment settings"
  ON public.payment_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS payment_settings_set_updated_at ON public.payment_settings;
CREATE TRIGGER payment_settings_set_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();