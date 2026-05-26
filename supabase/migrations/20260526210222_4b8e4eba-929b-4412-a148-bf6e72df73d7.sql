
-- 1. Fix store_delivery_companies RLS to compare against stores.owner_id
DROP POLICY IF EXISTS "Owners view own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners insert own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners update own store delivery companies" ON public.store_delivery_companies;
DROP POLICY IF EXISTS "Owners delete own store delivery companies" ON public.store_delivery_companies;

CREATE POLICY "Owners view own store delivery companies"
ON public.store_delivery_companies FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Owners insert own store delivery companies"
ON public.store_delivery_companies FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Owners update own store delivery companies"
ON public.store_delivery_companies FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid()));

CREATE POLICY "Owners delete own store delivery companies"
ON public.store_delivery_companies FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_delivery_companies.store_id AND s.owner_id = auth.uid()));

-- 2. Add telegram link token columns to stores
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS telegram_link_token text,
  ADD COLUMN IF NOT EXISTS telegram_link_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_stores_telegram_link_token ON public.stores(telegram_link_token) WHERE telegram_link_token IS NOT NULL;

-- 3. Hide popups.user_id from anonymous role (column-level)
REVOKE SELECT ON public.popups FROM anon;
GRANT SELECT (
  id, title, content, cta_label, cta_url, trigger_type, trigger_value,
  background_color, text_color, active, created_at, updated_at, store_id
) ON public.popups TO anon;
