import { useTranslation } from "react-i18next";
import deliveryMan from "@/assets/delivery-man.webp";
import {
  ShoppingCart,
  Truck,
  BarChart3,
  Palette,
  Package,
  MessageCircle,
  Mail,
  Tag,
  Search,
  Sparkles,
  Globe,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";

const tools = [
  { icon: Package, key: "products", color: "from-emerald-400 to-teal-400" },
  { icon: ShoppingCart, key: "orders", color: "from-violet-400 to-purple-400" },
  { icon: Truck, key: "delivery", color: "from-blue-400 to-cyan-400" },
  { icon: Palette, key: "themes", color: "from-fuchsia-400 to-pink-400" },
  { icon: BarChart3, key: "analytics", color: "from-amber-400 to-orange-400" },
  { icon: MessageCircle, key: "chatbot", color: "from-rose-400 to-red-400" },
  { icon: Mail, key: "email", color: "from-sky-400 to-blue-400" },
  { icon: Tag, key: "discounts", color: "from-lime-400 to-green-400" },
  { icon: Search, key: "seo", color: "from-indigo-400 to-violet-400" },
  { icon: Sparkles, key: "ai", color: "from-fuchsia-400 to-violet-400" },
  { icon: Globe, key: "multilang", color: "from-teal-400 to-cyan-400" },
  { icon: Layers, key: "database", color: "from-purple-400 to-fuchsia-400" },
] as const;

export function DashboardTools() {
  const { t } = useTranslation();

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-violet-400/5 dark:bg-violet-500/5 rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-400/5 dark:bg-fuchsia-500/5 rounded-full pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative flex justify-center lg:justify-start"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 dark:from-violet-500/20 dark:to-fuchsia-500/20 rounded-3xl blur-2xl" />
              <img
                src={deliveryMan}
                alt={t("dashTools.imageAlt")}
                width={640}
                height={640}
                className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl rounded-3xl"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                {t("dashTools.kicker")}
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-6 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight"
            >
              {t("dashTools.titleA")}{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {t("dashTools.titleB")}
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg"
            >
              {t("dashTools.subtitle")}
            </motion.p>

            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tools.map(({ icon: Icon, key, color }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3.5 transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {t(`dashTools.items.${key}`)}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
