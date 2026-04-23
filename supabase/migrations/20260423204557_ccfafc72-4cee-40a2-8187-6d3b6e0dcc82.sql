ALTER TABLE public.delivery_tariffs
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'domicile';

ALTER TABLE public.delivery_tariffs
  DROP CONSTRAINT IF EXISTS delivery_tariffs_delivery_type_check;

ALTER TABLE public.delivery_tariffs
  ADD CONSTRAINT delivery_tariffs_delivery_type_check
  CHECK (delivery_type IN ('domicile', 'stopdesk'));

-- Drop any older uniqueness rules so we can install the new composite one.
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.delivery_tariffs'::regclass
      AND contype = 'u'
  LOOP
    EXECUTE format('ALTER TABLE public.delivery_tariffs DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS delivery_tariffs_unique_scope
  ON public.delivery_tariffs (store_id, company_id, wilaya, city, delivery_type);
