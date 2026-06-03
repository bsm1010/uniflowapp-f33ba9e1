import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingBag, Instagram, Facebook, Twitter, Music2, Menu, X, ChevronRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { loadStorefrontFonts } from "@/lib/load-storefront-fonts";
import { useCart } from "@/hooks/use-cart";
import {
  getStoreTokens,
  getFooterSocials,
  getNavLinks,
  type StoreSettings,
} from "@/lib/storeTheme";
import type { NavbarStyle, FooterStyle } from "@/lib/themes";
import { ClassicNavbar } from "./navbars/ClassicNavbar";
import { CenteredNavbar } from "./navbars/CenteredNavbar";
import { HamburgerNavbar } from "./navbars/HamburgerNavbar";
import { ColumnsFooter } from "./footers/ColumnsFooter";
import { SimpleFooter } from "./footers/SimpleFooter";
import { BrandedFooter } from "./footers/BrandedFooter";
import { CookieConsentBanner } from "@/components/gdpr/CookieConsentBanner";

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
  const socials = getFooterSocials(settings);
  const navLinks = getNavLinks(settings);
  const navbarStyle: NavbarStyle = (settings as any).navbar_style || "classic";
  const footerStyle: FooterStyle = (settings as any).footer_style || "columns";

  const links = navLinks.map((l) => ({ label: l.label, href: l.href }));
  const socialEntries: Array<{ key: string; url: string; Icon: typeof Instagram }> = [
    { key: "instagram", url: socials.instagram ?? "", Icon: Instagram },
    { key: "facebook", url: socials.facebook ?? "", Icon: Facebook },
    { key: "twitter", url: socials.twitter ?? "", Icon: Twitter },
    { key: "tiktok", url: socials.tiktok ?? "", Icon: Music2 },
  ].filter((s) => s.url.trim().length > 0);

  const copyright = settings.footer_copyright?.trim()
    || `© ${new Date().getFullYear()} ${settings.store_name}. ${tr("storefront.footer.rights")}`;

  const navbarProps = {
    tokens: t,
    logo: settings.logo_url ?? null,
    brand: settings.store_name || "Store",
    links,
    cartCount: count,
    slug: settings.slug,
    onCartOpen: () => {},
  };

  const footerProps = {
    tokens: t,
    brand: settings.store_name || "Store",
    tagline: settings.tagline || "",
    links,
    socials,
    copyright,
    slug: settings.slug,
  };

  const NavbarComponent = navbarStyle === "centered" ? CenteredNavbar
    : navbarStyle === "hamburger" ? HamburgerNavbar
    : ClassicNavbar;

  const FooterComponent = footerStyle === "simple" ? SimpleFooter
    : footerStyle === "branded" ? BrandedFooter
    : ColumnsFooter;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: t.bg, color: t.fg, fontFamily: t.fontFamily }}
    >
      <div
        className="text-center text-xs font-medium tracking-wide py-2.5 px-4"
        style={{ backgroundColor: t.primary, color: t.onPrimary }}
      >
        ✨ {tr("storefront.nav.announcement", { defaultValue: "Free shipping on orders over 5 000 DA" })}
      </div>

      <NavbarComponent {...navbarProps} />

      <main className="flex-1">{children}</main>

      <FooterComponent {...footerProps} />

      <CookieConsentBanner storeId={settings.user_id} />
    </div>
  );
}
