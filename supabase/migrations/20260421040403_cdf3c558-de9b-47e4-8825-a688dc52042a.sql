
-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_renews_at timestamptz,
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);

-- 2. Credit transactions audit log
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all transactions"
  ON public.credit_transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. Referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referee_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "Admins view all referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code text;
  attempts int := 0;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE referral_code = new_code) THEN
      RETURN new_code;
    END IF;
    attempts := attempts + 1;
    IF attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique referral code';
    END IF;
  END LOOP;
END;
$$;

-- 5. Consume credits atomically (returns false if insufficient)
CREATE OR REPLACE FUNCTION public.consume_credits(_amount integer, _reason text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_balance integer;
  current_plan text;
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT credits, plan INTO current_balance, current_plan
  FROM public.profiles WHERE id = uid FOR UPDATE;

  -- Business plan = unlimited, just log
  IF current_plan = 'business' THEN
    INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
    VALUES (uid, 0, _reason, _metadata || jsonb_build_object('unlimited', true));
    RETURN true;
  END IF;

  IF current_balance < _amount THEN
    RETURN false;
  END IF;

  UPDATE public.profiles SET credits = credits - _amount WHERE id = uid;
  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (uid, -_amount, _reason, _metadata);

  RETURN true;
END;
$$;

-- 6. Grant credits (admin or system use)
CREATE OR REPLACE FUNCTION public.grant_credits(_user_id uuid, _amount integer, _reason text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins or self-system calls (via other SECURITY DEFINER functions) can grant
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') AND auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles SET credits = credits + _amount WHERE id = _user_id;
  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (_user_id, _amount, _reason, _metadata);
END;
$$;

-- 7. Admin: set plan + grant monthly credits
CREATE OR REPLACE FUNCTION public.admin_set_plan(_user_id uuid, _plan text, _credits integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
  SET plan = _plan,
      credits = credits + _credits,
      plan_renews_at = CASE WHEN _plan = 'free' THEN NULL ELSE now() + interval '30 days' END
  WHERE id = _user_id;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
  VALUES (_user_id, _credits, 'plan_change', jsonb_build_object('plan', _plan));
END;
$$;

-- 8. Apply referral bonus
CREATE OR REPLACE FUNCTION public.apply_referral_bonus(_referrer_id uuid, _referee_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.referrals (referrer_id, referee_id, reward_granted)
  VALUES (_referrer_id, _referee_id, true)
  ON CONFLICT (referee_id) DO NOTHING;

  UPDATE public.profiles SET credits = credits + 20 WHERE id = _referrer_id;
  UPDATE public.profiles SET credits = credits + 10 WHERE id = _referee_id;

  INSERT INTO public.credit_transactions (user_id, amount, reason, metadata) VALUES
    (_referrer_id, 20, 'referral_bonus', jsonb_build_object('referee_id', _referee_id)),
    (_referee_id, 10, 'referral_signup_bonus', jsonb_build_object('referrer_id', _referrer_id));
END;
$$;

-- 9. Replace handle_new_user to include credits + referral
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_code text;
  ref_user_id uuid;
  new_code text;
BEGIN
  new_code := public.generate_referral_code();

  -- Read referral code from signup metadata
  ref_code := new.raw_user_meta_data ->> 'referral_code';
  IF ref_code IS NOT NULL AND ref_code <> '' THEN
    SELECT id INTO ref_user_id FROM public.profiles WHERE referral_code = upper(ref_code) LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, name, email, credits, plan, referral_code, referred_by)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email,
    10,
    'free',
    new_code,
    ref_user_id
  );

  INSERT INTO public.credit_transactions (user_id, amount, reason)
  VALUES (new.id, 10, 'signup_bonus');

  -- Apply referral bonus if applicable
  IF ref_user_id IS NOT NULL THEN
    PERFORM public.apply_referral_bonus(ref_user_id, new.id);
  END IF;

  RETURN new;
END;
$$;

-- 10. Update payment-approval trigger to grant credits based on plan
CREATE OR REPLACE FUNCTION public.notify_payment_reviewed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  credits_to_grant integer := 0;
  is_subscription boolean := false;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'approved' THEN
    -- Map plan to credit grant
    credits_to_grant := CASE NEW.plan
      WHEN 'pack_50' THEN 50
      WHEN 'pack_150' THEN 150
      WHEN 'pack_500' THEN 500
      WHEN 'basic' THEN 100
      WHEN 'pro' THEN 300
      WHEN 'business' THEN 2000
      ELSE 0
    END;

    is_subscription := NEW.plan IN ('basic', 'pro', 'business');

    IF credits_to_grant > 0 THEN
      UPDATE public.profiles
      SET credits = credits + credits_to_grant,
          plan = CASE WHEN is_subscription THEN NEW.plan ELSE plan END,
          plan_renews_at = CASE WHEN is_subscription THEN now() + interval '30 days' ELSE plan_renews_at END
      WHERE id = NEW.user_id;

      INSERT INTO public.credit_transactions (user_id, amount, reason, metadata)
      VALUES (NEW.user_id, credits_to_grant, 'payment_approved', jsonb_build_object('plan', NEW.plan, 'submission_id', NEW.id));
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'تم تفعيل رصيدك', 'تمت الموافقة على الدفع. تم إضافة ' || credits_to_grant || ' رصيد إلى حسابك.', 'success');

  ELSIF NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (NEW.user_id, 'تم رفض الدفع', 'لم تتم الموافقة على الدفع. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.', 'error');
  END IF;

  RETURN NEW;
END;
$$;

-- 11. Backfill referral codes for existing users
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;
