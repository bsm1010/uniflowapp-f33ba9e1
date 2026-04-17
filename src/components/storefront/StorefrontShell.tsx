import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import type { ReactNode } from "react";
import { useCart } from "@/hooks/use-cart";
import type { Tables } from "@/integrations/supabase/types";

type StoreSettings = Tables<"store_settings">;

const FONT_STACK: Record<string, string> = {
  Inter: '"Inter", system-ui, sans-serif',
  "Space Grotesk": '"Space Grotesk", "Inter", sans-serif',
  Playfair: '"Playfair Display", Georgia, serif',
  "DM Serif": '"DM Serif Display", Georgia, serif',
  Mono: '"JetBrains Mono", ui-monospace, monospace',
};

function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#0f172a";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0f172a" : "#ffffff";
}

export function getStoreTokens(s: StoreSettings) {
  const bg = s.background_color;
  const primary = s.primary_color;
  const onPrimary = readableOn(primary);
  const fontFamily = FONT_STACK[s.font_family] ?? FONT_STACK.Inter;
  const isDarkBg = readableOn(bg) === "#ffffff";
  return {
    bg,
    primary,
    onPrimary,
    fontFamily,
    fg: isDarkBg ? "#f8fafc" : "#0f172a",
    muted: isDarkBg ? "#94a3b8" : "#64748b",
    border: isDarkBg ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    surface: isDarkBg ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)",
    radius:
      s.theme === "minimal" ? 0 : s.theme === "grid" ? 6 : 14,
  };
}

interface Props {
  settings: StoreSettings;
  children: ReactNode;
}

export function StorefrontShell({ settings, children }: Props) {
  const t = getStoreTokens(settings);
  const { count } = useCart(settings.slug);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: t.bg, color: t.fg, fontFamily: t.fontFamily }}
    >
      <header
        className="sticky top-0 z-30 backdrop-blur"
        style={{
          backgroundColor: t.bg + "e6",
          borderBottom: `1px solid ${t.border}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            to="/s/$slug"
            params={{ slug: settings.slug }}
            className="flex items-center gap-2 min-w-0"
          >
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.store_name}
                className="h-8 w-8 rounded object-cover shrink-0"
              />
            ) : (
              <div
                className="h-8 w-8 rounded shrink-0"
                style={{ backgroundColor: t.primary }}
              />
            )}
            <span className="font-semibold tracking-tight truncate">
              {settings.store_name}
            </span>
          </Link>
          <nav
            className="hidden md:flex items-center gap-6 text-sm"
            style={{ color: t.muted }}
          >
            <Link to="/s/$slug" params={{ slug: settings.slug }}>
              Shop
            </Link>
          </nav>
          <Link
            to="/s/$slug/cart"
            params={{ slug: settings.slug }}
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: t.surface }}
            aria-label="Cart"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] text-[10px] font-semibold rounded-full px-1 flex items-center justify-center"
                style={{ backgroundColor: t.primary, color: t.onPrimary }}
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer
        className="px-4 sm:px-6 py-8 text-center text-xs"
        style={{ color: t.muted, borderTop: `1px solid ${t.border}` }}
      >
        © {new Date().getFullYear()} {settings.store_name}. Powered by Storely.
      </footer>
    </div>
  );
}
