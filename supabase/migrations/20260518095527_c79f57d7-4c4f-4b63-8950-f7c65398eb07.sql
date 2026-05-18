
ALTER TABLE public.shipments
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_sync_at timestamptz,
  ADD COLUMN IF NOT EXISTS provider_response jsonb,
  ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'domicile';

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'domicile';

CREATE INDEX IF NOT EXISTS idx_shipments_status ON public.shipments(status);
