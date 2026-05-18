-- 1) push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
CREATE INDEX IF NOT EXISTS push_subs_user_idx ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own push subs" ON public.push_subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own push subs" ON public.push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own push subs" ON public.push_subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own push subs" ON public.push_subscriptions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages push subs" ON public.push_subscriptions
  FOR ALL TO public USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 2) notification_preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY,
  new_order boolean NOT NULL DEFAULT true,
  low_stock boolean NOT NULL DEFAULT true,
  order_status boolean NOT NULL DEFAULT true,
  delivery_update boolean NOT NULL DEFAULT true,
  payment boolean NOT NULL DEFAULT true,
  sound_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notif prefs" ON public.notification_preferences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role reads notif prefs" ON public.notification_preferences
  FOR SELECT TO public USING (auth.role() = 'service_role');

-- 3) Trigger: when a notification is inserted, call the public push dispatcher
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.dispatch_push_for_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  base_url text := 'https://fennecly.lovable.app';
  secret text;
BEGIN
  -- Read CRON_SECRET from vault if available; otherwise skip silently.
  BEGIN
    SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    secret := NULL;
  END;

  PERFORM net.http_post(
    url := base_url || '/api/public/hooks/push-dispatch',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', COALESCE(secret, '')
    ),
    body := jsonb_build_object(
      'notification_id', NEW.id,
      'user_id', NEW.user_id,
      'title', NEW.title,
      'message', NEW.message,
      'type', NEW.type
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block the insert on push delivery
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dispatch_push_for_notification ON public.notifications;
CREATE TRIGGER trg_dispatch_push_for_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.dispatch_push_for_notification();