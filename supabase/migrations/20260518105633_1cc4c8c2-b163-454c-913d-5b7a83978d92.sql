ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders(source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_owner_tracking_source
  ON public.orders(store_owner_id, source, tracking_number)
  WHERE tracking_number IS NOT NULL AND source <> 'manual';