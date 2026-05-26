DROP POLICY IF EXISTS "Owners view own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners insert own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners update own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners delete own store delivery companies" ON public.store_delivery_companies;

CREATE POLICY "Owners view own store delivery companies"
ON public.store_delivery_companies FOR SELECT TO authenticated
USING (auth.uid() = store_id);

CREATE POLICY "Owners insert own store delivery companies"
ON public.store_delivery_companies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = store_id);

CREATE POLICY "Owners update own store delivery companies"
ON public.store_delivery_companies FOR UPDATE TO authenticated
USING (auth.uid() = store_id) WITH CHECK (auth.uid() = store_id);

CREATE POLICY "Owners delete own store delivery companies"
ON public.store_delivery_companies FOR DELETE TO authenticated
USING (auth.uid() = store_id);