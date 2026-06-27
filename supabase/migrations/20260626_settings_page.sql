-- Settings page: add missing columns to store_settings
-- Run this in Supabase SQL Editor

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS rc_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS nif_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS tva_rate numeric(5,2) DEFAULT 19.00,
  ADD COLUMN IF NOT EXISTS store_favicon_url text DEFAULT '';
