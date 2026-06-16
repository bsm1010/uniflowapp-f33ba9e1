import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { lazy, Suspense, type ReactNode } from "react";
import { FennecyLogo } from "@/components/ui/fennecy-logo";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const IllustrationSide = lazy(() =>
  import("./IllustrationSide").then((m) => ({ default: m.IllustrationSide })),
);

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    let dark = false;
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      dark = stored === "dark" || (!stored && prefersDark);
    } catch (error) {
      console.warn(error);
    }
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch (error) {
      console.warn(error);
    }
  };
  return (
    <button
      onClick={toggle}
      className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

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
      <DarkModeToggle />

      {/* Left: Illustration panel */}
      <Suspense fallback={<div className="hidden lg:block w-1/2 min-h-screen bg-background" />}>
        <IllustrationSide />
      </Suspense>

      {/* Right: Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative overflow-y-auto min-h-screen">
        {/* Subtle background pattern */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Gradient accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative w-full max-w-md"
        >
          <Link to="/" className="flex items-center justify-center mb-8">
            <FennecyLogo className="h-24 w-[300px]" />
          </Link>

          <div className="rounded-3xl border border-border/60 bg-card/80 backdrop-blur-xl p-8 shadow-2xl shadow-black/5">
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
