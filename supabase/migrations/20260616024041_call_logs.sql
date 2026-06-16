CREATE TABLE call_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_phone text NOT NULL,
  customer_name text,
  channel text CHECK (channel IN ('whatsapp', 'phone')) DEFAULT 'whatsapp',
  outcome text CHECK (outcome IN ('answered', 'no_answer', 'callback', 'pending')) DEFAULT 'pending',
  note text,
  called_at timestamptz DEFAULT now()
);

ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "merchants manage own call logs" ON call_logs FOR ALL USING (merchant_id = auth.uid());
CREATE INDEX call_logs_order_id_idx ON call_logs(order_id);
CREATE INDEX call_logs_merchant_id_idx ON call_logs(merchant_id);
CREATE INDEX call_logs_called_at_idx ON call_logs(called_at DESC);
