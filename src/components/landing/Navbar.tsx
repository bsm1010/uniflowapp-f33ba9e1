import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Navbar() {
  const { t } = useTranslation();
  const links = [
    { label: t("nav.features"), href: "#features" },
    { label: t("nav.how"), href: "#how" },
    { label: t("nav.pricing"), href: "#pricing" },
    { label: t("nav.testimonials"), href: "#testimonials" },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div className="mx-auto max-w-6xl px-4 mt-4">
        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/70 backdrop-blur-xl px-4 py-3 shadow-soft">
          <a href="#" className="flex items-center gap-2 group">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-glow group-hover:scale-110 transition-transform duration-300">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 to-transparent" />
            </div>
            <span className="font-display font-semibold text-lg">Storely</span>
          </a>
          <nav className="hidden md:flex items-center gap-7">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
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
    </motion.header>
  );
}
