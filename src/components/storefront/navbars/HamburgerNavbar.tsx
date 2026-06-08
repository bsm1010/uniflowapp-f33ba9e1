import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { StoreTokens, NavLink } from "@/lib/storeTheme";

interface HamburgerNavbarProps {
  tokens: StoreTokens;
  logo: string | null;
  brand: string;
  links: NavLink[];
  cartCount: number;
  slug: string;
  onCartOpen: () => void;
}

export function HamburgerNavbar({ tokens: t, logo, brand, links, cartCount, slug, onCartOpen }: HamburgerNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: scrolled || mobileOpen ? `${t.bg}dd` : "transparent",
          backdropFilter: scrolled || mobileOpen ? "blur(12px)" : "none",
          borderBottom: mobileOpen || scrolled ? `1px solid ${t.border}` : "none",
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:bg-white/5"
            style={{ color: t.fg }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/s/$slug" params={{ slug }} className="flex items-center gap-2.5 absolute left-1/2 -translate-x-1/2">
            {logo ? (
              <img src={logo} alt={brand} className="h-7 w-auto" />
            ) : (
              <span className="text-base font-bold font-display tracking-tight" style={{ color: t.fg }}>{brand}</span>
            )}
          </Link>

          <button
            onClick={onCartOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 hover:bg-white/5"
            style={{ color: t.fg }}
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold"
                style={{ backgroundColor: t.primary, color: t.onPrimary }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 top-16 z-30"
            style={{ backgroundColor: t.bg }}
          >
            <nav className="flex flex-col items-center justify-center h-full gap-2 px-8">
              {links.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-2xl font-display font-bold py-3 transition-colors hover:opacity-60"
                  style={{ color: t.fg }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
