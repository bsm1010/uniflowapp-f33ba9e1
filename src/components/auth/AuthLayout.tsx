import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import fennecyLogo from "@/assets/fennecly-logo.webp";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background bg-soft-radial px-4 py-12 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[900px] rounded-full bg-gradient-brand opacity-10 blur-3xl pointer-events-none"
      />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center mb-8">
          <img src={fennecyLogo} alt="Fennecly" width={300} height={96} loading="eager" fetchPriority="high" decoding="async" className="h-24 w-auto object-contain" />
        </Link>
        <div className="rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-8 shadow-soft">
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
      </motion.div>
    </main>
  );
}
