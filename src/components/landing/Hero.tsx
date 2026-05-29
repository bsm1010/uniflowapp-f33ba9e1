import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Lottie from "lottie-react";
import heroScene from "@/assets/Scene_clean.json";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-14 md:pt-32 md:pb-20">
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-dots [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)] pointer-events-none"
      />
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
          All-in-one e-commerce platform
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight"
        >
          All the tools you need,{" "}
          <span className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            in one place
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground"
        >
          Manage your entire e-commerce business from a single, intuitive dashboard — products, orders, shipping, marketing, and more.
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
              Get started free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 flex justify-center"
        >
          <Lottie
            animationData={heroScene}
            loop
            aria-hidden
            className="w-full max-w-3xl select-none pointer-events-none mix-blend-multiply dark:mix-blend-screen"
          />
        </motion.div>
      </div>
    </section>
  );
}
