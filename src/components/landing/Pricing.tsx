import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Tier = {
  key: string;
  name: string;
  desc: string;
  price: string;
  period: string;
  cta: string;
  features: string[];
  highlight: boolean;
  style: "beginner" | "pro" | "business" | "agency";
};

export function Pricing() {
  const { t } = useTranslation();

  const tiers: Tier[] = [
    {
      key: "beginner",
      name: t("pricing.beginner.name"),
      desc: t("pricing.beginner.desc"),
      price: "2,500",
      period: t("pricing.monthPeriod"),
      cta: t("pricing.beginner.cta"),
      style: "beginner",
      highlight: false,
      features: t("pricing.beginner.f", { returnObjects: true }) as string[],
    },
    {
      key: "pro",
      name: t("pricing.pro.name"),
      desc: t("pricing.pro.desc"),
      price: "4,900",
      period: t("pricing.monthPeriod"),
      cta: t("pricing.pro.cta"),
      style: "pro",
      highlight: true,
      features: t("pricing.pro.f", { returnObjects: true }) as string[],
    },
    {
      key: "business",
      name: t("pricing.business.name"),
      desc: t("pricing.business.desc"),
      price: "9,000",
      period: t("pricing.monthPeriod"),
      cta: t("pricing.business.cta"),
      style: "business",
      highlight: false,
      features: t("pricing.business.f", { returnObjects: true }) as string[],
    },
    {
      key: "agency",
      name: t("pricing.agency.name"),
      desc: t("pricing.agency.desc"),
      price: "29,990",
      period: t("pricing.monthPeriod"),
      cta: t("pricing.agency.cta"),
      style: "agency",
      highlight: false,
      features: t("pricing.agency.f", { returnObjects: true }) as string[],
    },
  ];

  const getCardClass = (style: Tier["style"]) => {
    switch (style) {
      case "beginner":
        return "border-cyan-400/20 dark:border-cyan-500/20 bg-gradient-to-b from-cyan-500/5 to-transparent";
      case "pro":
        return "border-violet-400/40 dark:border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-2xl shadow-violet-500/10 scale-[1.02]";
      case "business":
        return "border-amber-400/20 dark:border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent";
      case "agency":
        return "border-border/60 bg-gradient-to-b from-muted/50 to-card/50";
    }
  };

  const getCheckClass = (style: Tier["style"]) => {
    switch (style) {
      case "beginner":
        return "text-cyan-500";
      case "pro":
        return "text-violet-500";
      case "business":
        return "text-amber-500";
      case "agency":
        return "text-fuchsia-500";
    }
  };

  const getPriceClass = (style: Tier["style"]) => {
    switch (style) {
      case "beginner":
        return "text-cyan-600 dark:text-cyan-400";
      case "pro":
        return "text-violet-600 dark:text-violet-300";
      case "business":
        return "text-amber-600 dark:text-amber-300";
      case "agency":
        return "bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent";
    }
  };

  const getBadge = (style: Tier["style"]) => {
    switch (style) {
      case "pro":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-4 py-1 shadow-lg shadow-violet-500/30 whitespace-nowrap">
            {t("pricing.popular")}
          </div>
        );
      case "business":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-4 py-1 whitespace-nowrap">
            {t("pricing.bestValue")}
          </div>
        );
      case "agency":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white text-xs font-semibold px-4 py-1 whitespace-nowrap">
            {t("pricing.exclusive")}
          </div>
        );
      default:
        return null;
    }
  };

  const getButton = (tier: Tier) => {
    const cls: Record<Tier["style"], string> = {
      beginner: "bg-cyan-600 hover:bg-cyan-500 text-white",
      pro: "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25",
      business: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white",
      agency: "bg-gradient-to-r from-fuchsia-600 via-violet-600 to-cyan-600 hover:opacity-90 text-white",
    };
    return <Button className={`mt-6 w-full h-12 rounded-xl font-semibold ${cls[tier.style]}`}>{tier.cta}</Button>;
  };

  return (
    <section id="pricing" className="py-20 md:py-28 relative">
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-violet-400/5 dark:bg-violet-500/5 rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-fuchsia-400/5 dark:bg-fuchsia-500/5 rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300"
          >
            Pricing
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-3xl md:text-5xl font-bold tracking-tight"
          >
            {t("pricing.titleA")}{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {t("pricing.titleB")}
            </span>{" "}
            {t("pricing.titleC")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-muted-foreground text-lg"
          >
            {t("pricing.subtitle")}
          </motion.p>
        </div>

        {/* Trial card */}
        <div className="mt-16 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-border/60 bg-muted/30 backdrop-blur-xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold">{t("pricing.trial.title")}</span>
                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full border border-border/60">
                  {t("pricing.trial.noCard")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t("pricing.trial.desc")}
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold">20</span>
                <span className="text-muted-foreground text-sm">{t("pricing.trial.credits")}</span>
              </div>
              <Button variant="outline" className="rounded-xl px-6">
                {t("pricing.trial.cta")}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* 4 main plans */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.key}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-3xl border p-8 flex flex-col hover:-translate-y-1 transition-all duration-500 ${getCardClass(tier.style)}`}
            >
              {getBadge(tier.style)}
              <h3 className="text-lg font-semibold">{tier.name}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {tier.desc}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className={`text-4xl font-bold font-display ${getPriceClass(tier.style)}`}>
                  {tier.price}
                </span>
                <span className="text-sm text-muted-foreground">
                  {tier.period}
                </span>
              </div>
              {getButton(tier)}
              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${getCheckClass(tier.style)}`} />
                    <span className="text-foreground/80">
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
