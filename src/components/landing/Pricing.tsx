import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "/forever",
    desc: "Perfect for testing your idea.",
    features: ["1 store", "Up to 10 products", "Basic themes", "Community support"],
    cta: "Start free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    desc: "For growing businesses ready to scale.",
    features: [
      "Unlimited products",
      "All premium themes",
      "Custom domain",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Pro trial",
    highlight: true,
  },
  {
    name: "Business",
    price: "$99",
    period: "/month",
    desc: "Advanced tools for serious sellers.",
    features: [
      "Everything in Pro",
      "Multi-store",
      "API access",
      "Dedicated manager",
      "99.99% SLA",
    ],
    cta: "Contact sales",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">Pricing</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            Simple, <span className="text-gradient-brand">transparent</span> pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Start free, upgrade when you grow. No hidden fees, ever.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative rounded-2xl border p-8 flex flex-col ${
                t.highlight
                  ? "border-primary/40 bg-card shadow-glow scale-[1.02]"
                  : "border-border/60 bg-card shadow-soft"
              }`}
            >
              {t.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand text-brand-foreground text-xs font-medium px-3 py-1 shadow-glow">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold font-display">{t.price}</span>
                <span className="text-muted-foreground text-sm">{t.period}</span>
              </div>
              <Button
                className={`mt-6 ${
                  t.highlight
                    ? "bg-gradient-brand text-brand-foreground hover:opacity-90"
                    : ""
                }`}
                variant={t.highlight ? "default" : "outline"}
              >
                {t.cta}
              </Button>
              <ul className="mt-8 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground/80">{f}</span>
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
