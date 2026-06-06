-- Per-user payment preferences (replaces localStorage `payments:${user_id}`)
CREATE TABLE IF NOT EXISTS public.payment_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'DZD',
  payout_email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_settings_currency_format CHECK (currency ~ '^[A-Z]{3}$')
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

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
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment settings"
  ON public.payment_settings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER payment_settings_set_updated_at
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
