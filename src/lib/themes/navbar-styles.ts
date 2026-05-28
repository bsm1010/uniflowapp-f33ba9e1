import type { NavbarStyle } from "./types";

export interface NavbarConfig {
  style: NavbarStyle;
  label: string;
  description: string;
  preview: string;
}

export const NAVBAR_CONFIGS: NavbarConfig[] = [
  {
    style: "classic",
    label: "Classic",
    description: "Left-aligned logo, right-aligned links, centered cart icon. Clean and familiar.",
    preview: "Logo · Links · Cart",
  },
  {
    style: "centered",
    label: "Centered",
    description: "Centered logo with links below in a separate row. Elegant and symmetrical.",
    preview: "  Logo  \nLinks · Cart",
  },
  {
    style: "hamburger",
    label: "Hamburger",
    description: "Minimal layout with hamburger menu. Maximum focus on content.",
    preview: "☰  Logo  Cart",
  },
];
