-- Store the ZR Express colis ID and bordereau status on the shipment/order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS zr_colis_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS bordereau_fetched_at timestamptz;

-- If you have a separate shipments table, add there too:
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS zr_colis_id text;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS bordereau_fetched_at timestamptz;

-- Index for batch queries
CREATE INDEX IF NOT EXISTS orders_zr_colis_id_idx ON orders(zr_colis_id) WHERE zr_colis_id IS NOT NULL;
