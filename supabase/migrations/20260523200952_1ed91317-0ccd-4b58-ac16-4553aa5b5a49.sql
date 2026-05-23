
DROP POLICY IF EXISTS "Anonymous visitors can view products" ON public.products;
CREATE POLICY "Anonymous visitors can view published products"
  ON public.products FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "Owners view own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners insert own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners update own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners delete own store delivery companies" ON public.store_delivery_companies;

CREATE POLICY "Owners view own store delivery companies"
  ON public.store_delivery_companies FOR SELECT
  TO authenticated
  USING (public.user_owns_store(store_id));

CREATE POLICY "Owners insert own store delivery companies"
  ON public.store_delivery_companies FOR INSERT
  TO authenticated
  WITH CHECK (public.user_owns_store(store_id));

CREATE POLICY "Owners update own store delivery companies"
  ON public.store_delivery_companies FOR UPDATE
  TO authenticated
  USING (public.user_owns_store(store_id))
  WITH CHECK (public.user_owns_store(store_id));

CREATE POLICY "Owners delete own store delivery companies"
  ON public.store_delivery_companies FOR DELETE
  TO authenticated
  USING (public.user_owns_store(store_id));

ALTER PUBLICATION supabase_realtime DROP TABLE public.store_settings;
