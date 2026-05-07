import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, UserCheck, Pause, Play, Search, Smile, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAIAgent } from "@/hooks/use-ai-agent";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { sendMerchantMessage, toggleConversationMode, generateAIReply } from "@/lib/ai-agent/ai-reply.functions";
import { cn } from "@/lib/utils";
import type { Conversation, Message } from "@/lib/ai-agent/types";

function ConversationList() {
  const { conversations, activeConversation, setActiveConversationId } = useAIAgent();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter(
    (c) =>
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full md:w-80 border-r flex flex-col bg-background/50 backdrop-blur-sm">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/50 border-0 h-9"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Bot className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No conversations yet</p>
            <p className="text-xs mt-1">Messages will appear here when customers DM your Instagram</p>
          </div>
        )}
        <AnimatePresence>
          {filtered.map((conv) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveConversationId(conv.id)}
              className={cn(
                "w-full p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors border-b border-border/30",
                activeConversation?.id === conv.id && "bg-primary/5 border-l-2 border-l-primary"
              )}
            >
              <div className="relative shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                  {conv.customer_name?.[0]?.toUpperCase() || conv.customer_username?.[0]?.toUpperCase() || "?"}
                </div>
                {conv.mode === "ai" && (
                  <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-violet-500 border-2 border-background flex items-center justify-center">
                    <Bot className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm truncate">
                    {conv.customer_name || conv.customer_username || "Unknown"}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {conv.last_message_text || "No messages"}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      conv.mode === "ai"
                        ? "bg-violet-500/10 text-violet-600"
                        : "bg-blue-500/10 text-blue-600"
                    )}
                  >
                    {conv.mode === "ai" ? "AI" : "Human"}
                  </span>
                  {conv.last_message_at && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(conv.last_message_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Message }) {
  const isCustomer = msg.sender_type === "customer";
  const isAI = msg.is_ai_generated;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn("flex gap-2 max-w-[80%]", isCustomer ? "self-start" : "self-end flex-row-reverse")}
    >
      <div
        className={cn(
          "h-7 w-7 rounded-full shrink-0 flex items-center justify-center text-xs",
          isCustomer
            ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white"
            : isAI
              ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white"
              : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white"
        )}
      >
        {isCustomer ? <User className="h-3.5 w-3.5" /> : isAI ? <Bot className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
      </div>
      <div
        className={cn(
          "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isCustomer
            ? "bg-muted rounded-tl-sm"
            : isAI
              ? "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-tr-sm"
              : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-tr-sm"
        )}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
        {msg.voice_transcript && (
          <div className="mt-2 pt-2 border-t border-white/20 text-xs opacity-80">
            🎤 Transcript: {msg.voice_transcript}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className={cn("text-[10px]", isCustomer ? "text-muted-foreground" : "opacity-60")}>
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isAI && <span className="text-[10px] opacity-60">• AI</span>}
        </div>
      </div>
    </motion.div>
  );
}

function ChatArea() {
  const { activeConversation, messages, setActiveConversationId } = useAIAgent();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendMsg = useServerFn(sendMerchantMessage);
  const toggleMode = useServerFn(toggleConversationMode);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-3">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center">
            <Bot className="h-8 w-8 text-violet-500" />
          </div>
          <h3 className="font-semibold text-lg">AI Sales Agent</h3>
          <p className="text-sm text-muted-foreground max-w-xs">
            Select a conversation to view messages and manage AI responses
          </p>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    try {
      await sendMsg({ data: { conversationId: activeConversation.id, content: text } });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const handleToggleMode = async () => {
    const newMode = activeConversation.mode === "ai" ? "human" : "ai";
    await toggleMode({ data: { conversationId: activeConversation.id, mode: newMode as any } });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Chat header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button className="md:hidden mr-2 text-muted-foreground" onClick={() => setActiveConversationId(null)}>
            ←
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
            {activeConversation.customer_name?.[0]?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-semibold text-sm">
              {activeConversation.customer_name || activeConversation.customer_username}
            </p>
            <p className="text-xs text-muted-foreground">@{activeConversation.customer_username}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeConversation.mode === "ai" ? "default" : "outline"}
            onClick={handleToggleMode}
            className={cn(
              "gap-1.5 h-8 text-xs rounded-full",
              activeConversation.mode === "ai"
                ? "bg-violet-500 hover:bg-violet-600"
                : ""
            )}
          >
            {activeConversation.mode === "ai" ? (
              <>
                <Pause className="h-3 w-3" /> Take Over
              </>
            ) : (
              <>
                <Play className="h-3 w-3" /> Resume AI
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <AnimatePresence>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No messages in this conversation</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3">
        {activeConversation.mode === "ai" && (
          <div className="mb-2 flex items-center gap-2 text-xs text-violet-600 bg-violet-500/5 rounded-lg px-3 py-1.5">
            <Bot className="h-3.5 w-3.5" />
            AI is handling this conversation
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeConversation.mode === "human" ? "Type a message..." : "AI is responding — switch to manual to type"}
            disabled={activeConversation.mode === "ai"}
            className="flex-1 bg-muted/50 border-0 h-10 rounded-xl"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || sending || activeConversation.mode === "ai"}
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function LiveChat() {
  const { activeConversation } = useAIAgent();

  return (
    <div className="flex h-[calc(100vh-12rem)] rounded-2xl border shadow-lg overflow-hidden bg-background">
      <div className={cn("md:flex", activeConversation ? "hidden md:flex" : "flex w-full")}>
        <ConversationList />
      </div>
      <div className={cn("flex-1", !activeConversation ? "hidden md:flex" : "flex")}>
        <ChatArea />
      </div>
    </div>
  );
}
