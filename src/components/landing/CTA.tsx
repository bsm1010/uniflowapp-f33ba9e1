import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function CTA() {
  const { t } = useTranslation();
  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2rem] p-12 md:p-20 text-center"
        >
          {/* Animated mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-600" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(0,0,0,0.15),transparent_50%)]" />

          {/* Floating orbs */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
              {t("cta.title")}
            </h2>
            <p className="mt-5 text-white/70 max-w-xl mx-auto text-lg">
              {t("cta.subtitle")}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="group bg-white text-violet-900 hover:bg-white/90 shadow-2xl shadow-black/20 px-8 h-14 text-base font-semibold rounded-2xl"
              >
                {t("cta.primary")}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-white/30 text-white hover:bg-white/10 px-8 h-14 text-base rounded-2xl"
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
