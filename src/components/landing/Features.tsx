import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Palette, Package, ShieldCheck, BarChart3 } from "lucide-react";

const featureKeys = [
  { icon: LayoutGrid, key: "builder", color: "from-violet-400 to-fuchsia-400", span: "sm:col-span-2" },
  { icon: Palette, key: "themes", color: "from-cyan-400 to-blue-400", span: "" },
  { icon: Package, key: "products", color: "from-emerald-400 to-teal-400", span: "" },
  { icon: ShieldCheck, key: "payments", color: "from-amber-400 to-orange-400", span: "sm:col-span-2" },
  { icon: BarChart3, key: "analytics", color: "from-rose-400 to-pink-400", span: "" },
] as const;

export function Features() {
  const { t } = useTranslation();
  return (
    <section id="features" className="py-20 md:py-28 relative">
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-violet-400/10 dark:bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-72 h-72 bg-fuchsia-400/10 dark:bg-fuchsia-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300"
          >
            {t("features.kicker")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-3xl md:text-5xl font-bold tracking-tight"
          >
            {t("features.titleA")}{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {t("features.titleB")}
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-muted-foreground text-lg"
          >
            {t("features.subtitle")}
          </motion.p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {featureKeys.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`group relative rounded-3xl border border-border/60 bg-card/60 p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ${f.span}`}
            >
              <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${f.color} opacity-5`} />
              </div>

              <div className="relative">
                <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.color} shadow-lg`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mt-6 text-xl font-semibold">{t(`features.items.${f.key}.title`)}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {t(`features.items.${f.key}.desc`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
