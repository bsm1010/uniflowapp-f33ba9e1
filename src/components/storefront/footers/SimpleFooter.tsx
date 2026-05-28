import { Link } from "@tanstack/react-router";
import type { StoreTokens, NavLink } from "@/lib/storeTheme";

interface SimpleFooterProps {
  tokens: StoreTokens;
  brand: string;
  tagline: string;
  links: NavLink[];
  copyright: string;
  slug: string;
}

export function SimpleFooter({ tokens: t, brand, tagline, links, copyright, slug }: SimpleFooterProps) {
  return (
    <footer style={{ borderTop: `1px solid ${t.border}` }}>
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8 text-center">
        <Link to="/s/$slug" params={{ slug }}>
          <span className="text-xl font-bold font-display" style={{ color: t.fg }}>{brand}</span>
        </Link>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: t.muted }}>{tagline}</p>
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-1">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-4 py-2 text-sm rounded-full transition-all duration-200 hover:bg-white/5"
              style={{ color: t.muted }}
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div style={{ borderTop: `1px solid ${t.border}` }}>
        <div className="mx-auto max-w-7xl px-5 py-5 text-center">
          <p className="text-xs" style={{ color: t.muted }}>{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
