import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Palette, Package, ShieldCheck, BarChart3, Sparkles } from "lucide-react";

const featureKeys = [
  { icon: LayoutGrid, key: "builder", gradient: "from-violet-500 via-fuchsia-500 to-pink-500" },
  { icon: Palette, key: "themes", gradient: "from-cyan-400 via-blue-500 to-indigo-600" },
  { icon: Package, key: "products", gradient: "from-amber-400 via-orange-500 to-rose-500" },
  { icon: ShieldCheck, key: "payments", gradient: "from-emerald-400 via-teal-500 to-cyan-600" },
  { icon: BarChart3, key: "analytics", gradient: "from-rose-500 via-pink-500 to-purple-600" },
  { icon: Sparkles, key: "builder", gradient: "from-indigo-500 via-purple-500 to-fuchsia-600" },
] as const;

export function Features() {
  const { t } = useTranslation();
  return (
    <section id="features" className="py-24 md:py-32 relative overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-dots [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)] pointer-events-none opacity-50"
      />
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 -left-40 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-500/10 via-transparent to-transparent blur-3xl pointer-events-none"
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 backdrop-blur px-3 py-1 text-xs font-medium text-primary uppercase tracking-wider">
            <Sparkles className="h-3 w-3" />
            {t("features.kicker")}
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold">
            {t("features.titleA")} <span className="text-gradient-brand">{t("features.titleB")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground">{t("features.subtitle")}</p>
        </motion.div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((f, i) => (
            <motion.div
              key={`${f.key}-${i}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              whileHover={{ y: -6 }}
              className="group relative rounded-2xl border border-border/60 bg-card p-7 shadow-soft hover:shadow-glow transition-all duration-300 overflow-hidden"
            >
              {/* Hover gradient glow */}
              <div
                className={`absolute -top-20 -right-20 h-48 w-48 rounded-full bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500`}
              />
              <div
                className={`relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.gradient} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
              >
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="relative mt-5 text-lg font-semibold">{t(`features.items.${f.key}.title`)}</h3>
              <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">{t(`features.items.${f.key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
