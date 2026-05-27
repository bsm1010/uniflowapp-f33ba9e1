
-- 1. New private table for sensitive contact fields
CREATE TABLE IF NOT EXISTS public.store_contact_info (
  user_id uuid PRIMARY KEY,
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Backfill from existing store_settings
INSERT INTO public.store_contact_info (user_id, contact_email, contact_phone)
SELECT user_id,
       COALESCE(contact_email, ''),
       COALESCE(contact_phone, '')
FROM public.store_settings
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 3. Enable RLS — owner-only access
ALTER TABLE public.store_contact_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own contact info"
ON public.store_contact_info
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Drop sensitive columns from publicly readable table
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS contact_email;
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS contact_phone;

-- 5. Updated-at trigger
CREATE TRIGGER store_contact_info_set_updated_at
BEFORE UPDATE ON public.store_contact_info
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Public-facing per-slug lookup (no enumeration possible)
CREATE OR REPLACE FUNCTION public.get_store_contact_info(_slug text)
RETURNS TABLE(contact_email text, contact_phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.contact_email, c.contact_phone
  FROM public.store_contact_info c
  JOIN public.store_settings s ON s.user_id = c.user_id
  WHERE s.slug = _slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_store_contact_info(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_store_contact_info(text) TO anon, authenticated;
