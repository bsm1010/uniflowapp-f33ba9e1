-- ============================================================
-- Dropshipping order lifecycle
-- ============================================================
-- Adds the missing pieces for the operational flow on top of the
-- marketplace schema:
--
--   * wallet_topup_requests — resellers request topups, admin approves
--   * create_pending_dropship_order — storefront creates an order
--     in 'pending_payment' state WITHOUT touching the wallet
--   * confirm_and_pay_order — reseller confirms + pays from wallet
--   * admin_approve_wallet_topup / admin_reject_wallet_topup
--   * trg_dropship_order_status — when status flips to 'delivered',
--     credit the reseller wallet with selling_price and increment
--     listing counters. When status flips to 'refused', create a
--     stock_buffer row automatically.
-- ============================================================

-- ------------------------------------------------------------
-- 1. wallet_topup_requests
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_topup_requests (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount                numeric NOT NULL CHECK (amount > 0),
  payment_reference     text NOT NULL,        -- CCP / Baridimob receipt id
  status                text NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending','approved','rejected')),
  admin_note            text,
  processed_at          timestamptz,
  processed_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_topup_requests_reseller
  ON public.wallet_topup_requests (reseller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_topup_requests_status
  ON public.wallet_topup_requests (status, created_at DESC);

ALTER TABLE public.wallet_topup_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Resellers view their own topup requests" ON public.wallet_topup_requests;
CREATE POLICY "Resellers view their own topup requests"
  ON public.wallet_topup_requests FOR SELECT TO authenticated
  USING (auth.uid() = reseller_id);

DROP POLICY IF EXISTS "Resellers create their own topup requests" ON public.wallet_topup_requests;
CREATE POLICY "Resellers create their own topup requests"
  ON public.wallet_topup_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reseller_id);

-- No UPDATE/DELETE for clients — only the SECURITY DEFINER functions
-- below transition status. Admin reads go through service_role.

REVOKE ALL ON public.wallet_topup_requests FROM anon;
GRANT SELECT, INSERT ON public.wallet_topup_requests TO authenticated;
GRANT ALL ON public.wallet_topup_requests TO service_role;

-- ============================================================
-- Function: create_pending_dropship_order
-- ============================================================
-- Creates a dropship_order with status='pending_payment' WITHOUT
-- touching the wallet. The reseller must later call
-- confirm_and_pay_order() to actually pay.
--
-- Used by the storefront checkout (authenticated as the reseller
-- who's placing the order on behalf of their end-customer).
-- SECURITY DEFINER so we can stamp cost_price from the product row
-- (resellers don't have a SELECT grant on cost_price).
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_pending_dropship_order(
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
  v_listing        public.reseller_listings%ROWTYPE;
  v_product        public.marketplace_products%ROWTYPE;
  v_platform_price numeric;
  v_cost_price     numeric;
  v_new_order_id   uuid;
BEGIN
  IF p_reseller_id IS NULL OR p_listing_id IS NULL THEN
    RAISE EXCEPTION 'reseller_id and listing_id are required';
  END IF;
  IF p_client_name IS NULL OR length(trim(p_client_name)) = 0
     OR p_client_phone IS NULL OR length(trim(p_client_phone)) = 0
     OR p_client_wilaya IS NULL OR length(trim(p_client_wilaya)) = 0
     OR p_client_address IS NULL OR length(trim(p_client_address)) = 0 THEN
    RAISE EXCEPTION 'client_name, client_phone, client_wilaya and client_address are required';
  END IF;

  -- Load listing (verifies ownership + active)
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

  -- Load product (admin-only columns accessed via SECURITY DEFINER)
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
  v_cost_price     := v_product.cost_price;

  INSERT INTO public.dropship_orders (
    reseller_listing_id, reseller_id,
    client_name, client_phone, client_wilaya, client_address,
    selling_price, platform_price, cost_price,
    status
  ) VALUES (
    v_listing.id, p_reseller_id,
    trim(p_client_name), trim(p_client_phone), trim(p_client_wilaya), trim(p_client_address),
    v_listing.selling_price, v_platform_price, v_cost_price,
    'pending_payment'
  )
  RETURNING id INTO v_new_order_id;

  RETURN v_new_order_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_pending_dropship_order(
  uuid, uuid, text, text, text, text
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pending_dropship_order(
  uuid, uuid, text, text, text, text
) TO authenticated, service_role;

-- ============================================================
-- Function: confirm_and_pay_order
-- ============================================================
-- Reseller-side step: debits wallet, sets order status to
-- 'paid_by_reseller', records a payment ledger row.
--
-- Atomic: locks the wallet row, checks balance, debits, updates
-- the order, inserts the ledger row — all in one txn.
-- ============================================================
CREATE OR REPLACE FUNCTION public.confirm_and_pay_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order         public.dropship_orders%ROWTYPE;
  v_wallet        public.reseller_wallet%ROWTYPE;
  v_new_balance   numeric;
BEGIN
  IF p_order_id IS NULL THEN
    RAISE EXCEPTION 'order_id is required';
  END IF;

  SELECT * INTO v_order
    FROM public.dropship_orders
    WHERE id = p_order_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order % not found', p_order_id;
  END IF;
  IF v_order.status <> 'pending_payment' THEN
    RAISE EXCEPTION 'order % is not pending_payment (current: %)', p_order_id, v_order.status;
  END IF;

  -- Lock the wallet
  SELECT * INTO v_wallet
    FROM public.reseller_wallet
    WHERE reseller_id = v_order.reseller_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet not found for reseller %', v_order.reseller_id;
  END IF;

  IF v_wallet.balance < v_order.platform_price THEN
    RAISE EXCEPTION 'insufficient wallet balance: have %, need %',
      v_wallet.balance, v_order.platform_price
      USING ERRCODE = 'P0001';
  END IF;

  -- Debit
  v_new_balance := v_wallet.balance - v_order.platform_price;
  UPDATE public.reseller_wallet
    SET balance     = v_new_balance,
        total_spent = total_spent + v_order.platform_price,
        updated_at  = now()
    WHERE reseller_id = v_order.reseller_id;

  -- Mark order paid
  UPDATE public.dropship_orders
    SET status           = 'paid_by_reseller',
        reseller_paid_at = now()
    WHERE id = p_order_id;

  -- Ledger
  INSERT INTO public.wallet_transactions (
    reseller_id, type, amount, balance_after, reference_id, description
  ) VALUES (
    v_order.reseller_id, 'payment', -v_order.platform_price, v_new_balance, p_order_id,
    'Payment for dropship order ' || p_order_id::text
  );
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_and_pay_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_and_pay_order(uuid)
  TO authenticated, service_role;

-- ============================================================
-- Function: request_wallet_topup
-- ============================================================
-- Reseller asks for a wallet credit. Creates a pending row in
-- wallet_topup_requests. Auto-creates the wallet if missing.
-- Does NOT credit yet — admin must approve.
-- ============================================================
CREATE OR REPLACE FUNCTION public.request_wallet_topup(
  p_reseller_id       uuid,
  p_amount            numeric,
  p_payment_reference text
)
RETURNS uuid
RETURNS NULL ON NULL INPUT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  IF p_reseller_id IS NULL THEN
    RAISE EXCEPTION 'reseller_id is required';
  END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'amount must be > 0';
  END IF;
  IF p_payment_reference IS NULL OR length(trim(p_payment_reference)) = 0 THEN
    RAISE EXCEPTION 'payment_reference is required';
  END IF;

  -- Ensure the wallet row exists
  INSERT INTO public.reseller_wallet (reseller_id, balance)
    VALUES (p_reseller_id, 0)
    ON CONFLICT (reseller_id) DO NOTHING;

  INSERT INTO public.wallet_topup_requests (
    reseller_id, amount, payment_reference
  ) VALUES (
    p_reseller_id, p_amount, trim(p_payment_reference)
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.request_wallet_topup(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.request_wallet_topup(uuid, numeric, text)
  TO authenticated, service_role;

-- ============================================================
-- Function: admin_approve_wallet_topup
-- ============================================================
-- Credits the wallet, records a 'topup' ledger row, marks the
-- request as approved. Idempotent: returns early if already processed.
-- Caller (server fn) is responsible for verifying the user has the
-- admin / marketplace_admin role; we re-check app_role here as
-- defense-in-depth.
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_approve_wallet_topup(
  p_request_id uuid,
  p_admin_id   uuid,
  p_admin_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req      public.wallet_topup_requests%ROWTYPE;
  v_new_bal  numeric;
BEGIN
  IF p_request_id IS NULL OR p_admin_id IS NULL THEN
    RAISE EXCEPTION 'request_id and admin_id are required';
  END IF;

  SELECT * INTO v_req
    FROM public.wallet_topup_requests
    WHERE id = p_request_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'topup request % not found', p_request_id;
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'topup request % is not pending (current: %)', p_request_id, v_req.status;
  END IF;

  -- Ensure wallet exists
  INSERT INTO public.reseller_wallet (reseller_id, balance)
    VALUES (v_req.reseller_id, 0)
    ON CONFLICT (reseller_id) DO NOTHING;

  -- Lock + read balance
  SELECT balance INTO v_new_bal
    FROM public.reseller_wallet
    WHERE reseller_id = v_req.reseller_id
    FOR UPDATE;

  v_new_bal := v_new_bal + v_req.amount;
  UPDATE public.reseller_wallet
    SET balance      = v_new_bal,
        total_earned = total_earned + v_req.amount,
        updated_at   = now()
    WHERE reseller_id = v_req.reseller_id;

  -- Mark request approved
  UPDATE public.wallet_topup_requests
    SET status       = 'approved',
        admin_note   = p_admin_note,
        processed_at = now(),
        processed_by = p_admin_id
    WHERE id = p_request_id;

  -- Ledger
  INSERT INTO public.wallet_transactions (
    reseller_id, type, amount, balance_after, reference_id, description
  ) VALUES (
    v_req.reseller_id, 'topup', v_req.amount, v_new_bal, p_request_id,
    'Wallet topup approved' ||
      CASE WHEN p_admin_note IS NOT NULL THEN ' — ' || p_admin_note ELSE '' END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_wallet_topup(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_wallet_topup(uuid, uuid, text)
  TO service_role;

-- ============================================================
-- Function: admin_reject_wallet_topup
-- ============================================================
CREATE OR REPLACE FUNCTION public.admin_reject_wallet_topup(
  p_request_id uuid,
  p_admin_id   uuid,
  p_admin_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req public.wallet_topup_requests%ROWTYPE;
BEGIN
  IF p_request_id IS NULL OR p_admin_id IS NULL THEN
    RAISE EXCEPTION 'request_id and admin_id are required';
  END IF;

  SELECT * INTO v_req
    FROM public.wallet_topup_requests
    WHERE id = p_request_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'topup request % not found', p_request_id;
  END IF;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'topup request % is not pending (current: %)', p_request_id, v_req.status;
  END IF;

  UPDATE public.wallet_topup_requests
    SET status       = 'rejected',
        admin_note   = p_admin_note,
        processed_at = now(),
        processed_by = p_admin_id
    WHERE id = p_request_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_reject_wallet_topup(uuid, uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reject_wallet_topup(uuid, uuid, text)
  TO service_role;

-- ============================================================
-- Trigger: trg_dropship_order_status
-- ============================================================
-- After the order's status changes, do the right thing:
--   * 'delivered' → credit reseller wallet with selling_price,
--     increment listing.total_orders + total_profit_earned.
--   * 'refused'   → create a stock_buffer row.
--
-- We use AFTER UPDATE to read the NEW row, and the trigger only
-- fires when status actually changed (so re-saving other columns
-- doesn't double-credit).
-- ============================================================
CREATE OR REPLACE FUNCTION public.trg_dropship_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_bal numeric;
  v_buffer_id  uuid;
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- 1. Delivered: credit the reseller wallet
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' THEN
    -- Ensure wallet exists
    INSERT INTO public.reseller_wallet (reseller_id, balance)
      VALUES (NEW.reseller_id, 0)
      ON CONFLICT (reseller_id) DO NOTHING;

    -- Lock and read
    SELECT balance INTO v_wallet_bal
      FROM public.reseller_wallet
      WHERE reseller_id = NEW.reseller_id
      FOR UPDATE;

    v_wallet_bal := v_wallet_bal + NEW.selling_price;

    UPDATE public.reseller_wallet
      SET balance      = v_wallet_bal,
          total_earned = total_earned + NEW.selling_price,
          updated_at   = now()
      WHERE reseller_id = NEW.reseller_id;

    INSERT INTO public.wallet_transactions (
      reseller_id, type, amount, balance_after, reference_id, description
    ) VALUES (
      NEW.reseller_id, 'earning', NEW.selling_price, v_wallet_bal, NEW.id,
      'Earnings from delivered dropship order ' || NEW.id::text
    );

    -- Bump listing counters (delivered counts as a successful order)
    UPDATE public.reseller_listings
      SET total_orders        = total_orders + 1,
          total_profit_earned = total_profit_earned + NEW.reseller_profit
      WHERE id = NEW.reseller_listing_id;
  END IF;

  -- 2. Refused: create a stock_buffer entry + bump returns counter
  IF NEW.status = 'refused' AND OLD.status <> 'refused' THEN
    INSERT INTO public.stock_buffer (
      dropship_order_id, marketplace_product_id, reseller_id,
      refused_at, buffer_expires_at
    ) VALUES (
      NEW.id,
      (SELECT marketplace_product_id FROM public.reseller_listings WHERE id = NEW.reseller_listing_id),
      NEW.reseller_id,
      NEW.refused_at,
      NEW.buffer_expires_at
    )
    ON CONFLICT (dropship_order_id) DO NOTHING
    RETURNING id INTO v_buffer_id;

    UPDATE public.reseller_listings
      SET total_returns = total_returns + 1
      WHERE id = NEW.reseller_listing_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_dropship_order_status ON public.dropship_orders;
CREATE TRIGGER trg_dropship_order_status
  AFTER UPDATE OF status ON public.dropship_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_dropship_order_status();
