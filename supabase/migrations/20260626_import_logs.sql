-- Import logs table for tracking Excel/CSV product imports

CREATE TABLE IF NOT EXISTS import_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text DEFAULT 'products',
  total_rows int DEFAULT 0,
  imported_rows int DEFAULT 0,
  skipped_rows int DEFAULT 0,
  filename text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_logs_own" ON import_logs FOR ALL USING (merchant_id = auth.uid());
