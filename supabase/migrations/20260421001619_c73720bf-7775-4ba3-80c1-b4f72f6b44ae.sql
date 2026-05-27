-- Remove the blanket public read policy that exposed all products across tenants
DROP POLICY IF EXISTS "Public can view products" ON public.products;

-- Storefront pages query products by store_owner_id (which equals products.user_id),
-- so anonymous visitors still need read access — but the existing owner-scoped
-- SELECT policy ("Users can view their own products") covers authenticated owners.
-- We re-add a public SELECT policy for anon visitors only, so authenticated dashboard
-- queries are NOT widened beyond the owner-scoped policy.
CREATE POLICY "Anonymous visitors can view products"
ON public.products
FOR SELECT
TO anon
USING (true);