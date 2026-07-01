import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, BarChart3, Settings2, Instagram, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AIAgentProvider } from "@/hooks/use-ai-agent";
import { AgentOverview } from "@/components/ai-agent/AgentOverview";
import { LiveChat } from "@/components/ai-agent/LiveChat";
import { AITrainingPanel } from "@/components/ai-agent/AITrainingPanel";
import { AgentAnalytics } from "@/components/ai-agent/AgentAnalytics";
import { InstagramConnect } from "@/components/ai-agent/InstagramConnect";

export const Route = createFileRoute("/dashboard/ai-agent")({
  component: AIAgentPage,
  head: () => ({
    meta: [
      { title: "AI Sales Agent — Fennecly" },
      { name: "description", content: "AI-powered Instagram customer support" },
    ],
  }),
});

const tabs = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "chat", label: "Live Chat", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "training", label: "AI Settings", icon: Settings2 },
  { id: "connect", label: "Instagram", icon: Instagram },
] as const;

type TabId = (typeof tabs)[number]["id"];

function AIAgentPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  return (
    <AIAgentProvider>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader icon={Bot} title="AI Sales Agent" description="Your AI employee for Instagram sales" gradient="from-violet-500/20 to-indigo-500/20" />

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {activeTab === tab.id && (
                <motion.div
                  layoutId="ai-agent-tab"
                  className="absolute inset-0 bg-background rounded-lg shadow-sm"
                  transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview" && <AgentOverview />}
            {activeTab === "chat" && <LiveChat />}
            {activeTab === "analytics" && <AgentAnalytics />}
            {activeTab === "training" && <AITrainingPanel />}
            {activeTab === "connect" && <InstagramConnect />}
          </motion.div>
        </AnimatePresence>
      </div>
    </AIAgentProvider>
  );
}
