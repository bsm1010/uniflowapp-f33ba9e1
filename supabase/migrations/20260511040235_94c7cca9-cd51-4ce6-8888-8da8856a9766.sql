
-- 1) Remove over-permissive public SELECT on chatbot_settings (knowledge_base leaked).
-- Public chatbot replies go through server-side admin client, so no public read is needed.
DROP POLICY IF EXISTS "Public can view chatbot display settings" ON public.chatbot_settings;

-- 2) Lock down SECURITY DEFINER functions: revoke EXECUTE from anon and authenticated
--    where appropriate. Keep validate_discount_code callable (anon storefront checkout).
REVOKE EXECUTE ON FUNCTION public.apply_referral_bonus(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.admin_set_plan(uuid, text, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, integer, text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.consume_credits(integer, text, jsonb) FROM anon, public;

-- 3) Set immutable search_path on the queue helper functions (linter: function_search_path_mutable)
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
