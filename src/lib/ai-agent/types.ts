export type ConversationMode = "ai" | "human";
export type ConversationStatus = "active" | "closed" | "archived";
export type SenderType = "customer" | "merchant" | "ai";
export type MessageType = "text" | "voice" | "image" | "product_card";

export interface Conversation {
  id: string;
  user_id: string;
  instagram_conversation_id: string | null;
  customer_instagram_id: string;
  customer_username: string;
  customer_name: string;
  customer_profile_pic: string | null;
  status: ConversationStatus;
  mode: ConversationMode;
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
  sentiment: string | null;
  ai_confidence: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  instagram_message_id: string | null;
  sender_type: SenderType;
  content: string;
  message_type: MessageType;
  is_ai_generated: boolean;
  voice_audio_url: string | null;
  voice_transcript: string | null;
  attachments: any[];
  metadata: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface AIAgentSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  personality: string;
  tone: string;
  language_mode: string;
  darija_level: string;
  reply_delay_seconds: number;
  auto_reply: boolean;
  forbidden_words: string[];
  custom_instructions: string;
  faq_entries: { question: string; answer: string }[];
  greeting_message: string;
  suggest_human_takeover: boolean;
  max_ai_turns: number;
}

export interface AgentAnalytics {
  id: string;
  user_id: string;
  date: string;
  total_conversations: number;
  ai_replies: number;
  human_replies: number;
  voice_messages_processed: number;
  avg_response_time_ms: number;
  ai_success_rate: number;
  sales_generated: number;
  top_questions: { question: string; count: number }[];
}

export interface InstagramConnection {
  id: string;
  user_id: string;
  instagram_user_id: string | null;
  instagram_username: string | null;
  page_id: string | null;
  page_name: string | null;
  status: string;
  last_synced_at: string | null;
  profile_picture_url: string | null;
  created_at: string;
}
