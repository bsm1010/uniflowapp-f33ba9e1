-- Create delivery_tariffs table
CREATE TABLE public.delivery_tariffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  wilaya TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (store_id, wilaya)
);

CREATE INDEX idx_delivery_tariffs_store_id ON public.delivery_tariffs(store_id);

ALTER TABLE public.delivery_tariffs ENABLE ROW LEVEL SECURITY;

-- Public can view tariffs (needed for storefront checkout)
CREATE POLICY "Public can view delivery tariffs"
ON public.delivery_tariffs
FOR SELECT
USING (true);

-- Only store owner can manage their tariffs
CREATE POLICY "Owners insert delivery tariffs"
ON public.delivery_tariffs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = store_id);

CREATE POLICY "Owners update delivery tariffs"
ON public.delivery_tariffs
FOR UPDATE
TO authenticated
USING (auth.uid() = store_id)
WITH CHECK (auth.uid() = store_id);

CREATE POLICY "Owners delete delivery tariffs"
ON public.delivery_tariffs
FOR DELETE
TO authenticated
USING (auth.uid() = store_id);

CREATE TRIGGER update_delivery_tariffs_updated_at
BEFORE UPDATE ON public.delivery_tariffs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();