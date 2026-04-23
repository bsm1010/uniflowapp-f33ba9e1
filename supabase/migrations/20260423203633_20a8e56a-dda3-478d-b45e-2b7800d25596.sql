-- Drop legacy unique on (store_id, wilaya) if it exists, then add (store_id, wilaya, company_id)
DO $$
DECLARE
  c text;
BEGIN
  SELECT conname INTO c
  FROM pg_constraint
  WHERE conrelid = 'public.delivery_tariffs'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) ILIKE '%(store_id, wilaya)%'
    AND pg_get_constraintdef(oid) NOT ILIKE '%company_id%';
  IF c IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.delivery_tariffs DROP CONSTRAINT %I', c);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.delivery_tariffs'::regclass
      AND conname = 'delivery_tariffs_store_wilaya_company_key'
  ) THEN
    ALTER TABLE public.delivery_tariffs
      ADD CONSTRAINT delivery_tariffs_store_wilaya_company_key
      UNIQUE (store_id, wilaya, company_id);
  END IF;
END$$;