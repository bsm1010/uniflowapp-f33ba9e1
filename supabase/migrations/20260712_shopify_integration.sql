-- Shopify Integration tables

-- Connection to a Shopify store
CREATE TABLE IF NOT EXISTS shopify_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  shop_domain TEXT NOT NULL,
  access_token TEXT NOT NULL,
  shop_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sync_products BOOLEAN NOT NULL DEFAULT true,
  sync_orders BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_domain)
);

-- Maps Shopify product IDs to Fennecly product IDs
CREATE TABLE IF NOT EXISTS shopify_product_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shopify_product_id BIGINT NOT NULL,
  fennecly_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sync_direction TEXT NOT NULL DEFAULT 'shopify_to_fennecly' CHECK (sync_direction IN ('shopify_to_fennecly', 'fennecly_to_shopify', 'bidirectional')),
  UNIQUE(user_id, shopify_product_id)
);

-- Maps Shopify order IDs to Fennecly order IDs
CREATE TABLE IF NOT EXISTS shopify_order_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shopify_order_id BIGINT NOT NULL,
  fennecly_order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, shopify_order_id)
);

-- Sync log for tracking sync operations
CREATE TABLE IF NOT EXISTS shopify_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('products', 'orders', 'full')),
  direction TEXT NOT NULL CHECK (direction IN ('import', 'export', 'bidirectional')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  items_processed INT NOT NULL DEFAULT 0,
  items_created INT NOT NULL DEFAULT 0,
  items_updated INT NOT NULL DEFAULT 0,
  items_failed INT NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- RLS policies
ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_product_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_order_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own shopify connections" ON shopify_connections FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own product maps" ON shopify_product_map FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own order maps" ON shopify_order_map FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users manage own sync logs" ON shopify_sync_log FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_shopify_product_map_user ON shopify_product_map(user_id);
CREATE INDEX idx_shopify_product_map_shopify ON shopify_product_map(shopify_product_id);
CREATE INDEX idx_shopify_order_map_user ON shopify_order_map(user_id);
CREATE INDEX idx_shopify_sync_log_user ON shopify_sync_log(user_id, started_at DESC);
