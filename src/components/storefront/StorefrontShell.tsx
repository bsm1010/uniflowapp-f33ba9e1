import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBag, Instagram, Facebook, Twitter, Music2, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCart } from "@/hooks/use-cart";
import {
  getStoreTokens,
  getFooterSocials,
  type StoreSettings,
} from "@/lib/storeTheme";

// Re-export for backwards compatibility
export { getStoreTokens } from "@/lib/storeTheme";

interface Props {
  settings: StoreSettings;
  children: ReactNode;
}

export function StorefrontShell({ settings, children }: Props) {
  const t = getStoreTokens(settings);
  const { count } = useCart(settings.slug);
  const navLinks = getNavLinks(settings);
  const socials = getFooterSocials(settings);

  const socialEntries: Array<{ key: string; url: string; Icon: typeof Instagram }> = [
    { key: "instagram", url: socials.instagram ?? "", Icon: Instagram },
    { key: "facebook", url: socials.facebook ?? "", Icon: Facebook },
    { key: "twitter", url: socials.twitter ?? "", Icon: Twitter },
    { key: "tiktok", url: socials.tiktok ?? "", Icon: Music2 },
  ].filter((s) => s.url.trim().length > 0);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: t.bg, color: t.fg, fontFamily: t.fontFamily }}
    >
      <header
        className="sticky top-0 z-30 backdrop-blur-md"
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
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href.startsWith("#") ? `/s/${settings.slug}${l.href}` : l.href}
                className="hover:opacity-70 transition-opacity"
              >
                {l.label}
              </a>
            ))}
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
        className="px-4 sm:px-6 pt-12 pb-8"
        style={{ borderTop: `1px solid ${t.border}`, color: t.muted }}
      >
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.store_name}
                  className="h-7 w-7 rounded object-cover"
                />
              ) : (
                <div
                  className="h-7 w-7 rounded"
                  style={{ backgroundColor: t.primary }}
                />
              )}
              <span className="font-semibold" style={{ color: t.fg }}>
                {settings.store_name}
              </span>
            </div>
            <p className="mt-3 text-sm max-w-sm leading-relaxed">
              {settings.footer_about}
            </p>
            {socialEntries.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                {socialEntries.map(({ key, url, Icon }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 inline-flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
                    style={{ backgroundColor: t.surface, color: t.fg }}
                    aria-label={key}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: t.fg }}
            >
              Shop
            </div>
            <ul className="space-y-2 text-sm">
              {getNavLinks(settings).slice(0, 4).map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href.startsWith("#") ? `/s/${settings.slug}${l.href}` : l.href}
                    className="hover:opacity-70"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: t.fg }}
            >
              Help
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/s/$slug/about" params={{ slug: settings.slug }} className="hover:opacity-70">
                  About
                </Link>
              </li>
              <li>
                <Link to="/s/$slug/contact" params={{ slug: settings.slug }} className="hover:opacity-70">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/s/$slug/cart" params={{ slug: settings.slug }} className="hover:opacity-70">
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/s/$slug/checkout" params={{ slug: settings.slug }} className="hover:opacity-70">
                  Checkout
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div
          className="max-w-6xl mx-auto mt-10 pt-6 text-center text-xs"
          style={{ borderTop: `1px solid ${t.border}` }}
        >
          {settings.footer_copyright?.trim()
            ? settings.footer_copyright
            : `© ${new Date().getFullYear()} ${settings.store_name}. All rights reserved.`}
        </div>
      </footer>
    </div>
  );
}
