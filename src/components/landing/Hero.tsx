import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles, Zap, TrendingUp, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import shot1 from "@/assets/dashboard-shot-1.jpg";
import shot2 from "@/assets/dashboard-shot-2.jpg";
import shot3 from "@/assets/dashboard-shot-3.jpg";

const SHOTS = [
  { src: shot1, alt: "Storely analytics dashboard" },
  { src: shot2, alt: "Storely products management" },
  { src: shot3, alt: "Storely orders management" },
];

export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
      {/* Animated gradient orbs */}
      <motion.div
        aria-hidden
        animate={{
          x: [0, 40, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 opacity-20 blur-[100px] pointer-events-none"
      />
      <motion.div
        aria-hidden
        animate={{
          x: [0, -50, 0],
          y: [0, 40, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -right-32 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 opacity-20 blur-[120px] pointer-events-none"
      />
      <motion.div
        aria-hidden
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-amber-400 to-rose-500 opacity-15 blur-[100px] pointer-events-none"
      />

      {/* Dotted grid base */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-dots [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)] pointer-events-none"
      />
      {/* Bottom fade into next section */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background pointer-events-none"
      />

      {/* Floating decorative icons */}
      <motion.div
        aria-hidden
        animate={{ y: [0, -15, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-32 left-[8%] hidden lg:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-glow rotate-6"
      >
        <ShoppingBag className="h-6 w-6" />
      </motion.div>
      <motion.div
        aria-hidden
        animate={{ y: [0, 18, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-44 right-[10%] hidden lg:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-glow -rotate-6"
      >
        <TrendingUp className="h-6 w-6" />
      </motion.div>
      <motion.div
        aria-hidden
        animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-72 left-[15%] hidden xl:flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-glow"
      >
        <Zap className="h-5 w-5" />
      </motion.div>

      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 backdrop-blur px-4 py-2 text-xs text-muted-foreground shadow-soft"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          {t("hero.badge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight"
        >
          {t("hero.titleA")}{" "}
          <span className="relative inline-block">
            <span className="text-gradient-brand">{t("hero.titleB")}</span>
            <motion.svg
              aria-hidden
              viewBox="0 0 300 12"
              className="absolute -bottom-2 left-0 w-full h-3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8, ease: "easeInOut" }}
            >
              <motion.path
                d="M2 8 Q 75 2, 150 6 T 298 5"
                stroke="url(#underlineGrad)"
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
              />
              <defs>
                <linearGradient id="underlineGrad" x1="0" x2="1">
                  <stop offset="0%" stopColor="oklch(0.55 0.22 275)" />
                  <stop offset="100%" stopColor="oklch(0.72 0.18 320)" />
                </linearGradient>
              </defs>
            </motion.svg>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-8 max-w-2xl text-base sm:text-lg text-muted-foreground"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            size="lg"
            asChild
            className="bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow group relative overflow-hidden"
          >
            <Link to="/signup">
              <span className="relative z-10 flex items-center gap-2">
                {t("hero.getStarted")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="backdrop-blur group">
            <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
            {t("hero.viewDemo")}
          </Button>
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {[
                "from-violet-500 to-fuchsia-500",
                "from-cyan-500 to-blue-600",
                "from-amber-400 to-orange-500",
                "from-emerald-400 to-teal-600",
              ].map((g, i) => (
                <div
                  key={i}
                  className={`h-7 w-7 rounded-full bg-gradient-to-br ${g} ring-2 ring-background`}
                />
              ))}
            </div>
            <span className="font-medium text-foreground">10,000+</span> happy founders
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-3.5 w-3.5 fill-amber-400" viewBox="0 0 20 20">
                  <path d="M10 1l2.7 5.5 6 .9-4.4 4.3 1 6L10 15l-5.4 2.8 1-6L1.3 7.4l6-.9z" />
                </svg>
              ))}
            </div>
            <span className="font-medium text-foreground">4.9/5</span> rating
          </div>
        </motion.div>

        <Dashboard3DCarousel />
      </div>
    </section>
  );
}

function Dashboard3DCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % SHOTS.length);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.45 }}
      className="mt-20 mx-auto max-w-5xl"
      style={{ perspective: "1800px" }}
    >
      <motion.div
        className="relative h-[340px] sm:h-[440px] md:h-[520px] flex items-center justify-center [transform-style:preserve-3d] touch-pan-y cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          const dx = info.offset.x;
          if (dx < -60) {
            setActive((a) => (a + 1) % SHOTS.length);
          } else if (60 < dx) {
            setActive((a) => (a - 1 + SHOTS.length) % SHOTS.length);
          }
        }}
      >
        {SHOTS.map((shot, i) => {
          const offset = ((i - active + SHOTS.length) % SHOTS.length);
          const rel = offset > SHOTS.length / 2 ? offset - SHOTS.length : offset;
          const isActive = rel === 0;
          const translateX = rel * 55;
          const rotateY = rel * -28;
          const scale = isActive ? 1 : 0.82;
          const zIndex = 10 - Math.abs(rel);
          const opacity = Math.abs(rel) > 1 ? 0 : isActive ? 1 : 0.55;

          return (
            <motion.div
              key={i}
              animate={{
                x: `${translateX}%`,
                rotateY,
                scale,
                opacity,
              }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{
                zIndex,
                transformStyle: "preserve-3d",
              }}
              className="absolute w-[78%] sm:w-[72%] md:w-[68%] aspect-[16/9] rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-2 shadow-glow"
            >
              <div className="rounded-xl overflow-hidden relative h-full w-full">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  width={1600}
                  height={900}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="w-full h-full object-cover"
                />
                {isActive && (
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {SHOTS.map((_, i) => (
          <button
            key={i}
            aria-label={`Show screenshot ${i + 1}`}
            onClick={() => setActive(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
