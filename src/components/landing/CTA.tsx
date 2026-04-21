import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  const { t } = useTranslation();
  return (
    <section className="py-24 md:py-32">
      <div className="mx-auto max-w-5xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-10 md:p-16 text-center shadow-glow"
        >
          {/* Animated orbs */}
          <motion.div
            aria-hidden
            animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -left-20 h-80 w-80 rounded-full bg-white/20 blur-3xl"
          />
          <motion.div
            aria-hidden
            animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-cyan-400/30 blur-3xl"
          />

          {/* Dot pattern overlay */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1.5 text-xs font-medium text-white border border-white/20"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Limited time offer
            </motion.div>
            <h2 className="mt-5 text-3xl md:text-5xl font-bold text-white">
              {t("cta.title")}
            </h2>
            <p className="mt-4 text-white/85 max-w-xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary" asChild className="group shadow-xl">
                <Link to="/signup">
                  {t("cta.primary")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
              >
                {t("cta.secondary")}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
