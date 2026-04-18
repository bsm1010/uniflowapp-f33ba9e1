-- Extend store_settings with richer customization
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS secondary_color text NOT NULL DEFAULT '#0f172a',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#f59e0b',
  ADD COLUMN IF NOT EXISTS button_style text NOT NULL DEFAULT 'rounded',
  ADD COLUMN IF NOT EXISTS border_radius text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS hero_image_url text,
  ADD COLUMN IF NOT EXISTS hero_layout text NOT NULL DEFAULT 'centered',
  ADD COLUMN IF NOT EXISTS nav_links jsonb NOT NULL DEFAULT '[
    {"label":"Shop","href":"#featured"},
    {"label":"Categories","href":"#categories"},
    {"label":"About","href":"#about"},
    {"label":"Contact","href":"#contact"}
  ]'::jsonb,
  ADD COLUMN IF NOT EXISTS section_titles jsonb NOT NULL DEFAULT '{
    "featured":"Featured products",
    "featured_sub":"Hand-picked items we love",
    "categories":"Shop by category",
    "categories_sub":"Browse our collections",
    "newsletter":"Join our newsletter",
    "newsletter_sub":"Get 10% off your first order"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS button_labels jsonb NOT NULL DEFAULT '{
    "add_to_cart":"Add to cart",
    "view_product":"View",
    "checkout":"Checkout",
    "subscribe":"Subscribe",
    "view_all":"View all",
    "search_placeholder":"Search products..."
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_about text NOT NULL DEFAULT 'A small shop with a big heart. Quality products, delivered with care.',
  ADD COLUMN IF NOT EXISTS footer_socials jsonb NOT NULL DEFAULT '{"instagram":"","facebook":"","twitter":"","tiktok":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS footer_copyright text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS show_search boolean NOT NULL DEFAULT true;