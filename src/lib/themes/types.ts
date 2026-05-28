import type { StoreSettings } from "@/lib/storeTheme";

export type NavbarStyle = "classic" | "centered" | "hamburger";

export type FooterStyle = "columns" | "simple" | "branded";

export interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  preview: { bg: string; primary: string; accent: string; font: string };
  settings: Partial<StoreSettings>;
  navbar: NavbarStyle;
  footer: FooterStyle;
  sectionPresets: string[];
}

export const THEME_REGISTRY: ThemeDefinition[] = [];
