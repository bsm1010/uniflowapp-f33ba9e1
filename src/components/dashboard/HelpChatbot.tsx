import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { helpChatbotReply } from "@/lib/ai/help-chatbot";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS_BY_LANG: Record<string, string[]> = {
  en: [
    "How do I add a product?",
    "How do I customize my store?",
    "How do I get more credits?",
    "Where can I see my orders?",
  ],
  fr: [
    "Comment ajouter un produit ?",
    "Comment personnaliser ma boutique ?",
    "Comment obtenir plus de crédits ?",
    "Où voir mes commandes ?",
  ],
  ar: [
    "كيف أضيف منتجاً؟",
    "كيف أخصص متجري؟",
    "كيف أحصل على المزيد من الرصيد؟",
    "أين أرى الطلبات؟",
  ],
};

const WELCOME_BY_LANG: Record<string, string> = {
  en: "Hi! 👋 I'm your Storely assistant. Ask me anything about how to use the platform.",
  fr: "Salut ! 👋 Je suis votre assistant Storely. Posez-moi vos questions sur la plateforme.",
  ar: "مرحباً! 👋 أنا مساعد Storely. اسألني عن أي شيء يخص استخدام المنصة.",
};

export function HelpChatbot() {
  const { i18n, t } = useTranslation();
  const lang = (["en", "fr", "ar"].includes(i18n.language) ? i18n.language : "en") as
    | "en"
    | "fr"
    | "ar";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: WELCOME_BY_LANG[lang] },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callHelp = useServerFn(helpChatbotReply);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 50);
    }
  }, [messages, open]);

  // Reset welcome when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) return [{ role: "assistant", content: WELCOME_BY_LANG[lang] }];
      return prev;
    });
  }, [lang]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { role: "user", content: trimmed };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const history = next.slice(-12); // cap context
      const result = await callHelp({ data: { language: lang, messages: history } });
      if (result.error) {
        setMessages((p) => [...p, { role: "assistant", content: `⚠️ ${result.error}` }]);
      } else {
        setMessages((p) => [
          ...p,
          { role: "assistant", content: result.reply || "..." },
        ]);
      }
    } catch (err) {
      console.error("help chatbot error", err);
      setMessages((p) => [
        ...p,
        {
          role: "assistant",
          content: "⚠️ Connection error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={t("help.open", { defaultValue: "Open help chat" })}
          className={cn(
            "fixed bottom-6 end-6 z-50 group",
            "h-14 w-14 rounded-full",
            "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500",
            "shadow-lg shadow-fuchsia-500/30",
            "flex items-center justify-center text-white",
            "hover:scale-110 active:scale-95 transition-all duration-300",
            "ring-4 ring-background",
          )}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -end-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden",
            "bottom-6 end-6",
            "w-[calc(100vw-2rem)] max-w-[400px] h-[600px] max-h-[calc(100vh-3rem)]",
            "rounded-2xl border border-border/60 bg-card shadow-2xl",
            "animate-in slide-in-from-bottom-4 fade-in duration-300",
          )}
        >
          {/* Header */}
          <div className="relative px-4 py-3 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">Storely Assistant</p>
                  <p className="text-[11px] text-white/80 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {t("help.online", { defaultValue: "Online — ask anything" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/15 flex items-center justify-center transition"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 bg-muted/20" ref={scrollRef as never}>
            <div className="p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    m.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                      m.role === "user"
                        ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white rounded-br-sm"
                        : "bg-card border border-border/60 rounded-bl-sm",
                    )}
                  >
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:my-2 prose-strong:text-foreground">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" />
                  </div>
                </div>
              )}

              {/* Suggestions (only when only welcome msg shown) */}
              {messages.length === 1 && !loading && (
                <div className="pt-2 space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium px-1">
                    {t("help.suggestions", { defaultValue: "Try asking" })}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SUGGESTIONS_BY_LANG[lang].map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-start text-xs px-3 py-2 rounded-xl border border-border/60 bg-card hover:bg-accent hover:border-accent-foreground/20 transition"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border/60 bg-card p-3 flex items-center gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("help.placeholder", {
                defaultValue: "Type your question…",
              })}
              disabled={loading}
              className="flex-1 h-10 rounded-xl"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:opacity-90 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
