
-- store_settings: scope anon reads to active storefronts
DROP POLICY IF EXISTS "Public can view store settings by slug" ON public.store_settings;
CREATE POLICY "Public can view active store settings"
  ON public.store_settings FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- category_images: scope anon reads to active storefronts
DROP POLICY IF EXISTS "Public can view category images" ON public.category_images;
CREATE POLICY "Public can view category images for active stores"
  ON public.category_images FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_settings ss
      WHERE ss.user_id = category_images.user_id
        AND ss.is_active = true
    )
  );

-- popups: scope anon reads to active storefronts and active popups only
DROP POLICY IF EXISTS "Public can view popups" ON public.popups;
CREATE POLICY "Public can view active popups for active stores"
  ON public.popups FOR SELECT
  TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM public.store_settings ss
      WHERE ss.user_id = popups.user_id
        AND ss.is_active = true
    )
  );

-- delivery_tariffs: scope anon reads to active storefronts
DROP POLICY IF EXISTS "Public can view delivery tariffs" ON public.delivery_tariffs;
CREATE POLICY "Public can view delivery tariffs for active stores"
  ON public.delivery_tariffs FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_settings ss
      WHERE ss.user_id = delivery_tariffs.owner_id
        AND ss.is_active = true
    )
  );
