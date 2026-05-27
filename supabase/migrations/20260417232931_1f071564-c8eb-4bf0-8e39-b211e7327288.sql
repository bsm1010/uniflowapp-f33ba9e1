ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_type text,
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamp with time zone;