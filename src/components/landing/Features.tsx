import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LayoutGrid, Palette, Package, ShieldCheck, BarChart3 } from "lucide-react";

const featureKeys = [
  { icon: LayoutGrid, key: "builder" },
  { icon: Palette, key: "themes" },
  { icon: Package, key: "products" },
  { icon: ShieldCheck, key: "payments" },
  { icon: BarChart3, key: "analytics" },
] as const;

export function Features() {
  const { t } = useTranslation();
  return (
    <section id="features" className="py-14 md:py-20 relative">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">{t("features.kicker")}</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            {t("features.titleA")} <span className="text-gradient-brand">{t("features.titleB")}</span>
          </h2>
          <p className="mt-4 text-muted-foreground">{t("features.subtitle")}</p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featureKeys.map((f, i) => (
            <motion.div
              key={f.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              className="group relative rounded-2xl border border-border/60 bg-card p-7 shadow-soft hover:shadow-glow hover:-translate-y-1 transition-all duration-300"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-brand-foreground shadow-glow">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{t(`features.items.${f.key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`features.items.${f.key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
