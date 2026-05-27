
-- Dynamic Airtable-like database system
CREATE TABLE public.db_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.db_tables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view tables" ON public.db_tables FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert tables" ON public.db_tables FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update tables" ON public.db_tables FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete tables" ON public.db_tables FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_db_tables_updated_at BEFORE UPDATE ON public.db_tables
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Fields (columns)
CREATE TABLE public.db_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.db_tables(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text','number','date','boolean','select','multi_select','image','relation')),
  options jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_db_fields_table ON public.db_fields(table_id);
ALTER TABLE public.db_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view fields" ON public.db_fields FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert fields" ON public.db_fields FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update fields" ON public.db_fields FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete fields" ON public.db_fields FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_db_fields_updated_at BEFORE UPDATE ON public.db_fields
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Records (rows) - data is a jsonb keyed by field_id
CREATE TABLE public.db_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id uuid NOT NULL REFERENCES public.db_tables(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_db_records_table ON public.db_records(table_id);
ALTER TABLE public.db_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view records" ON public.db_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert records" ON public.db_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update records" ON public.db_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete records" ON public.db_records FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_db_records_updated_at BEFORE UPDATE ON public.db_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
