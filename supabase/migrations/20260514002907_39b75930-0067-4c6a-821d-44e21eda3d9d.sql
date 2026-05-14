-- 1. Sections JSON on store_settings (new builder source of truth)
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS sections jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 2. Personal section templates library
CREATE TABLE IF NOT EXISTS public.section_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'custom',
  block_key text NOT NULL,
  props jsonb NOT NULL DEFAULT '{}'::jsonb,
  style_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.section_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view section templates"
  ON public.section_templates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners insert section templates"
  ON public.section_templates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners update section templates"
  ON public.section_templates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owners delete section templates"
  ON public.section_templates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER trg_section_templates_updated
  BEFORE UPDATE ON public.section_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_section_templates_user ON public.section_templates(user_id);