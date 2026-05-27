
-- Lock down sensitive columns from anon role via column-level grants

-- stores: hide telegram_link_token, telegram_link_token_expires_at, telegram_chat_id from anon
REVOKE SELECT ON public.stores FROM anon;
GRANT SELECT (
  id, owner_id, name, slug, logo_url, description, category, currency,
  is_default, created_at, updated_at, is_active, tiktok_pixel_id
) ON public.stores TO anon;
-- (owner_id already public-safe per existing convention; keeping behavior unchanged for non-sensitive cols)

-- Also restrict authenticated to non-sensitive cols at the column-grant level;
-- owners still read full row via service role / server functions. To keep current
-- app behavior for authenticated users querying their own stores via RLS, we keep
-- full SELECT for authenticated and only protect anon for the telegram fields.
-- (authenticated already filtered by RLS to owner)

-- developer_profiles: hide stripe_connect_id from anon and authenticated non-owners
REVOKE SELECT ON public.developer_profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, display_name, bio, website, avatar_url, created_at, updated_at
) ON public.developer_profiles TO anon, authenticated;
-- Owners need stripe_connect_id; grant full SELECT back via separate policy path:
-- The "Users manage own developer profile" ALL policy already permits owners,
-- but PostgREST honors column grants. Grant the sensitive column to authenticated
-- so the row-level "owner" policy can still expose it; non-owner authenticated
-- users are blocked at the row level by... wait — current SELECT policy is public
-- (USING true). So column grant is what gates anon/non-owner. Keep stripe_connect_id
-- ungranted to anon; grant to authenticated only (RLS still returns the row for
-- everyone, but we accept that authenticated users can see other devs' connect IDs
-- only if we grant it). Safer: do NOT grant stripe_connect_id to authenticated either.
-- Owners read it via service role server functions or a dedicated owner-only view.

-- product_reviews: hide customer_email from anon
REVOKE SELECT ON public.product_reviews FROM anon;
GRANT SELECT (
  id, store_owner_id, product_id, customer_name, rating, comment, status, reply,
  created_at, updated_at
) ON public.product_reviews TO anon;
-- authenticated owners still see full row (RLS scopes their own data).
