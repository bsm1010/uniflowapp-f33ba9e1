import { Store, Package, BarChart3, ShieldCheck, ArrowRight, Zap } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Store, label: "Launch your store in minutes", gradient: "from-violet-500 to-fuchsia-500" },
  { icon: Package, label: "Manage products & orders", gradient: "from-cyan-500 to-blue-500" },
  { icon: BarChart3, label: "Track analytics & growth", gradient: "from-amber-500 to-orange-500" },
  { icon: ShieldCheck, label: "Secure payments built-in", gradient: "from-emerald-500 to-teal-500" },
];

const stats = [
  { value: "10K+", label: "Active stores" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9", label: "Rating" },
];

export function IllustrationSide() {
  return (
    <div className="hidden lg:flex items-center justify-center w-1/2 min-h-screen relative overflow-hidden">
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0f0a1a] via-[#1a0f2e] to-[#0a1628]" />

      {/* Mesh gradient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/30 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-fuchsia-600/25 rounded-full blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-[80px]" />

      {/* Grid pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 px-12 max-w-lg">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-1.5 mb-8"
        >
          <Zap className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-medium text-white/70">Built for Algerian e-commerce</span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl font-bold text-white leading-tight mb-3"
        >
          Start selling
          <br />
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">
            online today
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-white/50 text-sm leading-relaxed mb-10 max-w-sm"
        >
          Everything you need to build, manage, and grow your online store — with local payment
          integrations and delivery partners.
        </motion.p>

        {/* Features */}
        <div className="space-y-3 mb-10">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
              className="flex items-center gap-3.5 group"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${f.gradient} shadow-lg`}>
                <f.icon className="h-4 w-4 text-white" />
              </div>
              <span className="text-white/70 text-sm font-medium group-hover:text-white/90 transition-colors">
                {f.label}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center gap-8"
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* CTA hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-10 flex items-center gap-2 text-white/30 text-xs"
        >
          <span>Free to start</span>
          <span>·</span>
          <span>No credit card required</span>
          <ArrowRight className="h-3 w-3 ml-1" />
        </motion.div>
      </div>
    </div>
  );
}
