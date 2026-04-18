CREATE TABLE public.installed_apps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  app_key TEXT NOT NULL,
  installed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, app_key)
);

ALTER TABLE public.installed_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their installed apps"
ON public.installed_apps FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can install apps"
ON public.installed_apps FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can uninstall apps"
ON public.installed_apps FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_installed_apps_user ON public.installed_apps(user_id);