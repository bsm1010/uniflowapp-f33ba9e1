import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
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

const tools = [
  { icon: Package, key: "products" },
  { icon: ShoppingCart, key: "orders" },
  { icon: Truck, key: "delivery" },
  { icon: Palette, key: "themes" },
  { icon: BarChart3, key: "analytics" },
  { icon: MessageCircle, key: "chatbot" },
  { icon: Mail, key: "email" },
  { icon: Tag, key: "discounts" },
  { icon: Search, key: "seo" },
  { icon: Sparkles, key: "ai" },
  { icon: Globe, key: "multilang" },
  { icon: Layers, key: "database" },
] as const;

export function DashboardTools() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex justify-center lg:justify-start"
          >
            <img
              src={deliveryMan}
              alt={t("dashTools.imageAlt")}
              className="w-full max-w-md lg:max-w-lg xl:max-w-xl drop-shadow-2xl"
              loading="lazy"
            />
          </motion.div>

          {/* Right — Tools */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
          >
            <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              {t("dashTools.kicker")}
            </span>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {t("dashTools.titleA")}{" "}
              <span className="text-primary">{t("dashTools.titleB")}</span>
            </h2>

            <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
              {t("dashTools.subtitle")}
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {tools.map(({ icon: Icon, key }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.05 * i }}
                  className="group flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3 py-3 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {t(`dashTools.items.${key}`)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
