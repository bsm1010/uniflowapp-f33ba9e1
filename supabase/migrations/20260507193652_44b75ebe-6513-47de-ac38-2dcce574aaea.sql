
-- Instagram connections
CREATE TABLE public.instagram_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instagram_user_id text,
  instagram_username text,
  page_id text,
  page_name text,
  access_token text,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'disconnected',
  last_synced_at timestamptz,
  profile_picture_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage instagram connections" ON public.instagram_connections FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Conversations
CREATE TABLE public.ig_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  instagram_conversation_id text,
  customer_instagram_id text NOT NULL,
  customer_username text NOT NULL DEFAULT '',
  customer_name text NOT NULL DEFAULT '',
  customer_profile_pic text,
  status text NOT NULL DEFAULT 'active',
  mode text NOT NULL DEFAULT 'ai',
  last_message_text text,
  last_message_at timestamptz DEFAULT now(),
  unread_count integer NOT NULL DEFAULT 0,
  sentiment text DEFAULT 'neutral',
  ai_confidence numeric DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ig_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage ig conversations" ON public.ig_conversations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_ig_conversations_user_status ON public.ig_conversations(user_id, status);

-- Messages
CREATE TABLE public.ig_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ig_conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  instagram_message_id text,
  sender_type text NOT NULL DEFAULT 'customer',
  content text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text',
  is_ai_generated boolean NOT NULL DEFAULT false,
  voice_audio_url text,
  voice_transcript text,
  attachments jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ig_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view ig messages" ON public.ig_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role inserts ig messages" ON public.ig_messages FOR INSERT WITH CHECK (auth.role() = 'service_role' OR auth.uid() = user_id);
CREATE INDEX idx_ig_messages_conversation ON public.ig_messages(conversation_id, created_at);

-- AI Agent Settings
CREATE TABLE public.ai_agent_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  personality text NOT NULL DEFAULT 'friendly',
  tone text NOT NULL DEFAULT 'casual',
  language_mode text NOT NULL DEFAULT 'auto',
  darija_level text NOT NULL DEFAULT 'medium',
  reply_delay_seconds integer NOT NULL DEFAULT 3,
  auto_reply boolean NOT NULL DEFAULT true,
  forbidden_words text[] DEFAULT '{}',
  custom_instructions text NOT NULL DEFAULT '',
  faq_entries jsonb NOT NULL DEFAULT '[]',
  greeting_message text NOT NULL DEFAULT 'مرحبا! كيفاش نقدر نعاونك؟',
  suggest_human_takeover boolean NOT NULL DEFAULT true,
  max_ai_turns integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_agent_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage ai agent settings" ON public.ai_agent_settings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- AI Agent Analytics (daily snapshots)
CREATE TABLE public.ai_agent_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_conversations integer NOT NULL DEFAULT 0,
  ai_replies integer NOT NULL DEFAULT 0,
  human_replies integer NOT NULL DEFAULT 0,
  voice_messages_processed integer NOT NULL DEFAULT 0,
  avg_response_time_ms integer NOT NULL DEFAULT 0,
  ai_success_rate numeric NOT NULL DEFAULT 0,
  sales_generated numeric NOT NULL DEFAULT 0,
  top_questions jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.ai_agent_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view ai analytics" ON public.ai_agent_analytics FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role manages ai analytics" ON public.ai_agent_analytics FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Enable realtime for conversations and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ig_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ig_messages;

-- Updated_at triggers
CREATE TRIGGER set_updated_at_instagram_connections BEFORE UPDATE ON public.instagram_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_ig_conversations BEFORE UPDATE ON public.ig_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_updated_at_ai_agent_settings BEFORE UPDATE ON public.ai_agent_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
