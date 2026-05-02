
-- 1. Fix apply_referral_bonus: add auth checks and verify referral relationship
CREATE OR REPLACE FUNCTION public.apply_referral_bonus(_referrer_id uuid, _referee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only callable internally or by service role; block direct RPC from regular users
  IF auth.uid() IS NOT NULL AND auth.uid() <> _referrer_id AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Verify the referee was actually referred by this referrer
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _referee_id AND referred_by = _referrer_id
  ) THEN
    RAISE EXCEPTION 'Invalid referral relationship';
  END IF;

  -- Prevent duplicate bonuses
  IF EXISTS (
    SELECT 1 FROM public.referrals
    WHERE referrer_id = _referrer_id AND referee_id = _referee_id
  ) THEN
    RETURN; -- Already applied
  END IF;

  -- Award bonus
  UPDATE public.profiles SET credits = credits + 20 WHERE id = _referrer_id;
  INSERT INTO public.referrals (referrer_id, referee_id) VALUES (_referrer_id, _referee_id);
  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (_referrer_id, 20, 'referral_bonus', jsonb_build_object('referee_id', _referee_id));
END;
$$;

-- 2. Replace overly permissive orders INSERT policy with service-role only
DROP POLICY IF EXISTS "Anyone can place an order" ON public.orders;
CREATE POLICY "Service role can insert orders"
  ON public.orders
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- 3. Replace overly permissive order_items INSERT policy with service-role only
DROP POLICY IF EXISTS "Anyone can insert order items" ON public.order_items;
CREATE POLICY "Service role can insert order items"
  ON public.order_items
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- 4. Tighten shipments INSERT to service role (server function creates them)
DROP POLICY IF EXISTS "Owners insert own shipments" ON public.shipments;
CREATE POLICY "Service role can insert shipments"
  ON public.shipments
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');
