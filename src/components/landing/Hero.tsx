import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";
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
  return (
    <section className="relative overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
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

      <div className="relative mx-auto max-w-6xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground shadow-soft"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          New — AI-powered store generation
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight"
        >
          Build Your Online Store{" "}
          <span className="text-gradient-brand">in Minutes</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground"
        >
          Create, customize, and launch your e-commerce business بسهولة بدون برمجة.
          Everything you need to sell online — in one beautifully simple platform.
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
            className="bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow group"
          >
            <Link to="/signup">
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="backdrop-blur">
            <Play className="h-4 w-4" />
            View Demo
          </Button>
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
          const threshold = 60;
          if (info.offset.x < -threshold) {
            setActive((a) => (a + 1) % SHOTS.length);
          } else if (info.offset.x > threshold) {
            setActive((a) => (a - 1 + SHOTS.length) % SHOTS.length);
          }
        }}
      >
        {SHOTS.map((shot, i) => {
          const offset = ((i - active + SHOTS.length) % SHOTS.length);
          // normalize offset to -1, 0, 1 for 3 items
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
      </div>

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
