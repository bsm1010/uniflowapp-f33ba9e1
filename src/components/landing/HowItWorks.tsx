import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { UserPlus, Wand2, Rocket } from "lucide-react";

const stepKeys = [
  { icon: UserPlus, key: "create", color: "from-violet-400 to-fuchsia-400" },
  { icon: Wand2, key: "build", color: "from-cyan-400 to-blue-400" },
  { icon: Rocket, key: "launch", color: "from-amber-400 to-orange-400" },
] as const;

export function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section id="how" className="py-20 md:py-28 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-300"
          >
            {t("how.kicker")}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-5 text-3xl md:text-5xl font-bold tracking-tight"
          >
            {t("how.titleA")}{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {t("how.titleB")}
            </span>
          </motion.h2>
        </div>

        <div className="mt-20 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent -translate-y-1/2" />

          <div className="grid gap-8 md:grid-cols-3">
            {stepKeys.map((s, i) => (
              <motion.div
                key={s.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
                className="relative group"
              >
                {/* Step number */}
                <div className="flex justify-center mb-8">
                  <div className={`relative inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} shadow-2xl shadow-violet-500/20 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className="h-7 w-7 text-white" />
                    <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-background border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-bold">{i + 1}</span>
                    </div>
                  </div>
                </div>

                {/* Card */}
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 text-center hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-500">
                  <h3 className="text-xl font-semibold">{t(`how.steps.${s.key}.title`)}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                    {t(`how.steps.${s.key}.desc`)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
