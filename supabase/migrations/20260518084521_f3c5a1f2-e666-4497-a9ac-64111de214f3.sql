-- Developer profiles
CREATE TABLE public.developer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  display_name text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  avatar_url text,
  stripe_connect_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.developer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view developer profiles" ON public.developer_profiles
  FOR SELECT USING (true);
CREATE POLICY "Users manage own developer profile" ON public.developer_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER developer_profiles_updated_at
  BEFORE UPDATE ON public.developer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Marketplace apps
CREATE TABLE public.apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  short_description text NOT NULL DEFAULT '',
  long_description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Other',
  app_url text NOT NULL DEFAULT '',
  icon_url text,
  screenshots text[] NOT NULL DEFAULT '{}',
  price numeric NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX apps_status_idx ON public.apps(status);
CREATE INDEX apps_developer_idx ON public.apps(developer_id);
CREATE INDEX apps_category_idx ON public.apps(category);

ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved apps" ON public.apps
  FOR SELECT USING (status = 'approved' OR auth.uid() = developer_id OR public.has_role(auth.uid(), 'marketplace_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Developers insert own apps" ON public.apps
  FOR INSERT WITH CHECK (auth.uid() = developer_id);
CREATE POLICY "Developers update own apps" ON public.apps
  FOR UPDATE USING (auth.uid() = developer_id) WITH CHECK (auth.uid() = developer_id);
CREATE POLICY "Admins update any app" ON public.apps
  FOR UPDATE USING (public.has_role(auth.uid(), 'marketplace_admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'marketplace_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Developers delete own apps" ON public.apps
  FOR DELETE USING (auth.uid() = developer_id);

CREATE TRIGGER apps_updated_at
  BEFORE UPDATE ON public.apps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Purchases
CREATE TABLE public.app_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL DEFAULT 0,
  stripe_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);
CREATE INDEX app_purchases_user_idx ON public.app_purchases(user_id);
CREATE INDEX app_purchases_app_idx ON public.app_purchases(app_id);

ALTER TABLE public.app_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own purchases" ON public.app_purchases
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Developers view purchases of their apps" ON public.app_purchases
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.apps a WHERE a.id = app_purchases.app_id AND a.developer_id = auth.uid()));
CREATE POLICY "Users insert free purchases" ON public.app_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id AND amount_paid = 0);
CREATE POLICY "Service role manages purchases" ON public.app_purchases
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Reviews
CREATE TABLE public.app_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  app_id uuid NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, app_id)
);
CREATE INDEX app_reviews_app_idx ON public.app_reviews(app_id);

ALTER TABLE public.app_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view reviews" ON public.app_reviews
  FOR SELECT USING (true);
CREATE POLICY "Purchasers can insert reviews" ON public.app_reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.app_purchases p WHERE p.app_id = app_reviews.app_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Users update own reviews" ON public.app_reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own reviews" ON public.app_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for marketplace assets
INSERT INTO storage.buckets (id, name, public) VALUES ('marketplace-assets', 'marketplace-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view marketplace assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketplace-assets');
CREATE POLICY "Users upload own marketplace assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'marketplace-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own marketplace assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'marketplace-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own marketplace assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'marketplace-assets' AND auth.uid()::text = (storage.foldername(name))[1]);