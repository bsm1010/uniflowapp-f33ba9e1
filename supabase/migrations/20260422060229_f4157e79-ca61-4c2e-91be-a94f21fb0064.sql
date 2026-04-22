-- Remove the unrestricted public UPDATE policy on chatbot_conversations
DROP POLICY IF EXISTS "Anyone can update chatbot convo" ON public.chatbot_conversations;

-- Allow store owners to update their own conversations (e.g. mark as handled)
CREATE POLICY "Owners update chatbot convos"
ON public.chatbot_conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = store_owner_id)
WITH CHECK (auth.uid() = store_owner_id);