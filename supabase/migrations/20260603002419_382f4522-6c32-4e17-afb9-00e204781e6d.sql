
CREATE TABLE IF NOT EXISTS public.cookie_consent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  banner_title TEXT NOT NULL DEFAULT 'We use cookies',
  banner_text TEXT NOT NULL DEFAULT 'We use cookies to improve your experience.',
  accept_all_text TEXT NOT NULL DEFAULT 'Accept all',
  reject_all_text TEXT NOT NULL DEFAULT 'Reject all',
  save_text TEXT NOT NULL DEFAULT 'Save',
  manage_text TEXT NOT NULL DEFAULT 'Manage',
  privacy_policy_url TEXT,
  position TEXT NOT NULL DEFAULT 'bottom',
  theme TEXT NOT NULL DEFAULT 'light',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);
GRANT SELECT ON public.cookie_consent_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cookie_consent_settings TO authenticated;
GRANT ALL ON public.cookie_consent_settings TO service_role;
ALTER TABLE public.cookie_consent_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ccs_public_select" ON public.cookie_consent_settings FOR SELECT USING (enabled = true);
CREATE POLICY "ccs_owner_all" ON public.cookie_consent_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.cookie_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  necessary BOOLEAN NOT NULL DEFAULT true,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  preferences BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (store_id, visitor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cookie_consents TO anon, authenticated;
GRANT ALL ON public.cookie_consents TO service_role;
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cc_insert" ON public.cookie_consents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "cc_update" ON public.cookie_consents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cc_owner_select" ON public.cookie_consents FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "cc_owner_delete" ON public.cookie_consents FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  actor_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.consent_audit_log TO anon, authenticated;
GRANT SELECT ON public.consent_audit_log TO authenticated;
GRANT ALL ON public.consent_audit_log TO service_role;
ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal_insert" ON public.consent_audit_log FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "cal_owner_select" ON public.consent_audit_log FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.privacy_policy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_html TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, store_id)
);
GRANT SELECT ON public.privacy_policy_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_policy_settings TO authenticated;
GRANT ALL ON public.privacy_policy_settings TO service_role;
ALTER TABLE public.privacy_policy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pps_public_select" ON public.privacy_policy_settings FOR SELECT USING (enabled = true);
CREATE POLICY "pps_owner_all" ON public.privacy_policy_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID,
  email TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'merchant',
  customer_name TEXT,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_method TEXT NOT NULL DEFAULT 'download',
  file_url TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.data_export_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.data_export_requests TO authenticated;
GRANT ALL ON public.data_export_requests TO service_role;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "der_insert" ON public.data_export_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "der_owner_select" ON public.data_export_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "der_owner_update" ON public.data_export_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  reason TEXT,
  order_ids TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.deletion_requests TO anon, authenticated;
GRANT SELECT, UPDATE ON public.deletion_requests TO authenticated;
GRANT ALL ON public.deletion_requests TO service_role;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dr_insert" ON public.deletion_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "dr_owner_select" ON public.deletion_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE POLICY "dr_owner_update" ON public.deletion_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
