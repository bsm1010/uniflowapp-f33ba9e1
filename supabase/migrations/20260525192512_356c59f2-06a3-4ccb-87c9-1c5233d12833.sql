
-- 1. currency_settings: restrict public SELECT to active stores
DROP POLICY IF EXISTS "Public can view currency settings" ON public.currency_settings;
CREATE POLICY "Public can view currency for active stores"
ON public.currency_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_id = currency_settings.user_id AND s.is_active = true
  )
);

-- 2. seo_settings: restrict public SELECT to active stores
DROP POLICY IF EXISTS "Public can view seo" ON public.seo_settings;
CREATE POLICY "Public can view seo for active stores"
ON public.seo_settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_id = seo_settings.user_id AND s.is_active = true
  )
);

-- 3. store_languages: restrict public SELECT to active stores
DROP POLICY IF EXISTS "Public can view languages" ON public.store_languages;
CREATE POLICY "Public can view languages for active stores"
ON public.store_languages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_id = store_languages.user_id AND s.is_active = true
  )
);

-- 4. translations: restrict public SELECT to active stores
DROP POLICY IF EXISTS "Public can view translations" ON public.translations;
CREATE POLICY "Public can view translations for active stores"
ON public.translations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.owner_id = translations.user_id AND s.is_active = true
  )
);

-- 5. store_settings: hide user_id column from anonymous visitors
REVOKE SELECT (user_id) ON public.store_settings FROM anon;

-- 6. product_reviews: hide customer_email column from anonymous visitors
REVOKE SELECT (customer_email) ON public.product_reviews FROM anon;

-- 7. shipments: fix broken owner policies (store_id is a store UUID, not auth.uid())
DROP POLICY IF EXISTS "Owners view own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Owners update own shipments" ON public.shipments;
DROP POLICY IF EXISTS "Owners delete own shipments" ON public.shipments;

CREATE POLICY "Owners view own shipments"
ON public.shipments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = shipments.store_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners update own shipments"
ON public.shipments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = shipments.store_id AND s.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners delete own shipments"
ON public.shipments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = shipments.store_id AND s.owner_id = auth.uid()
  )
);
