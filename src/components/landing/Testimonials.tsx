import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Storely got my boutique online in a single weekend. The drag-and-drop builder is genuinely magical.",
    name: "Sara Mansour",
    role: "Founder, Maison Lila",
  },
  {
    quote:
      "We migrated from Shopify and revenue jumped 32% in the first quarter. The analytics alone are worth it.",
    name: "James Okafor",
    role: "CEO, Northwind Goods",
  },
  {
    quote:
      "Beautiful themes, fast checkout, and incredible support. It's the platform I wish I had years ago.",
    name: "Lina Haddad",
    role: "Creative Director, Olive & Oak",
  },
];

export function Testimonials() {
  const { t } = useTranslation();
  return (
    <section id="testimonials" className="py-14 md:py-20 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-primary uppercase tracking-wider">{t("testimonials.kicker")}</p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold">
            {t("testimonials.titleA")} <span className="text-gradient-brand">{t("testimonials.titleB")}</span> {t("testimonials.titleC")}
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border/60 bg-card p-7 shadow-soft flex flex-col"
            >
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 text-foreground/90 leading-relaxed flex-1">
                "{t.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-brand shadow-glow" />
                <div>
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
