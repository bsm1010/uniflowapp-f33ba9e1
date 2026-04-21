-- 1. Add section_order column with sensible default
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS section_order text[]
  NOT NULL DEFAULT ARRAY['hero','categories','featured','newsletter']::text[];

-- 2. Enable realtime so storefront tabs receive instant updates
ALTER TABLE public.store_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'store_settings'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings';
  END IF;
END $$;