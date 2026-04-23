-- Restrictive policy: applies AND-wise on top of permissive policies.
-- Ensures only existing admins can ever write to user_roles, regardless of any other permissive policy.
CREATE POLICY "Only admins can write roles (restrictive)"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));