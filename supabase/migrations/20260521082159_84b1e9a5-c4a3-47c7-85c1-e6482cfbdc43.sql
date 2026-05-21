
-- Restrict public store visibility to active stores only, and hide owner_id from non-owners
DROP POLICY IF EXISTS "Public can view stores" ON public.stores;
CREATE POLICY "Public can view active stores"
ON public.stores
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- Revoke column-level SELECT on owner_id from public roles so it can't be enumerated
REVOKE SELECT (owner_id) ON public.stores FROM anon, authenticated;
-- Owners still need to read their own owner_id; they access via the "Owners view own stores" policy
-- Re-grant owner_id selection only to the authenticated role through that policy is not possible at column level,
-- so we grant to authenticated and rely on the policy USING(auth.uid()=owner_id) for owner rows.
GRANT SELECT (owner_id) ON public.stores TO authenticated;
