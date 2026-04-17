import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
      <div className="absolute inset-0 bg-soft-radial pointer-events-none" />
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-brand opacity-20 blur-3xl pointer-events-none"
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
            className="bg-gradient-brand text-brand-foreground hover:opacity-90 shadow-glow group"
          >
            Get Started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button size="lg" variant="outline" className="backdrop-blur">
            <Play className="h-4 w-4" />
            View Demo
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-16 mx-auto max-w-5xl"
        >
          <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl p-2 shadow-glow">
            <div className="rounded-xl bg-gradient-to-br from-muted to-background aspect-[16/9] overflow-hidden relative">
              <div className="absolute inset-0 grid grid-cols-12 gap-3 p-6">
                <div className="col-span-3 rounded-lg bg-background/70 border border-border/60" />
                <div className="col-span-9 grid grid-rows-6 gap-3">
                  <div className="row-span-1 rounded-lg bg-background/70 border border-border/60" />
                  <div className="row-span-5 grid grid-cols-3 gap-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-gradient-to-br from-background/80 to-accent/40 border border-border/60"
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
