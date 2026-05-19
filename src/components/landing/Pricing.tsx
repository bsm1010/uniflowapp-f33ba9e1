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
      name: "Beginner",
      desc: "Everything you need to launch your first store.",
      price: "2,500",
      period: "DA / month",
      cta: "Start Beginner",
      style: "beginner",
      highlight: false,
      features: [
        "250 credits",
        "1 online store",
        "300 orders",
        "SEO Optimizer",
        "Abandoned Cart Recovery",
        "Chatbot",
        "Analytics Integration",
        "1 domain",
        "All delivery services",
        "10 free themes",
        "24/7 support chat",
      ],
    },
    {
      key: "pro",
      name: "Pro",
      desc: "For growing brands ready to scale with AI.",
      price: "4,900",
      period: "DA / month",
      cta: "Start Pro",
      style: "pro",
      highlight: true,
      features: [
        "600 credits",
        "2 online stores",
        "700 orders",
        "AI Product Descriptions",
        "AI Image Enhancer",
        "AI Ad Generator",
        "SEO Optimizer",
        "Abandoned Cart Recovery",
        "Chatbot",
        "Analytics Integration",
        "Developer access",
        "2 domains",
        "All delivery services",
        "All premium themes",
        "24/7 support chat",
      ],
    },
    {
      key: "business",
      name: "Business",
      desc: "Advanced tools for serious sellers.",
      price: "9,000",
      period: "DA / month",
      cta: "Choose Business",
      style: "business",
      highlight: false,
      features: [
        "1,200 credits",
        "10 online stores",
        "3,000 orders",
        "Email Marketing",
        "All AI apps",
        "All Pro tools",
        "Developer access",
        "24/7 support chat",
      ],
    },
    {
      key: "agency",
      name: "Agency",
      desc: "Unlimited power for agencies and large teams.",
      price: "29,990",
      period: "DA / month",
      cta: "Contact sales",
      style: "agency",
      highlight: false,
      features: [
        "5,000 credits",
        "Unlimited online stores",
        "Unlimited orders",
        "Everything in Business",
        "100 customized boxes + 100 customized package bags",
        "24/7 support chat",
      ],
    },
  ];

  const getCardClass = (style: Tier["style"]) => {
    switch (style) {
      case "beginner":
        return "border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-card shadow-soft";
      case "pro":
        return "border-violet-500/50 bg-gradient-to-b from-violet-500/10 to-card shadow-glow scale-[1.03]";
      case "business":
        return "border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-card shadow-soft";
      case "agency":
        return "border-transparent bg-gradient-to-b from-[#1a1a2e] to-[#16213e] shadow-2xl";
    }
  };

  const getCheckClass = (style: Tier["style"]) => {
    switch (style) {
      case "beginner": return "text-blue-500";
      case "pro": return "text-violet-500";
      case "business": return "text-amber-500";
      case "agency": return "text-pink-500";
    }
  };

  const getPriceClass = (style: Tier["style"]) => {
    switch (style) {
      case "beginner": return "text-blue-500";
      case "pro": return "text-violet-400";
      case "business": return "text-amber-400";
      case "agency": return "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent";
    }
  };

  const getBadge = (style: Tier["style"]) => {
    switch (style) {
      case "pro":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium px-3 py-1 shadow-glow whitespace-nowrap">
            Most popular
          </div>
        );
      case "business":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium px-3 py-1 whitespace-nowrap">
            Best value
          </div>
        );
      case "agency":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-white text-xs font-medium px-3 py-1 whitespace-nowrap">
            Exclusive
          </div>
        );
      default:
        return null;
    }
  };

  const getButton = (tier: Tier) => {
    const cls: Record<Tier["style"], string> = {
      beginner: "bg-blue-500 hover:bg-blue-600 text-white",
      pro: "bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:opacity-90 text-white border-0",
      business: "bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 text-white border-0",
      agency: "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 hover:opacity-90 text-white border-0",
    };
    return <Button className={`mt-6 w-full ${cls[tier.style]}`}>{tier.cta}</Button>;
  };

  return (
    <section id="pricing" className="py-14 md:py-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Simple, <span className="text-gradient-brand">transparent</span> pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free, upgrade when you grow. No hidden fees, ever.
          </p>
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
                <span className="text-lg font-semibold">Free Trial</span>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  No credit card
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Try Fennecly with 20 free credits — no commitment.
              </p>
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">20</span>
                <span className="text-muted-foreground text-sm">credits</span>
              </div>
              <Button variant="outline">Start free</Button>
            </div>
          </motion.div>
        </div>

        {/* 4 main plans */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-2xl border p-8 flex flex-col ${getCardClass(tier.style)}`}
            >
              {getBadge(tier.style)}
              <h3 className={`text-lg font-semibold ${tier.style === "agency" ? "text-white" : ""}`}>
                {tier.name}
              </h3>
              <p className={`mt-1 text-sm ${tier.style === "agency" ? "text-white/60" : "text-muted-foreground"}`}>
                {tier.desc}
              </p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className={`text-4xl font-bold font-display ${getPriceClass(tier.style)}`}>
                  {tier.price}
                </span>
                <span className={`text-sm ${tier.style === "agency" ? "text-white/50" : "text-muted-foreground"}`}>
                  {tier.period}
                </span>
              </div>
              {getButton(tier)}
              <ul className="mt-8 space-y-3 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${getCheckClass(tier.style)}`} />
                    <span className={tier.style === "agency" ? "text-white/70" : "text-foreground/80"}>
                      {f}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
        {/* avoid unused t warning */}
        <span className="hidden">{t("pricing.kicker", { defaultValue: "" })}</span>
      </div>
    </section>
  );
}
