
-- =====================================================
-- RETURNS & REFUNDS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  store_owner_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  reason text NOT NULL,
  details text DEFAULT '',
  status text NOT NULL DEFAULT 'requested',
  refund_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create return requests" ON public.returns
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = returns.order_id AND o.store_owner_id = returns.store_owner_id));

CREATE POLICY "Owners view returns" ON public.returns
  FOR SELECT TO authenticated USING (auth.uid() = store_owner_id);

CREATE POLICY "Owners update returns" ON public.returns
  FOR UPDATE TO authenticated USING (auth.uid() = store_owner_id);

CREATE POLICY "Owners delete returns" ON public.returns
  FOR DELETE TO authenticated USING (auth.uid() = store_owner_id);

CREATE TRIGGER returns_set_updated_at BEFORE UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Notify store owner on new return request
CREATE OR REPLACE FUNCTION public.notify_return_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (NEW.store_owner_id, 'New return request',
    'Customer: ' || NEW.customer_name || ' • Reason: ' || NEW.reason, 'info');
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_notify_return_request AFTER INSERT ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.notify_return_request();

-- =====================================================
-- STOCK ALERTS
-- =====================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS stock_alert_sent_at timestamptz;

-- =====================================================
-- ACTIVITY LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  actor_name text DEFAULT '',
  action_type text NOT NULL,
  description text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view activity log" ON public.activity_log
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Owners insert activity log" ON public.activity_log
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_activity_log_user_created ON public.activity_log (user_id, created_at DESC);

-- =====================================================
-- TEAM MEMBERS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  status text NOT NULL DEFAULT 'invited',
  invite_token text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_id, email)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage team members" ON public.team_members
  FOR ALL TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER team_members_set_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- PRODUCT REVIEWS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL,
  product_id uuid NOT NULL,
  customer_name text NOT NULL,
  customer_email text DEFAULT '',
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  reply text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a review" ON public.product_reviews
  FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_reviews.product_id AND p.user_id = product_reviews.store_owner_id));

CREATE POLICY "Public can view approved reviews" ON public.product_reviews
  FOR SELECT TO anon, authenticated USING (status = 'approved' OR auth.uid() = store_owner_id);

CREATE POLICY "Owners update reviews" ON public.product_reviews
  FOR UPDATE TO authenticated USING (auth.uid() = store_owner_id);

CREATE POLICY "Owners delete reviews" ON public.product_reviews
  FOR DELETE TO authenticated USING (auth.uid() = store_owner_id);

CREATE TRIGGER product_reviews_set_updated_at BEFORE UPDATE ON public.product_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =====================================================
-- COUPONS EXTENSIONS
-- =====================================================
ALTER TABLE public.discount_codes
  ADD COLUMN IF NOT EXISTS min_order_value numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS per_customer_limit integer,
  ADD COLUMN IF NOT EXISTS applies_to text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS applies_to_ids uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- =====================================================
-- AI GENERATIONS LOG
-- =====================================================
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  credits_spent integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view ai generations" ON public.ai_generations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Owners insert ai generations" ON public.ai_generations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
