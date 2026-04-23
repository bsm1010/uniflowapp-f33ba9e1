import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pricing() {
  const { t } = useTranslation();
  const tiers = [
    {
      key: "free",
      price: "$0",
      period: t("pricing.forever"),
      highlight: false,
    },
    {
      key: "pro",
      price: "$29",
      period: t("pricing.month"),
      highlight: true,
    },
    {
      key: "business",
      price: "$99",
      period: t("pricing.month"),
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">{t("pricing.kicker")}</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            {t("pricing.titleA")} <span className="text-gradient-brand">{t("pricing.titleB")}</span> {t("pricing.titleC")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("pricing.subtitle")}</p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((tier, i) => {
            const features = t(`pricing.${tier.key}.f`, { returnObjects: true }) as string[];
            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  tier.highlight
                    ? "border-primary/40 bg-card shadow-glow scale-[1.02]"
                    : "border-border/60 bg-card shadow-soft"
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand text-brand-foreground text-xs font-medium px-3 py-1 shadow-glow">
                    {t("pricing.popular")}
                  </div>
                )}
                <h3 className="text-lg font-semibold">{t(`pricing.${tier.key}.name`)}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{t(`pricing.${tier.key}.desc`)}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold font-display">{tier.price}</span>
                  <span className="text-muted-foreground text-sm">{tier.period}</span>
                </div>
                <Button
                  className={`mt-6 ${
                    tier.highlight ? "bg-gradient-brand text-brand-foreground hover:opacity-90" : ""
                  }`}
                  variant={tier.highlight ? "default" : "outline"}
                >
                  {t(`pricing.${tier.key}.cta`)}
                </Button>
                <ul className="mt-8 space-y-3 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground/80">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
