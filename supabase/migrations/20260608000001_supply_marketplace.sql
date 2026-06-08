-- ============================================================
-- Supply Marketplace (سوق التوريد)
-- Admin-managed catalog that store owners can browse, import to store, or purchase
-- ============================================================

CREATE TABLE IF NOT EXISTS public.supply_marketplace_products (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  description         text,
  images              text[] NOT NULL DEFAULT '{}',
  price               numeric NOT NULL CHECK (price >= 0),
  suggested_price     numeric NOT NULL CHECK (suggested_price >= 0),
  category            text,
  stock               integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  supplier_name       text,
  status              text NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive')),
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_marketplace_products_category
  ON public.supply_marketplace_products (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_supply_marketplace_products_status
  ON public.supply_marketplace_products (status);
CREATE INDEX IF NOT EXISTS idx_supply_marketplace_products_created_by
  ON public.supply_marketplace_products (created_by);

ALTER TABLE public.supply_marketplace_products ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active products
DROP POLICY IF EXISTS "Users view active supply products" ON public.supply_marketplace_products;
CREATE POLICY "Users view active supply products"
  ON public.supply_marketplace_products FOR SELECT TO authenticated
  USING (status = 'active');

-- Admins (service_role) can do everything
DROP POLICY IF EXISTS "Admins manage supply products" ON public.supply_marketplace_products;
CREATE POLICY "Admins manage supply products"
  ON public.supply_marketplace_products FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.supply_marketplace_products FROM anon, authenticated;
GRANT SELECT ON public.supply_marketplace_products TO authenticated;
GRANT ALL ON public.supply_marketplace_products TO service_role;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_supply_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supply_marketplace_updated_at ON public.supply_marketplace_products;
CREATE TRIGGER trg_supply_marketplace_updated_at
  BEFORE UPDATE ON public.supply_marketplace_products
  FOR EACH ROW EXECUTE FUNCTION public.handle_supply_updated_at();

-- ============================================================
-- Storage bucket for supply product images
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'supply-product-images',
  'supply-product-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg','image/png','image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
DROP POLICY IF EXISTS "Public read supply images" ON storage.objects;
CREATE POLICY "Public read supply images"
  ON storage.objects FOR SELECT USING (bucket_id = 'supply-product-images');

DROP POLICY IF EXISTS "Admin upload supply images" ON storage.objects;
CREATE POLICY "Admin upload supply images"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'supply-product-images');

DROP POLICY IF EXISTS "Admin update supply images" ON storage.objects;
CREATE POLICY "Admin update supply images"
  ON storage.objects FOR UPDATE TO service_role
  USING (bucket_id = 'supply-product-images');

DROP POLICY IF EXISTS "Admin delete supply images" ON storage.objects;
CREATE POLICY "Admin delete supply images"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'supply-product-images');