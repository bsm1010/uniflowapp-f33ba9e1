-- Category images: per-store mapping of category name -> image URL
CREATE TABLE public.category_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_name text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_name)
);

ALTER TABLE public.category_images ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous storefront visitors) can view category images
CREATE POLICY "Public can view category images"
  ON public.category_images FOR SELECT
  USING (true);

-- Owners can manage their own
CREATE POLICY "Users can insert their own category images"
  ON public.category_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own category images"
  ON public.category_images FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category images"
  ON public.category_images FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER set_category_images_updated_at
  BEFORE UPDATE ON public.category_images
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_category_images_user ON public.category_images(user_id);