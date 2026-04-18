import type { Tables } from "@/integrations/supabase/types";

export type StoreSettings = Tables<"store_settings">;

export const FONT_STACK: Record<string, string> = {
  Inter: '"Inter", system-ui, sans-serif',
  "Space Grotesk": '"Space Grotesk", "Inter", sans-serif',
  Playfair: '"Playfair Display", Georgia, serif',
  "DM Serif": '"DM Serif Display", Georgia, serif',
  Mono: '"JetBrains Mono", ui-monospace, monospace',
  Manrope: '"Manrope", system-ui, sans-serif',
  Sora: '"Sora", system-ui, sans-serif',
  Outfit: '"Outfit", system-ui, sans-serif',
  Bricolage: '"Bricolage Grotesque", system-ui, sans-serif',
  Fraunces: '"Fraunces", Georgia, serif',
  Cormorant: '"Cormorant Garamond", Georgia, serif',
  "Plex Sans": '"IBM Plex Sans", system-ui, sans-serif',
  Bebas: '"Bebas Neue", Impact, sans-serif',
  Archivo: '"Archivo Black", Impact, sans-serif',
  Syne: '"Syne", system-ui, sans-serif',
  Jakarta: '"Plus Jakarta Sans", system-ui, sans-serif',
};

export function readableOn(hex: string): string {
  const h = (hex ?? "").replace("#", "");
  if (h.length !== 6) return "#0f172a";
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0f172a" : "#ffffff";
}

const RADIUS_MAP: Record<string, { sm: number; md: number; lg: number; pill: number }> = {
  none: { sm: 0, md: 0, lg: 0, pill: 0 },
  small: { sm: 4, md: 6, lg: 8, pill: 8 },
  medium: { sm: 6, md: 10, lg: 16, pill: 999 },
  large: { sm: 10, md: 18, lg: 28, pill: 999 },
};

const BUTTON_RADIUS: Record<string, "pill" | "md" | "sm"> = {
  pill: "pill",
  rounded: "md",
  square: "sm",
};

export interface StoreTokens {
  bg: string;
  fg: string;
  muted: string;
  border: string;
  surface: string;
  surfaceStrong: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  onAccent: string;
  fontFamily: string;
  fontHeading: string;
  radius: { sm: number; md: number; lg: number; pill: number };
  buttonRadius: number;
  isDark: boolean;
}

export function getStoreTokens(s: StoreSettings): StoreTokens {
  const bg = s.background_color || "#ffffff";
  const primary = s.primary_color || "#6d28d9";
  const secondary = s.secondary_color || "#0f172a";
  const accent = s.accent_color || "#f59e0b";
  const isDark = readableOn(bg) === "#ffffff";
  const radius = RADIUS_MAP[s.border_radius] ?? RADIUS_MAP.medium;
  const buttonShape = BUTTON_RADIUS[s.button_style] ?? "md";
  const fontFamily = FONT_STACK[s.font_family] ?? FONT_STACK.Inter;
  // Headings always use the chosen font (designers will pair as needed)
  return {
    bg,
    fg: isDark ? "#f8fafc" : "#0f172a",
    muted: isDark ? "#94a3b8" : "#64748b",
    border: isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.10)",
    surface: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.03)",
    surfaceStrong: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)",
    primary,
    onPrimary: readableOn(primary),
    secondary,
    onSecondary: readableOn(secondary),
    accent,
    onAccent: readableOn(accent),
    fontFamily,
    fontHeading: fontFamily,
    radius,
    buttonRadius: radius[buttonShape],
    isDark,
  };
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  DZD: "DA",
  MAD: "DH",
  TND: "DT",
  CAD: "C$",
  AUD: "A$",
  JPY: "¥",
  INR: "₹",
  BRL: "R$",
  MXN: "Mex$",
  AED: "AED",
  SAR: "SR",
};

export function formatPrice(amount: number, currency = "USD"): string {
  const sym = CURRENCY_SYMBOLS[currency] ?? currency + " ";
  const fixed = amount.toFixed(2);
  // Symbols-after currencies (DZD/MAD/TND): "100.00 DA"
  if (["DZD", "MAD", "TND", "AED", "SAR"].includes(currency)) {
    return `${fixed} ${sym}`;
  }
  return `${sym}${fixed}`;
}

export interface NavLink {
  label: string;
  href: string;
}
export interface SectionTitles {
  featured?: string;
  featured_sub?: string;
  categories?: string;
  categories_sub?: string;
  newsletter?: string;
  newsletter_sub?: string;
}
export interface ButtonLabels {
  add_to_cart?: string;
  view_product?: string;
  checkout?: string;
  subscribe?: string;
  view_all?: string;
  search_placeholder?: string;
}
export interface FooterSocials {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
}

export function getNavLinks(s: StoreSettings): NavLink[] {
  const raw = s.nav_links as unknown;
  if (Array.isArray(raw)) {
    return raw.filter(
      (l): l is NavLink =>
        l && typeof l === "object" && "label" in l && "href" in l,
    );
  }
  return [];
}

export function getSectionTitles(s: StoreSettings): Required<SectionTitles> {
  const raw = (s.section_titles as SectionTitles) ?? {};
  return {
    featured: raw.featured ?? "Featured products",
    featured_sub: raw.featured_sub ?? "Hand-picked items we love",
    categories: raw.categories ?? "Shop by category",
    categories_sub: raw.categories_sub ?? "Browse our collections",
    newsletter: raw.newsletter ?? "Join our newsletter",
    newsletter_sub: raw.newsletter_sub ?? "Get 10% off your first order",
  };
}

export function getButtonLabels(s: StoreSettings): Required<ButtonLabels> {
  const raw = (s.button_labels as ButtonLabels) ?? {};
  return {
    add_to_cart: raw.add_to_cart ?? "Add to cart",
    view_product: raw.view_product ?? "View",
    checkout: raw.checkout ?? "Checkout",
    subscribe: raw.subscribe ?? "Subscribe",
    view_all: raw.view_all ?? "View all",
    search_placeholder: raw.search_placeholder ?? "Search products...",
  };
}

export function getFooterSocials(s: StoreSettings): FooterSocials {
  return ((s.footer_socials as FooterSocials) ?? {}) as FooterSocials;
}
