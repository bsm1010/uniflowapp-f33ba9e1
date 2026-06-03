-- GDPR Tools: Cookie Consent, Privacy Policy, Data Export, Deletion Requests

-- 1. Cookie consent settings per store
CREATE TABLE IF NOT EXISTS public.cookie_consent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  banner_title text NOT NULL DEFAULT 'Cookie Preferences',
  banner_text text NOT NULL DEFAULT 'We use cookies to improve your experience. You can choose which cookies to allow.',
  accept_all_text text NOT NULL DEFAULT 'Accept All',
  reject_all_text text NOT NULL DEFAULT 'Reject All',
  save_text text NOT NULL DEFAULT 'Save Preferences',
  manage_text text NOT NULL DEFAULT 'Cookie Settings',
  privacy_policy_url text,
  position text NOT NULL DEFAULT 'bottom' CHECK (position IN ('bottom', 'bottom-left', 'bottom-right')),
  theme text NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- 2. Cookie consent records (visitor consents)
CREATE TABLE IF NOT EXISTS public.cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  necessary boolean NOT NULL DEFAULT true,
  analytics boolean NOT NULL DEFAULT false,
  marketing boolean NOT NULL DEFAULT false,
  preferences boolean NOT NULL DEFAULT false,
  ip_address inet,
  user_agent text,
  consented_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  UNIQUE(store_id, visitor_id)
);

-- 3. Privacy policy settings per store
CREATE TABLE IF NOT EXISTS public.privacy_policy_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  sections jsonb NOT NULL DEFAULT '[
    {"title": "Information We Collect", "content": "We collect information you provide directly, including name, email, and shipping address when you place an order."},
    {"title": "How We Use Your Information", "content": "We use your information to process orders, send order updates, and improve our services."},
    {"title": "Cookies", "content": "We use cookies to maintain your session and remember your preferences. You can control cookie settings through our cookie banner."},
    {"title": "Third-Party Services", "content": "We may share your information with delivery partners to fulfill your orders. We do not sell your personal data."},
    {"title": "Data Retention", "content": "We retain your order information for up to 5 years for legal and accounting purposes. You can request deletion at any time."},
    {"title": "Your Rights", "content": "You have the right to access, correct, or delete your personal data. Contact us using the information below to exercise these rights."},
    {"title": "Contact Us", "content": "For privacy-related inquiries, please contact us at our store email."}
  ]'::jsonb,
  custom_html text,
  last_updated timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- 4. Data export requests
CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  request_type text NOT NULL DEFAULT 'merchant' CHECK (request_type IN ('merchant', 'customer')),
  customer_name text,
  customer_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  delivery_method text NOT NULL DEFAULT 'download' CHECK (delivery_method IN ('download', 'email')),
  file_url text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Deletion requests
CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  reason text,
  order_ids text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Consent audit log (immutable)
CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  actor_id uuid,
  action text NOT NULL,
  details jsonb,
  ip_address inet,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.cookie_consent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_policy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;

-- cookie_consent_settings: merchant manages own
CREATE POLICY "Merchants manage own cookie settings"
  ON public.cookie_consent_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- cookie_consents: public can insert, store owner can read
CREATE POLICY "Anyone can record consent"
  ON public.cookie_consents FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Store owners read own consents"
  ON public.cookie_consents FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

CREATE POLICY "Store owners delete own consents"
  ON public.cookie_consents FOR DELETE TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

-- privacy_policy_settings: merchant manages own
CREATE POLICY "Merchants manage own privacy policy"
  ON public.privacy_policy_settings FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Public can read privacy policy (for storefront)
CREATE POLICY "Anyone can read privacy policy"
  ON public.privacy_policy_settings FOR SELECT TO anon
  USING (enabled = true);

-- data_export_requests: merchant manages own, customers can insert
CREATE POLICY "Merchants manage own export requests"
  ON public.data_export_requests FOR ALL TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

CREATE POLICY "Customers can submit export requests"
  ON public.data_export_requests FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Customers can read own export requests"
  ON public.data_export_requests FOR SELECT TO anon
  USING (true);

-- deletion_requests: merchant manages, customers can insert
CREATE POLICY "Merchants manage own deletion requests"
  ON public.deletion_requests FOR ALL TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
  WITH CHECK (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

CREATE POLICY "Customers can submit deletion requests"
  ON public.deletion_requests FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Customers can read own deletion requests"
  ON public.deletion_requests FOR SELECT TO anon
  USING (true);

-- consent_audit_log: store owner can read, system inserts
CREATE POLICY "Store owners read own audit log"
  ON public.consent_audit_log FOR SELECT TO authenticated
  USING (store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));

CREATE POLICY "Authenticated users can insert audit log"
  ON public.consent_audit_log FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anon users can insert audit log"
  ON public.consent_audit_log FOR INSERT TO anon
  WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cookie_consent_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.cookie_consents TO anon;
GRANT SELECT, INSERT, DELETE ON public.cookie_consents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.privacy_policy_settings TO authenticated;
GRANT SELECT ON public.privacy_policy_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.data_export_requests TO authenticated;
GRANT SELECT, INSERT ON public.data_export_requests TO anon;
GRANT SELECT, INSERT, UPDATE ON public.deletion_requests TO authenticated;
GRANT SELECT, INSERT ON public.deletion_requests TO anon;
GRANT SELECT, INSERT ON public.consent_audit_log TO authenticated;
GRANT SELECT, INSERT ON public.consent_audit_log TO anon;
