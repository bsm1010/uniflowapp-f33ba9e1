-- Add custom_css column for the visual editor
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS custom_css text DEFAULT '';
