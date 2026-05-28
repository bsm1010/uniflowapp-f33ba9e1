import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Menu, X } from "lucide-react";
import type { StoreTokens, NavLink } from "@/lib/storeTheme";

interface CenteredNavbarProps {
  tokens: StoreTokens;
  logo: string | null;
  brand: string;
  links: NavLink[];
  cartCount: number;
  slug: string;
  onCartOpen: () => void;
}

export function CenteredNavbar({ tokens: t, logo, brand, links, cartCount, slug, onCartOpen }: CenteredNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => setScrolled(window.scrollY > 20), { passive: true });
  }

  return (
    <header
      className="sticky top-0 z-40 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? `${t.bg}dd` : t.bg,
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${t.border}` : "none",
      }}
    >
      <div className="mx-auto flex flex-col px-5 sm:px-8" style={{ maxWidth: "1280px" }}>
        <div className="flex h-16 items-center justify-between">
          <div className="w-20 md:w-32" />
          <Link to="/s/$slug" params={{ slug }} className="flex items-center gap-2.5">
            {logo ? (
              <img src={logo} alt={brand} className="h-8 w-auto" />
            ) : (
              <span className="text-xl font-bold font-display tracking-tight" style={{ color: t.fg }}>{brand}</span>
            )}
          </Link>
          <div className="flex items-center gap-2 w-20 md:w-32 justify-end">
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
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl"
              style={{ color: t.fg }}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <nav className="hidden md:flex items-center justify-center gap-1 pb-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative px-5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 hover:bg-white/5"
              style={{ color: t.muted }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t" style={{ borderColor: t.border }}>
          <nav className="px-5 py-4 space-y-1" style={{ backgroundColor: t.bg }}>
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-center transition-colors hover:bg-white/5"
                style={{ color: t.muted }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
