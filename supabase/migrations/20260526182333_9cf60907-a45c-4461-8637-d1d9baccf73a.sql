
-- Hide merchant owner UUIDs from anonymous storefront visitors.
-- Authenticated users keep full access (governed by RLS policies).

-- stores: revoke anon SELECT, then grant only public-safe columns to anon
REVOKE SELECT ON public.stores FROM anon;
GRANT SELECT (id, name, slug, logo_url, description, category, currency, is_default, created_at, updated_at, is_active, tiktok_pixel_id)
  ON public.stores TO anon;

-- delivery_tariffs: revoke anon SELECT, then grant only public-safe columns
REVOKE SELECT ON public.delivery_tariffs FROM anon;
GRANT SELECT (id, wilaya, city, delivery_type, price, company_id, created_at, updated_at)
  ON public.delivery_tariffs TO anon;
