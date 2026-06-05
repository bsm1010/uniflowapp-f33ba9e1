
DROP POLICY IF EXISTS "Owners insert own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners update own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners delete own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners view own store delivery companies" ON public.store_delivery_companies;

CREATE POLICY "Owners view own store delivery companies"
  ON public.store_delivery_companies FOR SELECT TO authenticated
  USING (
    store_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid())
  );

CREATE POLICY "Owners insert own store delivery companies"
  ON public.store_delivery_companies FOR INSERT TO authenticated
  WITH CHECK (
    store_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid())
  );

CREATE POLICY "Owners update own store delivery companies"
  ON public.store_delivery_companies FOR UPDATE TO authenticated
  USING (
    store_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    store_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid())
  );

CREATE POLICY "Owners delete own store delivery companies"
  ON public.store_delivery_companies FOR DELETE TO authenticated
  USING (
    store_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid())
  );
