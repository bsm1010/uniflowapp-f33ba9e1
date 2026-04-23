-- Per-store config for each delivery company
CREATE TABLE public.store_delivery_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  company_id uuid NOT NULL REFERENCES public.delivery_companies(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  api_key text NOT NULL DEFAULT '',
  api_secret text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, company_id)
);

CREATE INDEX idx_store_delivery_companies_store ON public.store_delivery_companies(store_id);

-- Only one default per store
CREATE UNIQUE INDEX uniq_store_default_company
  ON public.store_delivery_companies(store_id)
  WHERE is_default = true;

ALTER TABLE public.store_delivery_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own store delivery companies"
  ON public.store_delivery_companies FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

CREATE POLICY "Owners insert own store delivery companies"
  ON public.store_delivery_companies FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = store_id);

CREATE POLICY "Owners update own store delivery companies"
  ON public.store_delivery_companies FOR UPDATE
  TO authenticated
  USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

CREATE POLICY "Owners delete own store delivery companies"
  ON public.store_delivery_companies FOR DELETE
  TO authenticated
  USING (auth.uid() = store_id);

CREATE TRIGGER set_store_delivery_companies_updated_at
  BEFORE UPDATE ON public.store_delivery_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed default companies
INSERT INTO public.delivery_companies (name, api_key, is_active)
VALUES ('Yalidine', '', true), ('ZR Express', '', true)
ON CONFLICT DO NOTHING;