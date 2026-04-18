ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS about_title text NOT NULL DEFAULT 'About us',
  ADD COLUMN IF NOT EXISTS about_content text NOT NULL DEFAULT 'Welcome to our store. We are passionate about offering quality products and a delightful shopping experience. Thanks for stopping by!',
  ADD COLUMN IF NOT EXISTS about_image_url text;