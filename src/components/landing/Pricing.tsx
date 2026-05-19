import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pricing() {
  const { t } = useTranslation();

  const tiers = [
    {
      key: "trial",
      price: t("pricing.trial.price"),
      period: t("pricing.trial.period"),
      highlight: false,
      style: "trial",
    },
    {
      key: "beginner",
      price: "2,500",
      period: "DA / " + t("pricing.month"),
      highlight: false,
      style: "beginner",
    },
    {
      key: "pro",
      price: "4,900",
      period: "DA / " + t("pricing.month"),
      highlight: true,
      style: "pro",
    },
    {
      key: "business",
      price: "9,000",
      period: "DA / " + t("pricing.month"),
      highlight: false,
      style: "business",
    },
    {
      key: "agency",
      price: "29,990",
      period: "DA / " + t("pricing.month"),
      highlight: false,
      style: "agency",
    },
  ];

  const getCardClass = (style: string, highlight: boolean) => {
    switch (style) {
      case "trial":
        return "border-border/40 bg-muted/30 shadow-sm";
      case "beginner":
        return "border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-card shadow-soft";
      case "pro":
        return "border-violet-500/50 bg-gradient-to-b from-violet-500/10 to-card shadow-glow scale-[1.03]";
      case "business":
        return "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-card shadow-soft";
      case "agency":
        return "border-transparent bg-gradient-to-b from-[#1a1a2e] to-[#16213e] shadow-2xl";
      default:
        return "border-border/60 bg-card shadow-soft";
    }
  };

  const getCheckClass = (style: string) => {
    switch (style) {
      case "trial": return "text-muted-foreground";
      case "beginner": return "text-blue-500";
      case "pro": return "text-violet-500";
      case "business": return "text-amber-500";
      case "agency": return "text-pink-500";
      default: return "text-primary";
    }
  };

  const getPriceClass = (style: string) => {
    switch (style) {
      case "trial": return "text-muted-foreground";
      case "beginner": return "text-blue-500";
      case "pro": return "text-violet-400";
      case "business": return "text-amber-400";
      case "agency": return "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent";
      default: return "text-foreground";
    }
  };

  const getBadge = (style: string) => {
    switch (style) {
      case "pro":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium px-3 py-1 shadow-glow whitespace-nowrap">
            {t("pricing.popular")}
          </div>
        );
      case "business":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-3 py-1 whitespace-nowrap">
            {t("pricing.bestValue")}
          </div>
        );
      case "agency":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-white text-xs font-medium px-3 py-1 whitespace-nowrap">
            {t("pricing.exclusive")}
          </div>
        );
      default:
        return null;
    }
  };

  const getButton = (style: string, tierKey: string) => {
    switch (style) {
      case "trial":
        return (
          <Button variant="outline" className="mt-6 w-full">
            {t(`pricing.${tierKey}.cta`)}
          </Button>
        );
      case "beginner":
        return (
          <Button className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white">
            {t(`pricing.${tierKey}.cta`)}
          </Button>
        );
      case "pro":
        return (
          <Button className="mt-6 w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white border-0">
            {t(`pricing.${tierKey}.cta`)}
          </Button>
        );
      case "business":
        return (
          <Button className="mt-6 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white border-0">
            {t(`pricing.${tierKey}.cta`)}
          </Button>
        );
      case "agency":
        return (
          <Button className="mt-6 w-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:opacity-90 text-white border-0">
            {t(`pricing.${tierKey}.cta`)}
          </Button>
        );
    }
  };

  return (
    <section id="pricing" className="py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">
            {t("pricing.kicker")}
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            {t("pricing.titleA")}{" "}
            <span className="text-gradient-brand">{t("pricing.titleB")}</span>{" "}
            {t("pricing.titleC")}
          </h2>
          <p className="mt-4 text-muted-foreground">{t("pricing.subtitle")}</p>
        </div>

        {/* Trial card — full width on top */}
        <div className="mt-16 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-border/40 bg-muted/30"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">{t("pricing.trial.name")}</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {t("pricing.trial.badge")}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{t("pricing.trial.desc")}</p>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">20</span>
                <span className="text-muted-foreground text-sm">{t("pricing.credits")}</span>
              </div>
              <Button variant="outline">{t("pricing.trial.cta")}</Button>
            </div>
          </motion.div>
        </div>

        {/* 4 main plans */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.filter((tier) => tier.key !== "trial").map((tier, i) => {
            const featuresRaw = t(`pricing.${tier.key}.f`, { returnObjects: true, defaultValue: [] });
            const features: string[] = Array.isArray(featuresRaw) ? featuresRaw as string[] : [];
            return (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative rounded-2xl border p-8 flex flex-col ${getCardClass(tier.style, tier.highlight)}`}
              >
                {getBadge(tier.style)}
                <h3 className={`text-lg font-semibold ${tier.style === "agency" ? "text-white" : ""}`}>
                  {t(`pricing.${tier.key}.name`)}
                </h3>
                <p className={`mt-1 text-sm ${tier.style === "agency" ? "text-white/60" : "text-muted-foreground"}`}>
                  {t(`pricing.${tier.key}.desc`)}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold font-display ${getPriceClass(tier.style)}`}>
                    {tier.price}
                  </span>
                  <span className={`text-sm ${tier.style === "agency" ? "text-white/50" : "text-muted-foreground"}`}>
                    {tier.period}
                  </span>
                </div>
                {getButton(tier.style, tier.key)}
                <ul className="mt-8 space-y-3 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 mt-0.5 shrink-0 ${getCheckClass(tier.style)}`} />
                      <span className={tier.style === "agency" ? "text-white/70" : "text-foreground/80"}>
                        {f}
                      </span>
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
