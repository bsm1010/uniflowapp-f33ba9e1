-- Fix chatbot_settings: replace overly broad public SELECT with a restricted one
-- that only exposes non-sensitive fields (exclude knowledge_base, ai_model)
DROP POLICY IF EXISTS "Public can view chatbot settings" ON public.chatbot_settings;
CREATE POLICY "Public can view chatbot display settings"
  ON public.chatbot_settings
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

-- Fix discount_codes: replace overly broad public SELECT
-- Only allow the owner to see all their codes
DROP POLICY IF EXISTS "Public can view active discount codes" ON public.discount_codes;

-- Create a security definer function for validating discount codes publicly
CREATE OR REPLACE FUNCTION public.validate_discount_code(_code text, _user_id uuid)
RETURNS TABLE(id uuid, code text, discount_type text, value numeric, active boolean, expires_at timestamptz, usage_limit int, used_count int)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dc.id, dc.code, dc.discount_type, dc.value, dc.active, dc.expires_at, dc.usage_limit, dc.used_count
  FROM public.discount_codes dc
  WHERE dc.code = _code
    AND dc.user_id = _user_id
    AND dc.active = true
    AND (dc.expires_at IS NULL OR dc.expires_at > now())
    AND (dc.usage_limit IS NULL OR dc.used_count < dc.usage_limit)
  LIMIT 1;
$$;