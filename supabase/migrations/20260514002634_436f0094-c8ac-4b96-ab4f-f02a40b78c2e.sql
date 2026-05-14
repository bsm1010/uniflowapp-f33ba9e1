-- Tighten abandoned_carts INSERT policy: ensure store_owner_id matches the
-- real owner of the supplied store_slug, preventing arbitrary spam injection.
DROP POLICY IF EXISTS "Anyone can log abandoned cart" ON public.abandoned_carts;

CREATE POLICY "Anyone can log abandoned cart"
ON public.abandoned_carts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.store_settings ss
    WHERE ss.slug = abandoned_carts.store_slug
      AND ss.user_id = abandoned_carts.store_owner_id
  )
);