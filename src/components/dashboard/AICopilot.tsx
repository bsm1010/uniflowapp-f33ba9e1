import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, Loader2, Lightbulb, ChevronRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { copilotAction } from "@/lib/copilot/copilot-action";
import { getActionsForPage, type CopilotAction } from "@/lib/copilot/actions";

export function AICopilot() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState<CopilotAction[]>([]);
  const [activeAction, setActiveAction] = useState<CopilotAction | null>(null);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callCopilot = useServerFn(copilotAction);

  useEffect(() => {
    if (open) {
      setActions(getActionsForPage(location.pathname));
      setActiveAction(null);
      setResponse("");
    }
  }, [open, location.pathname]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [response, activeAction]);

  const handleAction = useCallback(async (action: CopilotAction) => {
    setActiveAction(action);
    setLoading(true);
    setResponse("");

    try {
      const { data: sessionData } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token ?? "";
      if (!accessToken) { setResponse("Please sign in first."); setLoading(false); return; }

      const result = await callCopilot({ data: { prompt: action.prompt, actionLabel: action.label, accessToken } });
      setResponse(result.response || "No response generated.");
    } catch (err: any) {
      setResponse(err?.message?.includes("INSUFFICIENT_CREDITS")
        ? "⚠️ You don't have enough credits. Please top up to use AI features."
        : `⚠️ ${err?.message || "Something went wrong. Please try again."}`);
    } finally {
      setLoading(false);
    }
  }, [callCopilot]);

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="AI Copilot"
          className={cn(
            "fixed bottom-20 end-6 z-50 group",
            "h-12 w-12 rounded-full",
            "shadow-lg shadow-purple-500/30",
            "flex items-center justify-center text-white",
            "hover:scale-110 active:scale-95 transition-all duration-300",
            "ring-4 ring-background",
          )}
          style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
        >
          <Sparkles className="h-5 w-5" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          className={cn(
            "fixed z-50 flex flex-col overflow-hidden",
            "bottom-6 end-6",
            "w-[calc(100vw-2rem)] max-w-[380px] h-[500px] max-h-[calc(100vh-3rem)]",
            "rounded-2xl border border-border/60 bg-card shadow-2xl",
            "animate-in slide-in-from-bottom-4 fade-in duration-300",
          )}
        >
          {/* Header */}
          <div
            className="relative px-4 py-3 text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A855F7)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">AI Copilot</p>
                  <p className="text-[10px] text-white/80">
                    Powered by Gemini
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 rounded-full hover:bg-white/15 flex items-center justify-center transition"
                aria-label="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1" ref={scrollRef as never}>
            <div className="p-3 space-y-2">
              {activeAction ? (
                <>
                  {/* Back button */}
                  <button
                    onClick={() => { setActiveAction(null); setResponse(""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <ChevronRight className="h-3 w-3 rotate-180" />
                    Back to actions
                  </button>

                  {/* Active action header */}
                  <div className="flex items-center gap-2 px-1">
                    <activeAction.icon className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">{activeAction.label}</span>
                  </div>

                  {/* Response */}
                  <div className="mt-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                    {loading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Thinking...
                      </div>
                    ) : response ? (
                      <div className="text-sm whitespace-pre-wrap leading-relaxed">{response}</div>
                    ) : null}
                  </div>
                </>
              ) : (
                <>
                  {/* Welcome */}
                  <div className="px-1 py-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      <Lightbulb className="h-3.5 w-3.5" />
                      Suggestions for this page
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-1.5">
                      {actions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleAction(action)}
                          className="w-full text-start flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/50 bg-card hover:bg-accent hover:border-accent-foreground/20 transition-all group"
                        >
                          <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:bg-purple-500/20 transition-colors">
                            <action.icon className="h-4 w-4 text-purple-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight">{action.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t border-border/60 bg-card px-3 py-2 shrink-0">
            <p className="text-[10px] text-muted-foreground text-center">
              AI Copilot — context-aware help for every page
            </p>
          </div>
        </div>
      )}
    </>
  );
}
