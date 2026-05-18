import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import fennecyLogo from "@/assets/fennecly-logo.webp";

function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);
  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="h-9 w-9 rounded-xl"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}

function AnimatedLogo() {
  const [phase, setPhase] = useState<"running" | "settled">("running");

  useEffect(() => {
    // Only animate once per session
    const hasAnimated = sessionStorage.getItem("logo-animated");
    if (hasAnimated) {
      setPhase("settled");
      return;
    }
    // After 1.2s animation completes, mark as settled
    const timer = setTimeout(() => {
      setPhase("settled");
      sessionStorage.setItem("logo-animated", "true");
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <a href="#" className="flex items-center gap-2 overflow-hidden">
      <img
        src={fennecyLogo}
        alt="Fennecly"
        width={180}
        height={56}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        className={[
          "h-14 w-auto object-contain dark:brightness-0 dark:invert",
          phase === "running"
            ? "animate-logo-run"
            : "translate-x-0 opacity-100",
        ].join(" ")}
      />
    </a>
  );
}

export function Navbar() {
  const { t } = useTranslation();
  const links = [
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.how"), href: "#how" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.testimonials"), href: "#testimonials" },
    { label: "Themes", href: "/themes", isRoute: true },
  ];
  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes logo-run {
          0%   { transform: translateX(-110vw) scaleX(1.15) rotate(-3deg); opacity: 0; }
          10%  { opacity: 1; }
          70%  { transform: translateX(8px) scaleX(0.95) rotate(1deg); }
          85%  { transform: translateX(-4px) scaleX(1.05) rotate(-1deg); }
          100% { transform: translateX(0) scaleX(1) rotate(0deg); opacity: 1; }
        }
        .animate-logo-run {
          animation: logo-run 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
      `}</style>

      <header className="fixed top-0 inset-x-0 z-50 animate-in fade-in slide-in-from-top-3 duration-500">
        <div className="mx-auto max-w-6xl px-4 mt-4">
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-4 py-3 shadow-soft overflow-hidden">
            
            <AnimatedLogo />

            <nav className="hidden md:flex items-center gap-7">
              {links.map((l) =>
                (l as { isRoute?: boolean }).isRoute ? (
                  <Link
                    key={l.href}
                    to={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                ) : (
                  
                    key={l.href}
                    href={l.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </a>
                ),
              )}
            </nav>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <DarkModeToggle />
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="hidden sm:inline-flex"
              >
                <Link to="/login">{t("nav.signIn")}</Link>
              </Button>
              <Button
                size="sm"
                asChild
                className="bg-gradient-brand text-brand-foreground hover:opacity-90"
              >
                <Link to="/signup">{t("nav.getStarted")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
