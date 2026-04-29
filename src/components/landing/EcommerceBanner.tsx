import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShoppingBag } from "lucide-react";
import banner from "@/assets/ecommerce-banner.png";

export function EcommerceBanner() {
  const { t } = useTranslation();
  return (
    <section className="relative px-4 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl border border-border/60 shadow-glow"
          style={{
            backgroundImage: `url(${banner})`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        >
          {/* Left-side gradient for legibility */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-[#1a0533]/95 via-[#2a0a4d]/80 to-transparent"
          />

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 p-8 sm:p-12 md:p-16 min-h-[340px] md:min-h-[420px]">
            <div className="flex flex-col justify-center text-white">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3 py-1.5 text-xs"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                {t("banner.kicker")}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight"
              >
                {t("banner.titleA")}{" "}
                <span className="bg-gradient-to-r from-pink-300 to-purple-200 bg-clip-text text-transparent">
                  {t("banner.titleB")}
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-4 max-w-md text-sm sm:text-base text-white/80"
              >
                {t("banner.subtitle")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-6 flex flex-wrap gap-3"
              >
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-[#2a0a4d] hover:bg-white/90 group"
                >
                  <Link to="/signup">
                    {t("banner.cta")}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
