-- Discount codes
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent','fixed')),
  value numeric NOT NULL DEFAULT 0,
  usage_limit integer,
  used_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, code)
);
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage discount codes" ON public.discount_codes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view active discount codes" ON public.discount_codes FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER discount_codes_updated BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Abandoned carts
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL,
  store_slug text NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  cart_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  cart_total numeric NOT NULL DEFAULT 0,
  recovered boolean NOT NULL DEFAULT false,
  recovery_email_sent boolean NOT NULL DEFAULT false,
  recovery_email_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view abandoned carts" ON public.abandoned_carts FOR SELECT TO authenticated USING (auth.uid() = store_owner_id);
CREATE POLICY "Owners update abandoned carts" ON public.abandoned_carts FOR UPDATE TO authenticated USING (auth.uid() = store_owner_id);
CREATE POLICY "Owners delete abandoned carts" ON public.abandoned_carts FOR DELETE TO authenticated USING (auth.uid() = store_owner_id);
CREATE POLICY "Anyone can log abandoned cart" ON public.abandoned_carts FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE TRIGGER abandoned_carts_updated BEFORE UPDATE ON public.abandoned_carts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SEO settings
CREATE TABLE public.seo_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  meta_title text NOT NULL DEFAULT '',
  meta_description text NOT NULL DEFAULT '',
  keywords text NOT NULL DEFAULT '',
  og_image_url text,
  sitemap_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage seo" ON public.seo_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view seo" ON public.seo_settings FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER seo_settings_updated BEFORE UPDATE ON public.seo_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Chatbot settings
CREATE TABLE public.chatbot_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  welcome_message text NOT NULL DEFAULT 'Hi! How can I help you today?',
  primary_color text NOT NULL DEFAULT '#6d28d9',
  knowledge_base text NOT NULL DEFAULT '',
  ai_model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage chatbot" ON public.chatbot_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view chatbot settings" ON public.chatbot_settings FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER chatbot_settings_updated BEFORE UPDATE ON public.chatbot_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Chatbot conversations
CREATE TABLE public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL,
  store_slug text NOT NULL,
  visitor_id text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view chatbot convos" ON public.chatbot_conversations FOR SELECT TO authenticated USING (auth.uid() = store_owner_id);
CREATE POLICY "Owners delete chatbot convos" ON public.chatbot_conversations FOR DELETE TO authenticated USING (auth.uid() = store_owner_id);
CREATE POLICY "Anyone can create chatbot convo" ON public.chatbot_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update chatbot convo" ON public.chatbot_conversations FOR UPDATE TO anon, authenticated USING (true);
CREATE TRIGGER chatbot_conversations_updated BEFORE UPDATE ON public.chatbot_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Popups
CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Welcome!',
  content text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT 'Shop now',
  cta_url text NOT NULL DEFAULT '/',
  trigger_type text NOT NULL DEFAULT 'timer' CHECK (trigger_type IN ('timer','exit','scroll')),
  trigger_value integer NOT NULL DEFAULT 5,
  background_color text NOT NULL DEFAULT '#ffffff',
  text_color text NOT NULL DEFAULT '#111827',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage popups" ON public.popups FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view popups" ON public.popups FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER popups_updated BEFORE UPDATE ON public.popups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Analytics integrations
CREATE TABLE public.analytics_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  ga4_id text NOT NULL DEFAULT '',
  meta_pixel_id text NOT NULL DEFAULT '',
  tiktok_pixel_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage analytics" ON public.analytics_integrations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view analytics integrations" ON public.analytics_integrations FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER analytics_integrations_updated BEFORE UPDATE ON public.analytics_integrations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Store languages
CREATE TABLE public.store_languages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  default_language text NOT NULL DEFAULT 'en',
  enabled_languages text[] NOT NULL DEFAULT ARRAY['en']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.store_languages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage languages" ON public.store_languages FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view languages" ON public.store_languages FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER store_languages_updated BEFORE UPDATE ON public.store_languages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Translations
CREATE TABLE public.translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  language text NOT NULL,
  key text NOT NULL,
  value text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, language, key)
);
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage translations" ON public.translations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view translations" ON public.translations FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER translations_updated BEFORE UPDATE ON public.translations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Currency settings
CREATE TABLE public.currency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  base_currency text NOT NULL DEFAULT 'USD',
  enabled_currencies text[] NOT NULL DEFAULT ARRAY['USD']::text[],
  rates jsonb NOT NULL DEFAULT '{}'::jsonb,
  auto_detect boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage currency" ON public.currency_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view currency settings" ON public.currency_settings FOR SELECT TO anon, authenticated USING (true);
CREATE TRIGGER currency_settings_updated BEFORE UPDATE ON public.currency_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();