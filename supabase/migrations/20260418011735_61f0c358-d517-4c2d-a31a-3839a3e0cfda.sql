DROP POLICY IF EXISTS "Users can update their own category images" ON public.category_images;
DROP POLICY IF EXISTS "Users can delete their own category images" ON public.category_images;

CREATE POLICY "Users can update their own category images"
  ON public.category_images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own category images"
  ON public.category_images FOR DELETE
  USING (auth.uid() = user_id);