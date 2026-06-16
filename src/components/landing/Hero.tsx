import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Store, Package, BarChart3 } from "lucide-react";

export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-fuchsia-500/8 to-cyan-500/15 dark:from-violet-500/20 dark:via-fuchsia-500/10 dark:to-cyan-500/20" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-400/20 dark:bg-violet-500/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-fuchsia-400/15 dark:bg-fuchsia-500/25 rounded-full blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/10 dark:bg-cyan-500/15 rounded-full blur-[150px] animate-pulse [animation-delay:2s]" />
        {/* Grid pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 backdrop-blur-xl px-4 py-2 text-sm text-muted-foreground shadow-lg"
        >
          <Sparkles className="h-4 w-4 text-violet-500" />
          {t("hero.badge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-8 text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight leading-[1.05]"
        >
          {t("hero.titleA")}
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
            {t("hero.titleB")}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/25 px-8 h-14 text-base font-semibold rounded-2xl group"
          >
            <Link to="/signup">
              {t("hero.getStarted")}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="border-border bg-background/50 hover:bg-accent px-8 h-14 text-base rounded-2xl"
          >
            <a href="#features">{t("hero.seeFeatures")}</a>
          </Button>
        </motion.div>

        {/* Dashboard preview card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex justify-center"
        >
          <div className="relative w-full max-w-4xl">
            <div className="relative rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-3 w-3 rounded-full bg-red-400/80" />
                <div className="h-3 w-3 rounded-full bg-amber-400/80" />
                <div className="h-3 w-3 rounded-full bg-green-400/80" />
                <div className="ml-4 flex-1 h-8 rounded-lg bg-muted/50 border border-border/50" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Store, label: t("hero.statStores"), value: "3", color: "from-violet-500 to-fuchsia-500" },
                  { icon: Package, label: t("hero.statProducts"), value: "248", color: "from-cyan-500 to-blue-500" },
                  { icon: BarChart3, label: t("hero.statRevenue"), value: "12.4K", color: "from-amber-500 to-orange-500" },
                  { icon: ArrowRight, label: t("hero.statOrders"), value: "36", color: "from-green-500 to-emerald-500" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                    className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-left"
                  >
                    <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} mb-3`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1 }}
              className="hidden sm:block absolute -left-6 top-1/4 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl px-4 py-3 shadow-xl"
            >
              <div className="text-xs text-muted-foreground">{t("hero.newOrder")}</div>
              <div className="text-sm font-semibold text-foreground">{t("hero.orderValue")}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="hidden sm:block absolute -right-6 bottom-1/4 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl px-4 py-3 shadow-xl"
            >
              <div className="text-xs text-muted-foreground">{t("hero.growth")}</div>
              <div className="text-sm font-semibold text-green-500">{t("hero.growthValue")}</div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
}
