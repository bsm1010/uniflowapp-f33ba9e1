-- ============================================================
-- Dropshipping Marketplace system
-- ============================================================
-- Tables:
--   1. marketplace_products   — admin-owned catalog, visible to resellers
--   2. reseller_listings      — reseller ↔ product mapping + resale price
--   3. dropship_orders        — end-customer orders, profit split
--   4. stock_buffer           — refused-order holding zone (30 days)
--   5. reseller_wallet        — prepaid balance
--   6. wallet_transactions    — immutable ledger
-- Function:
--   deduct_wallet_and_create_order() — atomic wallet-debit + order-create
-- ============================================================

-- ------------------------------------------------------------
-- 1. marketplace_products
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL,
  description           text,
  images                text[] NOT NULL DEFAULT '{}',
  category              text,
  supplier_name         text,
  supplier_wilaya       text,
  cost_price            numeric NOT NULL CHECK (cost_price >= 0),
  platform_price        numeric NOT NULL CHECK (platform_price >= 0),
  availability_status   text NOT NULL DEFAULT 'available'
                          CHECK (availability_status IN ('available','out_of_stock')),
  return_rate_percent   numeric NOT NULL DEFAULT 0 CHECK (return_rate_percent >= 0 AND return_rate_percent <= 100),
  total_orders_count    integer NOT NULL DEFAULT 0 CHECK (total_orders_count >= 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_category
  ON public.marketplace_products (category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_marketplace_products_availability
  ON public.marketplace_products (availability_status);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_supplier_wilaya
  ON public.marketplace_products (supplier_wilaya) WHERE supplier_wilaya IS NOT NULL;

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resellers view available marketplace products" ON public.marketplace_products;
CREATE POLICY "Resellers view available marketplace products"
  ON public.marketplace_products FOR SELECT TO authenticated
  USING (true);

REVOKE ALL ON public.marketplace_products FROM anon, authenticated;
-- Resellers see everything EXCEPT cost_price (admin-only).
GRANT SELECT (
  id, name, description, images, category, supplier_name, supplier_wilaya,
  platform_price, availability_status, return_rate_percent, total_orders_count,
  created_at, updated_at
) ON public.marketplace_products TO authenticated;
-- Writes are service_role only (admin panel calls service_role client).
GRANT ALL ON public.marketplace_products TO service_role;

-- ------------------------------------------------------------
-- 2. reseller_listings
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reseller_listings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE CASCADE,
  store_id              uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  selling_price         numeric NOT NULL CHECK (selling_price >= 0),
  is_active             boolean NOT NULL DEFAULT true,
  total_orders          integer NOT NULL DEFAULT 0 CHECK (total_orders >= 0),
  total_returns         integer NOT NULL DEFAULT 0 CHECK (total_returns >= 0),
  total_profit_earned   numeric NOT NULL DEFAULT 0 CHECK (total_profit_earned >= 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reseller_id, marketplace_product_id)
);

CREATE INDEX IF NOT EXISTS idx_reseller_listings_reseller
  ON public.reseller_listings (reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_listings_product
  ON public.reseller_listings (marketplace_product_id);
CREATE INDEX IF NOT EXISTS idx_reseller_listings_active
  ON public.reseller_listings (reseller_id, is_active) WHERE is_active = true;

ALTER TABLE public.reseller_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resellers view their own listings" ON public.reseller_listings;
CREATE POLICY "Resellers view their own listings"
  ON public.reseller_listings FOR SELECT TO authenticated
  USING (auth.uid() = reseller_id);

DROP POLICY IF EXISTS "Resellers create their own listings" ON public.reseller_listings;
CREATE POLICY "Resellers create their own listings"
  ON public.reseller_listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reseller_id);

DROP POLICY IF EXISTS "Resellers update their own listings" ON public.reseller_listings;
CREATE POLICY "Resellers update their own listings"
  ON public.reseller_listings FOR UPDATE TO authenticated
  USING (auth.uid() = reseller_id)
  WITH CHECK (auth.uid() = reseller_id);

DROP POLICY IF EXISTS "Resellers delete their own listings" ON public.reseller_listings;
CREATE POLICY "Resellers delete their own listings"
  ON public.reseller_listings FOR DELETE TO authenticated
  USING (auth.uid() = reseller_id);

REVOKE ALL ON public.reseller_listings FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_listings TO authenticated;
GRANT ALL ON public.reseller_listings TO service_role;

-- Enforce selling_price >= platform_price at the DB level too.
-- (Application should also check; this is a safety net.)
CREATE OR REPLACE FUNCTION public.reseller_listings_price_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_min_price numeric;
BEGIN
  SELECT platform_price INTO v_min_price
    FROM public.marketplace_products
    WHERE id = NEW.marketplace_product_id;
  IF v_min_price IS NULL THEN
    RAISE EXCEPTION 'marketplace_product % not found', NEW.marketplace_product_id;
  END IF;
  IF NEW.selling_price < v_min_price THEN
    RAISE EXCEPTION 'selling_price (%) must be >= platform_price (%)',
      NEW.selling_price, v_min_price;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reseller_listings_price_check ON public.reseller_listings;
CREATE TRIGGER trg_reseller_listings_price_check
  BEFORE INSERT OR UPDATE OF selling_price, marketplace_product_id ON public.reseller_listings
  FOR EACH ROW EXECUTE FUNCTION public.reseller_listings_price_check();

-- ------------------------------------------------------------
-- 3. dropship_orders
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dropship_orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_listing_id   uuid NOT NULL REFERENCES public.reseller_listings(id) ON DELETE RESTRICT,
  reseller_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  client_name           text NOT NULL,
  client_phone          text NOT NULL,
  client_wilaya         text NOT NULL,
  client_address        text NOT NULL,
  selling_price         numeric NOT NULL CHECK (selling_price >= 0),
  platform_price        numeric NOT NULL CHECK (platform_price >= 0),
  cost_price            numeric NOT NULL CHECK (cost_price >= 0),
  admin_profit          numeric GENERATED ALWAYS AS (platform_price - cost_price) STORED,
  reseller_profit       numeric GENERATED ALWAYS AS (selling_price - platform_price) STORED,
  status                text NOT NULL DEFAULT 'pending_payment'
                          CHECK (status IN (
                            'pending_payment','paid_by_reseller','purchased_by_admin',
                            'shipped','delivered','refused','in_stock_buffer','returned_to_reseller'
                          )),
  tracking_number       text,
  zr_express_id         text,
  reseller_paid_at      timestamptz,
  shipped_at            timestamptz,
  delivered_at          timestamptz,
  refused_at            timestamptz,
  buffer_expires_at     timestamptz GENERATED ALWAYS AS (
                          CASE WHEN refused_at IS NOT NULL
                            THEN refused_at + interval '30 days'
                            ELSE NULL END
                        ) STORED,
  returned_to_reseller_at timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dropship_orders_reseller
  ON public.dropship_orders (reseller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_listing
  ON public.dropship_orders (reseller_listing_id);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_status
  ON public.dropship_orders (status);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_tracking
  ON public.dropship_orders (tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dropship_orders_buffer_expiry
  ON public.dropship_orders (buffer_expires_at)
  WHERE status = 'in_stock_buffer' AND buffer_expires_at IS NOT NULL;

ALTER TABLE public.dropship_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resellers view their own orders" ON public.dropship_orders;
CREATE POLICY "Resellers view their own orders"
  ON public.dropship_orders FOR SELECT TO authenticated
  USING (auth.uid() = reseller_id);

DROP POLICY IF EXISTS "Resellers create their own orders" ON public.dropship_orders;
CREATE POLICY "Resellers create their own orders"
  ON public.dropship_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reseller_id);

-- Resellers don't update orders directly — only the atomic function
-- (deduct_wallet_and_create_order) does that, using SECURITY DEFINER.
-- All subsequent status transitions (shipped, delivered, refused, etc.)
-- are handled by service_role from admin-side cron / webhook handlers.

REVOKE ALL ON public.dropship_orders FROM anon;
-- Resellers see their own orders but cost_price + admin_profit are hidden
-- (those reveal admin's margin). platform_price is shown so they understand
-- the cost split; selling_price + reseller_profit are obviously theirs.
GRANT SELECT (
  id, reseller_listing_id, reseller_id,
  client_name, client_phone, client_wilaya, client_address,
  selling_price, platform_price, reseller_profit,
  status, tracking_number, zr_express_id,
  reseller_paid_at, shipped_at, delivered_at, refused_at,
  buffer_expires_at, returned_to_reseller_at,
  created_at
) ON public.dropship_orders TO authenticated;
GRANT ALL ON public.dropship_orders TO service_role;

-- ------------------------------------------------------------
-- 4. stock_buffer
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_buffer (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dropship_order_id     uuid NOT NULL REFERENCES public.dropship_orders(id) ON DELETE CASCADE,
  marketplace_product_id uuid NOT NULL REFERENCES public.marketplace_products(id) ON DELETE RESTRICT,
  reseller_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  refused_at            timestamptz NOT NULL,
  buffer_expires_at     timestamptz NOT NULL,
  status                text NOT NULL DEFAULT 'holding'
                          CHECK (status IN ('holding','relisted','returned_to_reseller')),
  relist_count          integer NOT NULL DEFAULT 0 CHECK (relist_count >= 0),
  return_delivery_cost  numeric NOT NULL DEFAULT 500 CHECK (return_delivery_cost >= 0),
  returned_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stock_buffer_reseller
  ON public.stock_buffer (reseller_id, status);
CREATE INDEX IF NOT EXISTS idx_stock_buffer_expiry
  ON public.stock_buffer (buffer_expires_at) WHERE status = 'holding';
CREATE INDEX IF NOT EXISTS idx_stock_buffer_product
  ON public.stock_buffer (marketplace_product_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_stock_buffer_order
  ON public.stock_buffer (dropship_order_id);

ALTER TABLE public.stock_buffer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resellers view their own stock buffer" ON public.stock_buffer;
CREATE POLICY "Resellers view their own stock buffer"
  ON public.stock_buffer FOR SELECT TO authenticated
  USING (auth.uid() = reseller_id);

REVOKE ALL ON public.stock_buffer FROM anon;
GRANT SELECT ON public.stock_buffer TO authenticated;
GRANT ALL ON public.stock_buffer TO service_role;

-- ------------------------------------------------------------
-- 5. reseller_wallet
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reseller_wallet (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id           uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance               numeric NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned          numeric NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_spent           numeric NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
  total_withdrawn       numeric NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reseller_wallet ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resellers view their own wallet" ON public.reseller_wallet;
CREATE POLICY "Resellers view their own wallet"
  ON public.reseller_wallet FOR SELECT TO authenticated
  USING (auth.uid() = reseller_id);

-- Wallet mutations are done by SECURITY DEFINER functions only
-- (topup, deduct, withdraw). No direct INSERT/UPDATE/DELETE for clients.

REVOKE ALL ON public.reseller_wallet FROM anon;
GRANT SELECT ON public.reseller_wallet TO authenticated;
GRANT ALL ON public.reseller_wallet TO service_role;

-- ------------------------------------------------------------
-- 6. wallet_transactions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                  text NOT NULL CHECK (type IN (
                          'topup','payment','earning','withdrawal','refund','return_fee'
                        )),
  amount                numeric NOT NULL,  -- signed: + credit, - debit
  balance_after         numeric NOT NULL CHECK (balance_after >= 0),
  reference_id          uuid,
  description           text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_reseller_time
  ON public.wallet_transactions (reseller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_type
  ON public.wallet_transactions (reseller_id, type);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_reference
  ON public.wallet_transactions (reference_id) WHERE reference_id IS NOT NULL;

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resellers view their own wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Resellers view their own wallet transactions"
  ON public.wallet_transactions FOR SELECT TO authenticated
  USING (auth.uid() = reseller_id);

-- All writes are done by SECURITY DEFINER functions. Clients cannot insert.

REVOKE ALL ON public.wallet_transactions FROM anon;
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;

-- ============================================================
-- Function: deduct_wallet_and_create_order
-- ============================================================
-- Atomically:
--   1. Locks the reseller's wallet row (SELECT ... FOR UPDATE)
--   2. Reads the listing + product to capture platform_price
--   3. Verifies the listing is owned by p_reseller_id and is active
--   4. Verifies wallet balance >= platform_price
--   5. Debits wallet, increments total_spent
--   6. Inserts dropship_order with status='paid_by_reseller'
--   7. Inserts wallet_transaction(type='payment')
--   8. Returns the new order id
-- SECURITY DEFINER so it bypasses the row-level "no client writes" policy
-- on dropship_orders, reseller_wallet, and wallet_transactions.
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_wallet_and_create_order(
  p_reseller_id    uuid,
  p_listing_id     uuid,
  p_client_name    text,
  p_client_phone   text,
  p_client_wilaya  text,
  p_client_address text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet              public.reseller_wallet%ROWTYPE;
  v_listing             public.reseller_listings%ROWTYPE;
  v_product             public.marketplace_products%ROWTYPE;
  v_platform_price      numeric;
  v_new_balance         numeric;
  v_new_order_id        uuid;
BEGIN
  -- 0. Sanity
  IF p_reseller_id IS NULL OR p_listing_id IS NULL THEN
    RAISE EXCEPTION 'reseller_id and listing_id are required';
  END IF;
  IF p_client_name IS NULL OR length(trim(p_client_name)) = 0
     OR p_client_phone IS NULL OR length(trim(p_client_phone)) = 0
     OR p_client_wilaya IS NULL OR length(trim(p_client_wilaya)) = 0
     OR p_client_address IS NULL OR length(trim(p_client_address)) = 0 THEN
    RAISE EXCEPTION 'client_name, client_phone, client_wilaya and client_address are required';
  END IF;

  -- 1. Lock the wallet row to prevent race conditions on concurrent orders
  SELECT * INTO v_wallet
    FROM public.reseller_wallet
    WHERE reseller_id = p_reseller_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet not found for reseller %', p_reseller_id;
  END IF;

  -- 2. Load the listing (verifies it exists and is owned by the caller)
  SELECT * INTO v_listing
    FROM public.reseller_listings
    WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'listing % not found', p_listing_id;
  END IF;
  IF v_listing.reseller_id <> p_reseller_id THEN
    RAISE EXCEPTION 'listing % does not belong to reseller %', p_listing_id, p_reseller_id;
  END IF;
  IF NOT v_listing.is_active THEN
    RAISE EXCEPTION 'listing % is not active', p_listing_id;
  END IF;

  -- 3. Load the product for cost + current price
  SELECT * INTO v_product
    FROM public.marketplace_products
    WHERE id = v_listing.marketplace_product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'marketplace_product % not found', v_listing.marketplace_product_id;
  END IF;
  IF v_product.availability_status <> 'available' THEN
    RAISE EXCEPTION 'marketplace_product % is not available', v_product.id;
  END IF;
  v_platform_price := v_product.platform_price;

  -- 4. Check balance
  IF v_wallet.balance < v_platform_price THEN
    RAISE EXCEPTION 'insufficient wallet balance: have %, need %',
      v_wallet.balance, v_platform_price
      USING ERRCODE = 'P0001';
  END IF;

  -- 5. Debit wallet
  v_new_balance := v_wallet.balance - v_platform_price;
  UPDATE public.reseller_wallet
    SET balance       = v_new_balance,
        total_spent   = total_spent + v_platform_price,
        updated_at    = now()
    WHERE reseller_id = p_reseller_id;

  -- 6. Create the order
  INSERT INTO public.dropship_orders (
    reseller_listing_id, reseller_id,
    client_name, client_phone, client_wilaya, client_address,
    selling_price, platform_price, cost_price,
    status, reseller_paid_at
  ) VALUES (
    v_listing.id, p_reseller_id,
    trim(p_client_name), trim(p_client_phone), trim(p_client_wilaya), trim(p_client_address),
    v_listing.selling_price, v_platform_price, v_product.cost_price,
    'paid_by_reseller', now()
  )
  RETURNING id INTO v_new_order_id;

  -- 7. Record the wallet transaction
  INSERT INTO public.wallet_transactions (
    reseller_id, type, amount, balance_after, reference_id, description
  ) VALUES (
    p_reseller_id, 'payment', -v_platform_price, v_new_balance, v_new_order_id,
    'Payment for dropship order ' || v_new_order_id::text
  );

  RETURN v_new_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.deduct_wallet_and_create_order(
  uuid, uuid, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.deduct_wallet_and_create_order(
  uuid, uuid, text, text, text, text
) TO authenticated, service_role;

-- ============================================================
-- Updated_at maintenance for marketplace_products and wallet
-- ============================================================
-- We don't add triggers (project convention) but updated_at is still
-- set on first INSERT (default now()) and the wallet function updates it.
-- Reminder for future migrations: marketplace_products.updated_at should
-- be touched from the admin panel on product edits (service_role path).
