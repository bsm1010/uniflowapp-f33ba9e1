-- COD Manager tables
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS cod_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  delivery_company text NOT NULL,
  tracking_number text,
  customer_name text,
  amount int NOT NULL,
  status text CHECK (status IN ('in_transit', 'delivered', 'returned', 'collected')) DEFAULT 'in_transit',
  expected_transfer_date date,
  actual_transfer_date date,
  transfer_reference text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cod_transfers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  delivery_company text NOT NULL,
  amount int NOT NULL,
  transfer_date date NOT NULL,
  reference text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cod_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE cod_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cod_own" ON cod_collections FOR ALL USING (merchant_id = auth.uid());
CREATE POLICY "transfers_own" ON cod_transfers FOR ALL USING (merchant_id = auth.uid());

CREATE INDEX cod_collections_merchant_idx ON cod_collections(merchant_id);
CREATE INDEX cod_collections_status_idx ON cod_collections(status);
CREATE INDEX cod_transfers_merchant_idx ON cod_transfers(merchant_id);
