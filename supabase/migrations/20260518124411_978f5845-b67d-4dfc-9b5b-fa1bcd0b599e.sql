
-- ============ stores table ============
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'My Store',
  slug text UNIQUE,
  logo_url text,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  currency text NOT NULL DEFAULT 'DZD',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stores_owner ON public.stores(owner_id);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own stores" ON public.stores
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert own stores" ON public.stores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update own stores" ON public.stores
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners delete own stores" ON public.stores
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Public can view stores" ON public.stores
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER stores_set_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ profiles.current_store_id ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL;

-- ============ helper ============
CREATE OR REPLACE FUNCTION public.user_owns_store(_store_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = _store_id AND owner_id = auth.uid()
  )
$$;

-- ============ backfill default store per user ============
INSERT INTO public.stores (owner_id, name, slug, logo_url, description, category, currency, is_default)
SELECT
  p.id,
  COALESCE(NULLIF(ss.store_name, ''), 'My Store'),
  ss.slug,
  ss.logo_url,
  COALESCE(ss.tagline, ''),
  'general',
  COALESCE(ss.currency, 'DZD'),
  true
FROM public.profiles p
LEFT JOIN public.store_settings ss ON ss.user_id = p.id
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.stores (owner_id, name, currency, is_default)
SELECT p.id, 'My Store', 'DZD', true
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.owner_id = p.id);

UPDATE public.profiles p
SET current_store_id = s.id
FROM public.stores s
WHERE s.owner_id = p.id AND s.is_default = true AND p.current_store_id IS NULL;

-- ============ delivery_tariffs: rename legacy 'store_id' (owner uuid) -> 'owner_id' ============
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='delivery_tariffs'
             AND column_name='store_id') THEN
    EXECUTE 'ALTER TABLE public.delivery_tariffs RENAME COLUMN store_id TO owner_id';
  END IF;
END $$;

DROP POLICY IF EXISTS "Owners delete delivery tariffs" ON public.delivery_tariffs;
DROP POLICY IF EXISTS "Owners insert delivery tariffs" ON public.delivery_tariffs;
DROP POLICY IF EXISTS "Owners update delivery tariffs" ON public.delivery_tariffs;
CREATE POLICY "Owners delete delivery tariffs" ON public.delivery_tariffs
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "Owners insert delivery tariffs" ON public.delivery_tariffs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update delivery tariffs" ON public.delivery_tariffs
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ add store_id to owner-scoped tables ============
DO $$
DECLARE
  rec record;
  tables text[][] := ARRAY[
    ['store_settings','user_id'],
    ['products','user_id'],
    ['orders','store_owner_id'],
    ['delivery_tariffs','owner_id'],
    ['discount_codes','user_id'],
    ['ai_agent_settings','user_id'],
    ['chatbot_settings','user_id'],
    ['currency_settings','user_id'],
    ['analytics_integrations','user_id'],
    ['popups','user_id'],
    ['custom_domains','user_id'],
    ['abandoned_carts','store_owner_id'],
    ['contact_messages','store_owner_id'],
    ['installed_apps','user_id'],
    ['category_images','user_id']
  ];
  i int;
  tbl text;
  owner_col text;
BEGIN
  FOR i IN 1..array_length(tables,1) LOOP
    tbl := tables[i][1];
    owner_col := tables[i][2];
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE', tbl);
    EXECUTE format('UPDATE public.%I t SET store_id = s.id FROM public.stores s WHERE s.owner_id = t.%I AND s.is_default = true AND t.store_id IS NULL', tbl, owner_col);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_store_id ON public.%I(store_id)', tbl, tbl);
  END LOOP;
END $$;

-- shipments (if exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='shipments') THEN
    EXECUTE 'ALTER TABLE public.shipments ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE';
    EXECUTE 'UPDATE public.shipments sh SET store_id = o.store_id FROM public.orders o WHERE o.id = sh.order_id AND sh.store_id IS NULL';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_shipments_store_id ON public.shipments(store_id)';
  END IF;
END $$;
