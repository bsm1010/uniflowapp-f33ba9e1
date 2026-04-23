-- 1. delivery_companies
CREATE TABLE public.delivery_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  api_key text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active delivery companies"
  ON public.delivery_companies FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage delivery companies"
  ON public.delivery_companies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_delivery_companies_updated_at
  BEFORE UPDATE ON public.delivery_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Add company_id to existing delivery_tariffs
ALTER TABLE public.delivery_tariffs
  ADD COLUMN company_id uuid REFERENCES public.delivery_companies(id) ON DELETE SET NULL;

CREATE INDEX idx_delivery_tariffs_company_id ON public.delivery_tariffs(company_id);

-- 3. shipments
CREATE TABLE public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL,
  order_id uuid NOT NULL,
  company_id uuid REFERENCES public.delivery_companies(id) ON DELETE SET NULL,
  tracking_number text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_shipments_store_id ON public.shipments(store_id);
CREATE INDEX idx_shipments_order_id ON public.shipments(order_id);
CREATE INDEX idx_shipments_company_id ON public.shipments(company_id);

ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own shipments"
  ON public.shipments FOR SELECT
  TO authenticated
  USING (auth.uid() = store_id);

CREATE POLICY "Owners insert own shipments"
  ON public.shipments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = store_id);

CREATE POLICY "Owners update own shipments"
  ON public.shipments FOR UPDATE
  TO authenticated
  USING (auth.uid() = store_id)
  WITH CHECK (auth.uid() = store_id);

CREATE POLICY "Owners delete own shipments"
  ON public.shipments FOR DELETE
  TO authenticated
  USING (auth.uid() = store_id);

CREATE POLICY "Admins manage all shipments"
  ON public.shipments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();