import type { StoreSettings } from "@/lib/storeTheme";

/**
 * A theme preset is a partial set of StoreSettings fields that get merged onto
 * the user's current settings when applied. We intentionally only override
 * presentation fields — never store name, slug, products, hero copy that the
 * user already wrote, etc.
 */
export type ThemePresetPatch = Partial<
  Pick<
    StoreSettings,
    | "theme"
    | "primary_color"
    | "secondary_color"
    | "accent_color"
    | "background_color"
    | "font_family"
    | "button_style"
    | "border_radius"
    | "hero_layout"
  >
>;

export interface ThemePreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  /** Tailwind gradient classes for the card thumbnail accent */
  accent: string;
  /** A short list of features to render as chips on the card */
  highlights: string[];
  patch: ThemePresetPatch;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "minimal",
    name: "Minimal",
    tagline: "Clean · White · Editorial",
    description:
      "A calm, gallery-style layout with generous whitespace, sharp edges, and refined serif headings.",
    accent: "from-stone-200 via-stone-100 to-white",
    highlights: ["White canvas", "Sharp corners", "Serif type"],
    patch: {
      theme: "minimal",
      primary_color: "#0f172a",
      secondary_color: "#0f172a",
      accent_color: "#737373",
      background_color: "#ffffff",
      font_family: "Fraunces",
      button_style: "square",
      border_radius: "none",
      hero_layout: "centered",
    },
  },
  {
    id: "modern",
    name: "Modern",
    tagline: "Bold · Vibrant · Trendy",
    description:
      "Big imagery, vivid gradients, and rounded shapes. Ideal for fashion, lifestyle, and DTC brands.",
    accent: "from-violet-500 via-fuchsia-500 to-pink-500",
    highlights: ["Vivid accents", "Pill buttons", "Split hero"],
    patch: {
      theme: "modern",
      primary_color: "#7c3aed",
      secondary_color: "#0f172a",
      accent_color: "#f59e0b",
      background_color: "#ffffff",
      font_family: "Sora",
      button_style: "pill",
      border_radius: "large",
      hero_layout: "split",
    },
  },
  {
    id: "classic",
    name: "Classic",
    tagline: "Familiar · Reliable · Catalog-first",
    description:
      "A traditional storefront with a dense product grid, neutral palette, and clear navigation.",
    accent: "from-emerald-200 via-teal-100 to-cyan-100",
    highlights: ["Product grid", "Neutral palette", "Rounded corners"],
    patch: {
      theme: "grid",
      primary_color: "#0e7490",
      secondary_color: "#0f172a",
      accent_color: "#dc2626",
      background_color: "#fafaf9",
      font_family: "Inter",
      button_style: "rounded",
      border_radius: "medium",
      hero_layout: "centered",
    },
  },
  {
    id: "dark",
    name: "Dark",
    tagline: "Premium · Moody · High-contrast",
    description:
      "A dark canvas with neon accents and cinematic full-bleed hero. Great for tech and premium goods.",
    accent: "from-slate-800 via-slate-900 to-black",
    highlights: ["Dark canvas", "Neon accent", "Full-bleed hero"],
    patch: {
      theme: "bold",
      primary_color: "#22d3ee",
      secondary_color: "#f8fafc",
      accent_color: "#a855f7",
      background_color: "#0b0b10",
      font_family: "Space Grotesk",
      button_style: "pill",
      border_radius: "large",
      hero_layout: "fullbleed",
    },
  },
];

export function applyPreset(
  current: StoreSettings,
  preset: ThemePreset,
): StoreSettings {
  return { ...current, ...preset.patch };
}
