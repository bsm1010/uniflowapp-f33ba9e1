CREATE TABLE IF NOT EXISTS public.builtin_app_edits (
  app_key TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  long_description TEXT,
  screenshots JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.builtin_app_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read builtin_app_edits"
  ON public.builtin_app_edits
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert builtin_app_edits"
  ON public.builtin_app_edits
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update builtin_app_edits"
  ON public.builtin_app_edits
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete builtin_app_edits"
  ON public.builtin_app_edits
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
