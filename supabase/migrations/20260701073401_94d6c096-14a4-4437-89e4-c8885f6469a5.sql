-- SEC-PII: product_reviews_customer_email_public
-- Revoke SELECT on the customer_email PII column from client roles.
-- Server-side code using service_role (supabaseAdmin) retains full access.

REVOKE SELECT (customer_email) ON public.product_reviews FROM anon;
REVOKE SELECT (customer_email) ON public.product_reviews FROM authenticated;

-- Explicit column grants for safe, non-PII fields so existing review listings continue to work.
GRANT SELECT (
  id,
  store_owner_id,
  product_id,
  customer_name,
  rating,
  comment,
  status,
  reply,
  created_at,
  updated_at
) ON public.product_reviews TO anon, authenticated;

COMMENT ON COLUMN public.product_reviews.customer_email IS
  'PII. Revoked from anon/authenticated at column level; readable only via service_role.';