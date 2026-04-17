-- Add trial fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS trial_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial';

-- Backfill existing users
UPDATE public.profiles
SET
  trial_start_date = COALESCE(trial_start_date, created_at),
  trial_end_date = COALESCE(trial_end_date, created_at + interval '7 days'),
  subscription_status = CASE
    WHEN subscription_status IS NULL OR subscription_status = 'trial' THEN
      CASE WHEN (COALESCE(trial_end_date, created_at + interval '7 days')) < now() THEN 'expired' ELSE 'trial' END
    ELSE subscription_status
  END
WHERE trial_start_date IS NULL OR trial_end_date IS NULL;

-- Update the new-user trigger to set trial fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, name, email, trial_start_date, trial_end_date, subscription_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    now(),
    now() + interval '7 days',
    'trial'
  );
  return new;
end;
$function$;