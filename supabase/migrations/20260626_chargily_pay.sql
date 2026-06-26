-- Chargily Pay integration: add payment fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'cod' CHECK (payment_method IN ('cod', 'chargily'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS chargily_checkout_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamptz;

-- Chargily toggle in store_settings
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS chargily_enabled boolean DEFAULT false;
