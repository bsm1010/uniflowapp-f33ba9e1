import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Star, Quote } from "lucide-react";

export function Testimonials() {
  const { t } = useTranslation();

  const testimonials = [
    {
      quote: t("testimonials.items.sara.quote"),
      name: t("testimonials.items.sara.name"),
      role: t("testimonials.items.sara.role"),
      accent: "from-violet-400 to-fuchsia-400",
    },
    {
      quote: t("testimonials.items.james.quote"),
      name: t("testimonials.items.james.name"),
      role: t("testimonials.items.james.role"),
      accent: "from-cyan-400 to-blue-400",
    },
    {
      quote: t("testimonials.items.lina.quote"),
      name: t("testimonials.items.lina.name"),
      role: t("testimonials.items.lina.role"),
      accent: "from-amber-400 to-orange-400",
    },
  ];
  return (
    <section id="testimonials" className="py-20 md:py-28 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300"
          >
            {t("testimonials.kicker")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-3xl md:text-5xl font-bold tracking-tight"
          >
            {t("testimonials.titleA")}{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {t("testimonials.titleB")}
            </span>{" "}
            {t("testimonials.titleC")}
          </motion.h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((item, i) => (
            <motion.figure
              key={item.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative group rounded-3xl border border-border/60 bg-card/60 p-8 flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all duration-500"
            >
              <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r ${item.accent} opacity-50`} />

              <Quote className="h-8 w-8 text-muted-foreground/30 mb-4" />

              <div className="flex gap-0.5 text-amber-400 mb-4">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </div>

              <blockquote className="text-foreground/80 leading-relaxed flex-1 text-[15px]">
                &ldquo;{item.quote}&rdquo;
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3">
                <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${item.accent} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}
