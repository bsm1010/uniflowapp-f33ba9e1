CREATE TABLE public.store_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL DEFAULT 'My Store',
  tagline TEXT NOT NULL DEFAULT 'Beautiful things, thoughtfully made.',
  theme TEXT NOT NULL DEFAULT 'modern',
  primary_color TEXT NOT NULL DEFAULT '#6d28d9',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  font_family TEXT NOT NULL DEFAULT 'Inter',
  logo_url TEXT,
  hero_heading TEXT NOT NULL DEFAULT 'Welcome to our store',
  hero_subheading TEXT NOT NULL DEFAULT 'Discover products you''ll love.',
  hero_cta_label TEXT NOT NULL DEFAULT 'Shop now',
  show_hero BOOLEAN NOT NULL DEFAULT true,
  show_featured BOOLEAN NOT NULL DEFAULT true,
  show_categories BOOLEAN NOT NULL DEFAULT true,
  show_newsletter BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store settings"
  ON public.store_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own store settings"
  ON public.store_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store settings"
  ON public.store_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER store_settings_set_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('store-assets', 'store-assets', true);

CREATE POLICY "Store assets are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-assets');

CREATE POLICY "Users can upload their own store assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own store assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own store assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'store-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );