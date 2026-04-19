import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { UserPlus, Wand2, Rocket } from "lucide-react";

const stepKeys = [
  { icon: UserPlus, key: "create" },
  { icon: Wand2, key: "build" },
  { icon: Rocket, key: "launch" },
] as const;

export function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section id="how" className="py-24 md:py-32 bg-muted/30 relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">{t("how.kicker")}</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            {t("how.titleA")} <span className="text-gradient-brand">{t("how.titleB")}</span>
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3 relative">
          {stepKeys.map((s, i) => (
            <motion.div
              key={s.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl bg-card border border-border/60 p-8 shadow-soft text-center"
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-brand text-brand-foreground font-display font-semibold shadow-glow">
                {i + 1}
              </div>
              <div className="mx-auto mt-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{t(`how.steps.${s.key}.title`)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t(`how.steps.${s.key}.desc`)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
