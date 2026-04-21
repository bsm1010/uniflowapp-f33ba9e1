CREATE TABLE public.db_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  table_id UUID NOT NULL REFERENCES public.db_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled automation',
  enabled BOOLEAN NOT NULL DEFAULT true,
  trigger TEXT NOT NULL DEFAULT 'record_created',
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.db_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view automations" ON public.db_automations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert automations" ON public.db_automations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update automations" ON public.db_automations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete automations" ON public.db_automations
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER db_automations_updated_at
  BEFORE UPDATE ON public.db_automations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_db_automations_table ON public.db_automations(table_id);