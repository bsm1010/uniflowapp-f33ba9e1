-- 1. Add slug to store_settings
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS slug text;

-- backfill slugs for existing rows
UPDATE public.store_settings
SET slug = 'store-' || substring(user_id::text, 1, 8)
WHERE slug IS NULL;

ALTER TABLE public.store_settings
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS store_settings_slug_key
  ON public.store_settings (slug);

-- format check: lowercase letters, numbers, hyphens, 3-40 chars
ALTER TABLE public.store_settings
  ADD CONSTRAINT store_settings_slug_format
  CHECK (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$');

-- 2. Public read policies for storefront
CREATE POLICY "Public can view store settings by slug"
  ON public.store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public can view products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_owner_id uuid NOT NULL,
  store_slug text NOT NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_postal_code text NOT NULL,
  shipping_country text NOT NULL,
  notes text,
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can place an order"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Store owners can view their orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = store_owner_id);

CREATE POLICY "Store owners can update their orders"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = store_owner_id);

CREATE INDEX idx_orders_store_owner ON public.orders(store_owner_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at DESC);

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 4. Order items table
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid,
  product_name text NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order items"
  ON public.order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Store owners can view their order items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.store_owner_id = auth.uid()
    )
  );

CREATE INDEX idx_order_items_order ON public.order_items(order_id);