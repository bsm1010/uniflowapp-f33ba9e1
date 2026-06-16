import { Store, Package, BarChart3, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import dashboardShot from "@/assets/dashboard-shot-1.webp";

const features = [
  { icon: Store, label: "Launch your store in minutes", color: "from-violet-400 to-fuchsia-400" },
  { icon: Package, label: "Manage products & orders", color: "from-cyan-400 to-blue-400" },
  { icon: BarChart3, label: "Track analytics & growth", color: "from-amber-400 to-orange-400" },
  { icon: ShieldCheck, label: "Secure payments built-in", color: "from-emerald-400 to-teal-400" },
];

export function IllustrationSide() {
  return (
    <div className="hidden lg:flex items-center justify-center w-1/2 min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-600" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.2),transparent_50%)]" />

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl" />

      <div className="relative z-10 px-12 max-w-lg">
        {/* Dashboard screenshot */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative mb-10"
        >
          <div className="absolute -inset-4 bg-white/10 rounded-3xl blur-2xl" />
          <img
            src={dashboardShot}
            alt="Fennecly dashboard preview"
            className="relative w-full rounded-2xl shadow-2xl border border-white/20"
          />
        </motion.div>

        {/* Feature list */}
        <div className="space-y-4">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-4"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-white/80 text-sm font-medium">{f.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
