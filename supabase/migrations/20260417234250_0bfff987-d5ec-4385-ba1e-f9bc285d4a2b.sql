CREATE OR REPLACE FUNCTION public.notify_payment_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  submitter_name text;
BEGIN
  -- Notify the user who submitted
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Payment under review',
    'Your payment proof has been submitted and is awaiting admin approval.',
    'info'
  );

  -- Look up submitter name for the admin notification
  SELECT COALESCE(NULLIF(name, ''), email, 'A user')
    INTO submitter_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Notify every admin
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT
    ur.user_id,
    'New payment submission',
    submitter_name || ' submitted a ' || NEW.plan || ' payment of ' || NEW.amount || ' DZD for review.',
    'info'
  FROM public.user_roles ur
  WHERE ur.role = 'admin';

  RETURN NEW;
END;
$function$;