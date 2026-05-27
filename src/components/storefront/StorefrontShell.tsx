import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBag, User, Instagram, Facebook, Twitter, Music2, Menu, X, ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { loadStorefrontFonts } from "@/lib/load-storefront-fonts";
import { useCart } from "@/hooks/use-cart";
import {
  getStoreTokens,
  getFooterSocials,
  type StoreSettings,
} from "@/lib/storeTheme";

export { getStoreTokens } from "@/lib/storeTheme";

interface Props {
  settings: StoreSettings;
  children: ReactNode;
}

export function StorefrontShell({ settings, children }: Props) {
  useEffect(() => { loadStorefrontFonts(); }, []);
  const { t: tr } = useTranslation();
  const t = getStoreTokens(settings);
  const { count } = useCart(settings.slug);
  const location = useLocation();
  const socials = getFooterSocials(settings);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { label: tr("storefront.nav.home"), to: "/s/$slug" as const, exact: true },
    { label: tr("storefront.nav.shop"), to: "/s/$slug" as const, hash: "shop" },
    { label: tr("storefront.nav.about"), to: "/s/$slug/about" as const },
    { label: tr("storefront.nav.contact"), to: "/s/$slug/contact" as const },
  ];

  const isActive = (to: string, exact?: boolean, hash?: string) => {
    const base = `/s/${settings.slug}`;
    const target = to.replace("$slug", settings.slug);
    if (hash) return false;
    if (exact) return location.pathname === base || location.pathname === base + "/";
    return location.pathname === target || location.pathname === target + "/";
  };

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
      {/* Announcement bar */}
      <div
        className="text-center text-xs font-medium tracking-wide py-2.5 px-4"
        style={{
          backgroundColor: t.primary,
          color: t.onPrimary,
        }}
      >
        ✨ {tr("storefront.nav.announcement", { defaultValue: "Free shipping on orders over $50" })}
      </div>

      {/* Sticky navbar */}
      <header
        className="sticky top-0 z-30 transition-all duration-300"
        style={{
          backgroundColor: scrolled ? t.bg + "f5" : t.bg,
          backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
          borderBottom: `1px solid ${scrolled ? t.border : "transparent"}`,
          boxShadow: scrolled ? `0 1px 20px ${t.isDark ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.06)"}` : "none",
        }}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-[72px] flex items-center justify-between gap-6">
          {/* Logo */}
          <Link
            to="/s/$slug"
            params={{ slug: settings.slug }}
            className="flex items-center gap-3 min-w-0 group"
          >
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.store_name}
                className="h-10 w-10 rounded-xl object-cover shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-xl shrink-0 flex items-center justify-center text-sm font-bold transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: t.primary, color: t.onPrimary }}
              >
                {settings.store_name?.charAt(0)?.toUpperCase() ?? "S"}
              </div>
            )}
            <span className="text-lg font-bold tracking-tight truncate">
              {settings.store_name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.to, item.exact, item.hash);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  params={{ slug: settings.slug }}
                  hash={item.hash}
                  className="relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg"
                  style={{
                    color: active ? t.fg : t.muted,
                    backgroundColor: active ? t.surfaceStrong : "transparent",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Action icons */}
          <div className="flex items-center gap-1.5">
            <Link
              to="/s/$slug/cart"
              params={{ slug: settings.slug }}
              className="relative inline-flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: t.surface }}
              aria-label={tr("storefront.nav.cart")}
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[20px] h-[20px] text-[10px] font-bold rounded-full px-1 flex items-center justify-center"
                  style={{
                    backgroundColor: t.primary,
                    color: t.onPrimary,
                    boxShadow: `0 0 0 2px ${t.bg}`,
                  }}
                >
                  {count}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-200 hover:scale-105"
              style={{ backgroundColor: t.surface }}
              aria-label={tr("storefront.nav.menu")}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-[18px] w-[18px]" /> : <Menu className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div
            className="md:hidden animate-fade-in"
            style={{ borderTop: `1px solid ${t.border}`, backgroundColor: t.bg }}
          >
            <nav className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-col gap-1">
              {navItems.map((item) => {
                const active = isActive(item.to, item.exact, item.hash);
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    params={{ slug: settings.slug }}
                    hash={item.hash}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between py-3.5 px-4 text-sm font-medium rounded-xl transition-all duration-200"
                    style={{
                      color: active ? t.fg : t.muted,
                      backgroundColor: active ? t.surfaceStrong : "transparent",
                    }}
                  >
                    {item.label}
                    <ChevronRight className="h-4 w-4 opacity-40" />
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* Premium footer */}
      <footer
        className="relative overflow-hidden"
        style={{
          backgroundColor: t.isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.02)",
          borderTop: `1px solid ${t.border}`,
          color: t.muted,
        }}
      >
        {/* Decorative gradient */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-[0.04] pointer-events-none"
          style={{
            background: `radial-gradient(ellipse, ${t.primary}, transparent 70%)`,
          }}
        />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-10">
          <div className="grid gap-10 md:grid-cols-12">
            {/* Brand column */}
            <div className="md:col-span-5">
              <div className="flex items-center gap-3">
                {settings.logo_url ? (
                  <img
                    src={settings.logo_url}
                    alt={settings.store_name}
                    className="h-10 w-10 rounded-xl object-cover"
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: t.primary, color: t.onPrimary }}
                  >
                    {settings.store_name?.charAt(0)?.toUpperCase() ?? "S"}
                  </div>
                )}
                <span className="text-lg font-bold" style={{ color: t.fg }}>
                  {settings.store_name}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed max-w-sm">
                {settings.footer_about}
              </p>
              {socialEntries.length > 0 && (
                <div className="mt-6 flex items-center gap-2">
                  {socialEntries.map(({ key, url, Icon }) => (
                    <a
                      key={key}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 inline-flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-110"
                      style={{ backgroundColor: t.surface, color: t.fg }}
                      aria-label={key}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="md:col-span-3">
              <div
                className="text-xs font-bold uppercase tracking-[0.15em] mb-4"
                style={{ color: t.fg }}
              >
                {tr("storefront.footer.shop")}
              </div>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/s/$slug" params={{ slug: settings.slug }} className="hover:opacity-70 transition-opacity">
                    {tr("storefront.nav.home")}
                  </Link>
                </li>
                <li>
                  <Link to="/s/$slug" params={{ slug: settings.slug }} hash="shop" className="hover:opacity-70 transition-opacity">
                    {tr("storefront.nav.shop")}
                  </Link>
                </li>
                <li>
                  <Link to="/s/$slug/about" params={{ slug: settings.slug }} className="hover:opacity-70 transition-opacity">
                    {tr("storefront.nav.about")}
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <div
                className="text-xs font-bold uppercase tracking-[0.15em] mb-4"
                style={{ color: t.fg }}
              >
                {tr("storefront.footer.help")}
              </div>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/s/$slug/contact" params={{ slug: settings.slug }} className="hover:opacity-70 transition-opacity">
                    {tr("storefront.nav.contact")}
                  </Link>
                </li>
                <li>
                  <Link to="/s/$slug/cart" params={{ slug: settings.slug }} className="hover:opacity-70 transition-opacity">
                    {tr("storefront.nav.cart")}
                  </Link>
                </li>
                <li>
                  <Link to="/s/$slug/track" params={{ slug: settings.slug }} className="hover:opacity-70 transition-opacity">
                    {tr("storefront.footer.trackOrder", { defaultValue: "Track Order" })}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
            style={{ borderTop: `1px solid ${t.border}` }}
          >
            <span>
              {settings.footer_copyright?.trim()
                ? settings.footer_copyright
                : `© ${new Date().getFullYear()} ${settings.store_name}. ${tr("storefront.footer.rights")}`}
            </span>
            <div className="flex items-center gap-4">
              <span className="opacity-60">{tr("storefront.footer.poweredBy", { defaultValue: "Powered by Fennecly" })}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
