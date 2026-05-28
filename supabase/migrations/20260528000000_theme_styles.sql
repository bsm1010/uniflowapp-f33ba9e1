ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS navbar_style text NOT NULL DEFAULT 'classic',
  ADD COLUMN IF NOT EXISTS footer_style text NOT NULL DEFAULT 'columns';
