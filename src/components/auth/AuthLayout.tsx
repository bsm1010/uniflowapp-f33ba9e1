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
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12 relative overflow-hidden">
      {/* Animated aurora blobs */}
      <div
        aria-hidden
        className="absolute -top-48 left-1/2 -translate-x-1/2 h-[600px] w-[1100px] rounded-full bg-gradient-brand opacity-30 blur-[120px] pointer-events-none animate-pulse"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary/25 blur-[100px] pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-32 h-[450px] w-[450px] rounded-full bg-accent/20 blur-[110px] pointer-events-none"
      />
      {/* Dotted grid texture */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-dots opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none"
      />
      {/* Subtle vignette */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(var(--background))_100%)] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <Link to="/" className="flex items-center justify-center mb-8 group">
          <div className="relative">
            <div aria-hidden className="absolute inset-0 bg-gradient-brand opacity-40 blur-2xl rounded-full scale-90 group-hover:opacity-60 transition-opacity" />
            <img src={fennecyLogo} alt="Fennecly" width={300} height={96} loading="eager" fetchPriority="high" decoding="async" className="relative h-24 w-auto object-contain drop-shadow-[0_8px_24px_hsl(var(--primary)/0.4)]" />
          </div>
        </Link>
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-2xl p-8 shadow-glow ring-1 ring-primary/10">
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
