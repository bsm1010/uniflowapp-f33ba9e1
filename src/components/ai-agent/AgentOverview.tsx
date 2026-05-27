import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, MessageSquare, BarChart3, Settings2, Zap, Users, Mic, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIAgent } from "@/hooks/use-ai-agent";
import { cn } from "@/lib/utils";

export function AgentOverview() {
  const { conversations, connection } = useAIAgent();

  const totalConvos = conversations.length;
  const aiConvos = conversations.filter((c) => c.mode === "ai").length;
  const unread = conversations.reduce((s, c) => s + c.unread_count, 0);
  const activeConvos = conversations.filter((c) => c.status === "active").length;

  const stats = [
    { label: "Total Conversations", value: totalConvos, icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
    { label: "AI Handled", value: aiConvos, icon: Bot, color: "from-violet-500 to-purple-500" },
    { label: "Unread Messages", value: unread, icon: Zap, color: "from-amber-500 to-orange-500" },
    { label: "Active Now", value: activeConvos, icon: Users, color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Connection status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-2xl border p-4 flex items-center gap-4",
          connection?.status === "connected"
            ? "border-emerald-500/30 bg-emerald-500/5"
            : "border-amber-500/30 bg-amber-500/5"
        )}
      >
        <div
          className={cn(
            "h-3 w-3 rounded-full animate-pulse",
            connection?.status === "connected" ? "bg-emerald-500" : "bg-amber-500"
          )}
        />
        <div>
          <p className="font-semibold text-sm">
            {connection?.status === "connected"
              ? `Connected: @${connection.instagram_username}`
              : "Instagram not connected"}
          </p>
          <p className="text-xs text-muted-foreground">
            {connection?.status === "connected"
              ? `Last synced: ${connection.last_synced_at ? new Date(connection.last_synced_at).toLocaleString() : "Never"}`
              : "Connect your Instagram Business account to start"}
          </p>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-[0.07]`} />
              <CardContent className="p-5 relative">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} shadow-sm`}>
                    <stat.icon className="h-4 w-4 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              AI Response Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalConvos > 0 ? Math.round((aiConvos / totalConvos) * 100) : 0}%
            </p>
            <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${totalConvos > 0 ? (aiConvos / totalConvos) * 100 : 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mic className="h-4 w-4 text-purple-500" />
              Voice Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">Processed today</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Avg Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">&lt;3s</p>
            <p className="text-xs text-muted-foreground mt-1">AI average</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
