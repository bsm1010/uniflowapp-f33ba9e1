import type { FooterStyle } from "./types";

export interface FooterConfig {
  style: FooterStyle;
  label: string;
  description: string;
  preview: string;
}

export const FOOTER_CONFIGS: FooterConfig[] = [
  {
    style: "columns",
    label: "Columns",
    description: "Multi-column layout with brand info, link groups, and social icons. Feature-rich.",
    preview: "Brand · Shop · Help · Social\n           © 2025",
  },
  {
    style: "simple",
    label: "Simple",
    description: "Single centered column with tagline and minimal links. Clean and modern.",
    preview: "       Brand tagline\n    Links · © 2025",
  },
  {
    style: "branded",
    label: "Branded",
    description: "Large brand section with gradient accent, newsletter signup, and social links.",
    preview: "✨ Brand · Newsletter · Social\n           © 2025",
  },
];
