import type { StoreTokens, NavLink, FooterSocials } from "@/lib/storeTheme";
import type { NavbarStyle, FooterStyle } from "@/lib/themes";
import { ClassicNavbar } from "./navbars/ClassicNavbar";
import { CenteredNavbar } from "./navbars/CenteredNavbar";
import { HamburgerNavbar } from "./navbars/HamburgerNavbar";
import { ColumnsFooter } from "./footers/ColumnsFooter";
import { SimpleFooter } from "./footers/SimpleFooter";
import { BrandedFooter } from "./footers/BrandedFooter";

interface ThemeRendererProps {
  tokens: StoreTokens;
  logo: string | null;
  brand: string;
  tagline: string;
  links: NavLink[];
  socials: FooterSocials;
  copyright: string;
  cartCount: number;
  slug: string;
  navbarStyle?: NavbarStyle;
  footerStyle?: FooterStyle;
  onCartOpen: () => void;
  children: React.ReactNode;
}

export function ThemeRenderer({
  tokens, logo, brand, tagline, links, socials, copyright,
  cartCount, slug, navbarStyle = "classic", footerStyle = "columns",
  onCartOpen, children,
}: ThemeRendererProps) {
  const navbarProps = { tokens, logo, brand, links, cartCount, slug, onCartOpen };
  const footerProps = { tokens, brand, tagline, links, socials, copyright, slug };

  return (
    <>
      {navbarStyle === "centered" ? (
        <CenteredNavbar {...navbarProps} />
      ) : navbarStyle === "hamburger" ? (
        <HamburgerNavbar {...navbarProps} />
      ) : (
        <ClassicNavbar {...navbarProps} />
      )}

      <main className="flex-1">{children}</main>

      {footerStyle === "simple" ? (
        <SimpleFooter {...footerProps} />
      ) : footerStyle === "branded" ? (
        <BrandedFooter {...footerProps} />
      ) : (
        <ColumnsFooter {...footerProps} />
      )}
    </>
  );
}
