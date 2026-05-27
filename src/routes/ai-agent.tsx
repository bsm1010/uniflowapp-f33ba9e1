import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bot, MessageSquare, Mic, BarChart3, Instagram, Zap, ShieldCheck, Globe, ArrowRight, Check, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ai-agent")({
  component: AIAgentLanding,
  head: () => ({
    meta: [
      { title: "AI Sales Agent — Your AI Employee For Instagram Sales | Fennecly" },
      { name: "description", content: "Automate Instagram DMs with AI that understands Darija, Arabic, French & Arabizi. Boost sales with smart product recommendations." },
    ],
  }),
});

const features = [
  {
    icon: Bot,
    title: "AI Auto-Reply",
    description: "Instant smart replies to customer DMs. Understands Darija, Arabizi, French & Arabic.",
    gradient: "from-violet-500 to-indigo-600",
  },
  {
    icon: Mic,
    title: "Voice Understanding",
    description: "Processes voice messages, transcribes them, and generates intelligent responses.",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    icon: MessageSquare,
    title: "Live Chat Dashboard",
    description: "Real-time conversation interface with AI/human mode switching and smart routing.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Sales Analytics",
    description: "Track AI performance, conversion rates, most asked questions and response times.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: ShieldCheck,
    title: "Human Takeover",
    description: "AI automatically suggests human handoff for complex issues. One-click switch.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Globe,
    title: "Multi-Language",
    description: "Seamlessly handles Darija, MSA, French, English and mixed-language conversations.",
    gradient: "from-purple-500 to-fuchsia-500",
  },
];

const demoConversation = [
  { sender: "customer", text: "salam, wach 3andkom hoodie noir taille L?" },
  { sender: "ai", text: "مرحبا! 👋 نعم عندنا الهودي الأسود متوفر بمقاس L. السعر 4500 دج مع التوصيل 🔥" },
  { sender: "customer", text: "ch7al delivery mta3 alger?" },
  { sender: "ai", text: "التوصيل لولاية الجزائر 400 دج. يوصلك في 2-3 أيام ✅ تحب تطلب؟" },
  { sender: "customer", text: "yih ndirha" },
  { sender: "ai", text: "تمام! 👌 أعطيني اسمك الكامل ورقم الهاتف وعنوان التوصيل باش نأكدلك الطلب." },
];

const testimonials = [
  { name: "Yassine B.", role: "Store Owner, Algiers", text: "AI Agent saved me 4 hours daily. It answers customer DMs even at 3 AM!", rating: 5 },
  { name: "Amira K.", role: "Fashion Brand, Oran", text: "The Darija understanding is incredible. Customers think they're talking to a real person.", rating: 5 },
  { name: "Mohamed R.", role: "Electronics Store", text: "Sales increased 40% since we enabled AI replies. It recommends products perfectly.", rating: 5 },
];

function AIAgentLanding() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/5 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 pt-24 pb-20">
          <nav className="flex items-center justify-between mb-16">
            <Link to="/" className="font-bold text-xl">Fennecly</Link>
            <Link to="/login">
              <Button variant="outline" className="rounded-full">Sign In</Button>
            </Link>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 text-violet-600 text-sm font-medium mb-6"
            >
              <Zap className="h-4 w-4" />
              Powered by AI — No coding required
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              Your AI Employee
              <br />
              <span className="bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 bg-clip-text text-transparent">
                For Instagram Sales
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mt-6 max-w-xl mx-auto"
            >
              Automate customer conversations, recommend products, and close sales 24/7 — in Darija, Arabic, French & Arabizi.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center mt-8"
            >
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-8 h-12 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/25 text-base gap-2">
                  Start Free <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="rounded-full px-8 h-12 text-base">
                Watch Demo
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Conversation */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">See AI Agent in Action</h2>
            <p className="text-muted-foreground mt-3">Real conversation with a customer in Algerian Darija</p>
          </div>
          <div className="max-w-md mx-auto space-y-3 p-6 rounded-2xl bg-muted/30 border">
            <div className="flex items-center gap-2 pb-3 border-b mb-4">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600" />
              <div>
                <p className="font-semibold text-sm">Customer</p>
                <p className="text-[10px] text-muted-foreground">Instagram DM</p>
              </div>
            </div>
            {demoConversation.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className={`flex ${msg.sender === "customer" ? "" : "justify-end"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.sender === "customer"
                      ? "bg-muted rounded-tl-sm"
                      : "bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-tr-sm"
                  }`}
                >
                  {msg.sender === "ai" && (
                    <div className="flex items-center gap-1 text-[10px] opacity-70 mb-1">
                      <Bot className="h-3 w-3" /> AI Agent
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Everything You Need</h2>
            <p className="text-muted-foreground mt-3">A complete AI customer support system for Instagram sellers</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-background border shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">Loved by Store Owners</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl border bg-background"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm mb-4">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Selling on Autopilot
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Connect your Instagram and let AI handle customer conversations while you focus on growing your business.
            </p>
            <Link to="/signup">
              <Button size="lg" className="rounded-full px-8 h-12 bg-white text-violet-600 hover:bg-gray-100 text-base font-semibold gap-2">
                Get Started Free <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Fennecly. All rights reserved.</p>
      </footer>
    </div>
  );
}
