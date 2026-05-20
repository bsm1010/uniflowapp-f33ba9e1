
CREATE TABLE IF NOT EXISTS public.builtin_app_edits (
  app_key TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  long_description TEXT,
  screenshots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.builtin_app_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read builtin app edits"
  ON public.builtin_app_edits FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert builtin app edits"
  ON public.builtin_app_edits FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update builtin app edits"
  ON public.builtin_app_edits FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete builtin app edits"
  ON public.builtin_app_edits FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
