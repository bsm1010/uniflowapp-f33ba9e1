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
        return "border-cyan-500/20 bg-gradient-to-b from-cyan-500/5 to-transparent";
      case "pro":
        return "border-violet-500/40 bg-gradient-to-b from-violet-500/10 to-transparent shadow-2xl shadow-violet-500/10 scale-[1.02]";
      case "business":
        return "border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent";
      case "agency":
        return "border-white/15 bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-xl";
    }
  };

  const getCheckClass = (style: Tier["style"]) => {
    switch (style) {
      case "beginner":
        return "text-cyan-400";
      case "pro":
        return "text-violet-400";
      case "business":
        return "text-amber-400";
      case "agency":
        return "text-fuchsia-400";
    }
  };

  const getPriceClass = (style: Tier["style"]) => {
    switch (style) {
      case "beginner":
        return "text-cyan-400";
      case "pro":
        return "text-violet-300";
      case "business":
        return "text-amber-300";
      case "agency":
        return "bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent";
    }
  };

  const getBadge = (style: Tier["style"]) => {
    switch (style) {
      case "pro":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-semibold px-4 py-1 shadow-lg shadow-violet-500/30 whitespace-nowrap">
            Most popular
          </div>
        );
      case "business":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-4 py-1 whitespace-nowrap">
            Best value
          </div>
        );
      case "agency":
        return (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 text-white text-xs font-semibold px-4 py-1 whitespace-nowrap">
            Exclusive
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
      {/* Background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300"
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
            Simple,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              transparent
            </span>{" "}
            pricing
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="mt-4 text-muted-foreground text-lg"
          >
            Start free, upgrade when you grow. No hidden fees, ever.
          </motion.p>
        </div>

        {/* Trial card */}
        <div className="mt-16 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white">Free Trial</span>
                <span className="text-xs bg-white/10 text-white/70 px-3 py-1 rounded-full border border-white/10">
                  No credit card
                </span>
              </div>
              <p className="text-sm text-white/50 mt-2">
                Try Fennecly with 20 free credits — no commitment.
              </p>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-white">20</span>
                <span className="text-white/40 text-sm">credits</span>
              </div>
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-xl px-6">
                Start free
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
              <h3 className={`text-lg font-semibold ${tier.style === "agency" ? "text-white" : ""}`}>
                {tier.name}
              </h3>
              <p className={`mt-1.5 text-sm ${tier.style === "agency" ? "text-white/60" : "text-muted-foreground"}`}>
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
      </div>
    </section>
  );
}
