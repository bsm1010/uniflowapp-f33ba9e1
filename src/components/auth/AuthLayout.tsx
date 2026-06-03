import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { lazy, Suspense, type ReactNode } from "react";
import { FennecyLogo } from "@/components/ui/fennecy-logo";

const LottieSide = lazy(() => import("./LottieSide").then((m) => ({ default: m.LottieSide })));

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
    <main className="min-h-screen flex bg-background overflow-hidden">
      {/* ── Left: Lottie panel ── */}
      <Suspense fallback={<div className="hidden lg:block w-1/2 min-h-screen bg-background" />}>
        <LottieSide />
      </Suspense>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-y-auto min-h-screen">
        <div
          aria-hidden
          className="absolute inset-0 bg-grid-dots opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none"
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          <Link to="/" className="flex items-center justify-center mb-8">
            <FennecyLogo className="h-24 w-[300px]" />
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
      </div>
    </main>
  );
}
