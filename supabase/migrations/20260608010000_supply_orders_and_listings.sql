-- ============================================================
-- Supply Orders — created when a user "buys" from the supply marketplace
-- ============================================================

CREATE TABLE IF NOT EXISTS public.supply_orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id),
  store_id            uuid REFERENCES public.stores(id),
  supply_product_id   uuid NOT NULL REFERENCES public.supply_marketplace_products(id),
  quantity            integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price          numeric NOT NULL CHECK (unit_price >= 0),
  total_price         numeric NOT NULL CHECK (total_price >= 0),
  status              text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supply_orders_user_id ON public.supply_orders (user_id);
CREATE INDEX IF NOT EXISTS idx_supply_orders_status ON public.supply_orders (status);

ALTER TABLE public.supply_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own supply orders
DROP POLICY IF EXISTS "Users view own supply orders" ON public.supply_orders;
CREATE POLICY "Users view own supply orders"
  ON public.supply_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own supply orders
DROP POLICY IF EXISTS "Users create own supply orders" ON public.supply_orders;
CREATE POLICY "Users create own supply orders"
  ON public.supply_orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins (service_role) can do everything
DROP POLICY IF EXISTS "Admins manage supply orders" ON public.supply_orders;
CREATE POLICY "Admins manage supply orders"
  ON public.supply_orders FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.supply_orders FROM anon, authenticated;
GRANT SELECT, INSERT ON public.supply_orders TO authenticated;
GRANT ALL ON public.supply_orders TO service_role;

-- ============================================================
-- User Supply Listings — products a user has added to their store
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_supply_listings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id),
  store_id            uuid REFERENCES public.stores(id),
  supply_product_id   uuid NOT NULL REFERENCES public.supply_marketplace_products(id),
  selling_price       numeric NOT NULL CHECK (selling_price >= 0),
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, supply_product_id)
);

CREATE INDEX IF NOT EXISTS idx_user_supply_listings_user ON public.user_supply_listings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_supply_listings_store ON public.user_supply_listings (store_id);

ALTER TABLE public.user_supply_listings ENABLE ROW LEVEL SECURITY;

-- Users can view their own listings
DROP POLICY IF EXISTS "Users view own supply listings" ON public.user_supply_listings;
CREATE POLICY "Users view own supply listings"
  ON public.user_supply_listings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own listings
DROP POLICY IF EXISTS "Users insert own supply listings" ON public.user_supply_listings;
CREATE POLICY "Users insert own supply listings"
  ON public.user_supply_listings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own listings
DROP POLICY IF EXISTS "Users update own supply listings" ON public.user_supply_listings;
CREATE POLICY "Users update own supply listings"
  ON public.user_supply_listings FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own listings
DROP POLICY IF EXISTS "Users delete own supply listings" ON public.user_supply_listings;
CREATE POLICY "Users delete own supply listings"
  ON public.user_supply_listings FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Admins (service_role) can do everything
DROP POLICY IF EXISTS "Admins manage supply listings" ON public.user_supply_listings;
CREATE POLICY "Admins manage supply listings"
  ON public.user_supply_listings FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.user_supply_listings FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_supply_listings TO authenticated;
GRANT ALL ON public.user_supply_listings TO service_role;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.handle_supply_orders_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_supply_orders_updated_at ON public.supply_orders;
CREATE TRIGGER trg_supply_orders_updated_at
  BEFORE UPDATE ON public.supply_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_supply_orders_updated_at();

CREATE OR REPLACE FUNCTION public.handle_user_supply_listings_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_supply_listings_updated_at ON public.user_supply_listings;
CREATE TRIGGER trg_user_supply_listings_updated_at
  BEFORE UPDATE ON public.user_supply_listings
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_supply_listings_updated_at();
