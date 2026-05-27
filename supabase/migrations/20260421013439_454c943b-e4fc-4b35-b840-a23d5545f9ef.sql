CREATE POLICY "Users can upload db assets to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'store-assets'
  AND (storage.foldername(name))[1] = 'db'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can update own db assets"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'store-assets'
  AND (storage.foldername(name))[1] = 'db'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Users can delete own db assets"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'store-assets'
  AND (storage.foldername(name))[1] = 'db'
  AND (storage.foldername(name))[2] = auth.uid()::text
);