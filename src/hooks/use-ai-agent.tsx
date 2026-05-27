import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Conversation, Message, InstagramConnection, AIAgentSettings } from "@/lib/ai-agent/types";

interface AIAgentContextValue {
  connection: InstagramConnection | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  settings: AIAgentSettings | null;
  loading: boolean;
  setActiveConversationId: (id: string | null) => void;
  refreshConversations: () => void;
  refreshSettings: () => void;
}

const AIAgentContext = createContext<AIAgentContextValue | undefined>(undefined);

export function AIAgentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connection, setConnection] = useState<InstagramConnection | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<AIAgentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const activeConversation = conversations.find((c) => c.id === activeConvId) ?? null;

  const loadConversations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ig_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("last_message_at", { ascending: false });
    setConversations((data as any[]) ?? []);
  };

  const loadSettings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ai_agent_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSettings(data as any);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from("instagram_connections").select("*").eq("user_id", user.id).maybeSingle(),
      loadConversations(),
      loadSettings(),
    ]).then(([connRes]) => {
      setConnection(connRes.data as any);
      setLoading(false);
    });
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConvId || !user) {
      setMessages([]);
      return;
    }
    supabase
      .from("ig_messages")
      .select("*")
      .eq("conversation_id", activeConvId)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as any[]) ?? []));

    // Mark as read
    supabase
      .from("ig_conversations")
      .update({ unread_count: 0 })
      .eq("id", activeConvId);
  }, [activeConvId, user]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const convChannel = supabase
      .channel("ig-conversations")
      .on("postgres_changes", { event: "*", schema: "public", table: "ig_conversations", filter: `user_id=eq.${user.id}` }, () => {
        loadConversations();
      })
      .subscribe();

    const msgChannel = supabase
      .channel("ig-messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ig_messages", filter: `user_id=eq.${user.id}` }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.conversation_id === activeConvId) {
          setMessages((prev) => [...prev, newMsg]);
        }
        loadConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(convChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [user, activeConvId]);

  return (
    <AIAgentContext.Provider
      value={{
        connection,
        conversations,
        activeConversation,
        messages,
        settings,
        loading,
        setActiveConversationId: setActiveConvId,
        refreshConversations: loadConversations,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </AIAgentContext.Provider>
  );
}

export function useAIAgent() {
  const ctx = useContext(AIAgentContext);
  if (!ctx) throw new Error("useAIAgent must be used within AIAgentProvider");
  return ctx;
}
