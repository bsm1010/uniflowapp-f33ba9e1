import { motion } from "framer-motion";
import { BarChart3, TrendingUp, MessageSquare, Bot, Users, Clock, Mic, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIAgent } from "@/hooks/use-ai-agent";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Demo chart data
const chartData = [
  { day: "Mon", conversations: 12, aiReplies: 10, humanReplies: 2 },
  { day: "Tue", conversations: 18, aiReplies: 15, humanReplies: 3 },
  { day: "Wed", conversations: 15, aiReplies: 13, humanReplies: 2 },
  { day: "Thu", conversations: 22, aiReplies: 19, humanReplies: 3 },
  { day: "Fri", conversations: 28, aiReplies: 24, humanReplies: 4 },
  { day: "Sat", conversations: 35, aiReplies: 30, humanReplies: 5 },
  { day: "Sun", conversations: 20, aiReplies: 17, humanReplies: 3 },
];

const pieData = [
  { name: "AI Handled", value: 78, color: "#8b5cf6" },
  { name: "Human Handled", value: 22, color: "#06b6d4" },
];

const topQuestions = [
  { question: "ch7al el prix?", count: 45 },
  { question: "wach disponible?", count: 38 },
  { question: "livraison mta3 alger?", count: 32 },
  { question: "3andkom la couleur noir?", count: 28 },
  { question: "ki ndirw lcommand?", count: 22 },
];

export function AgentAnalytics() {
  const { conversations } = useAIAgent();
  const totalConvos = conversations.length;
  const aiHandled = conversations.filter((c) => c.mode === "ai").length;

  const stats = [
    { label: "Total Conversations", value: totalConvos || 150, icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "AI Success Rate", value: "92%", icon: Bot, color: "text-violet-500", bg: "bg-violet-500/10" },
    { label: "Avg Response Time", value: "2.4s", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Sales Generated", value: "45,000 DA", icon: ShoppingCart, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Voice Processed", value: "23", icon: Mic, color: "text-pink-500", bg: "bg-pink-500/10" },
    { label: "Active Customers", value: "67", icon: Users, color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center mb-2`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations chart */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-violet-500" />
              Conversations This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="conversations" stroke="#8b5cf6" fill="url(#colorConv)" strokeWidth={2} />
                <Area type="monotone" dataKey="aiReplies" stroke="#06b6d4" fill="transparent" strokeWidth={1.5} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI vs Human pie */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-base">AI vs Human</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-sm">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}: {d.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Questions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Most Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{q.question}</p>
                  <div className="h-1.5 rounded-full bg-muted mt-1 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(q.count / topQuestions[0].count) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{q.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
