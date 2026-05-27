CREATE TABLE public.custom_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  store_slug TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  domain_type TEXT NOT NULL DEFAULT 'root',
  status TEXT NOT NULL DEFAULT 'pending',
  dns_records JSONB NOT NULL DEFAULT '[]'::jsonb,
  verification_token TEXT NOT NULL,
  detected_provider TEXT,
  ssl_active BOOLEAN NOT NULL DEFAULT false,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  last_checked_at TIMESTAMPTZ,
  error_message TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view custom domains" ON public.custom_domains
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners insert custom domains" ON public.custom_domains
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners update custom domains" ON public.custom_domains
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Owners delete custom domains" ON public.custom_domains
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_custom_domains_user ON public.custom_domains(user_id);
CREATE INDEX idx_custom_domains_slug ON public.custom_domains(store_slug);

CREATE TRIGGER update_custom_domains_updated_at
  BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();