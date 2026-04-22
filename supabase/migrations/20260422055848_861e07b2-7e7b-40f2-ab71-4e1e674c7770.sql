-- Enable RLS on realtime.messages and add channel authorization
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can subscribe to their own channels" ON realtime.messages;
DROP POLICY IF EXISTS "Users can broadcast to their own channels" ON realtime.messages;

-- Allow authenticated users to receive Realtime messages ONLY on channels
-- whose topic ends with their own user id. This matches our client convention,
-- e.g. `notif-${user.id}`, `orders-${user.id}`, `profile-${user.id}`.
CREATE POLICY "Users can subscribe to their own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE '%' || auth.uid()::text
);

-- Same restriction for sending broadcast/presence messages
CREATE POLICY "Users can broadcast to their own channels"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() LIKE '%' || auth.uid()::text
);