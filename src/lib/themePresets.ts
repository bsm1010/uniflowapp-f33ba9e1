import type { StoreSettings } from "@/lib/storeTheme";

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

export type LayoutTemplate =
  | "sahara"
  | "mediterranean"
  | "casbah"
  | "atlas"
  | "tlemcen"
  | "constantine"
  | "oran"
  | "ghardaia"
  | "kabyle"
  | "algiers";

export interface ThemePreset {
  id: string;
  name: string;
  nameAr: string;
  brandName: string;
  tagline: string;
  description: string;
  niche: string;
  accent: string;
  highlights: string[];
  layout: LayoutTemplate;
  patch: ThemePresetPatch;
  heroHeading: string;
  heroSubheading: string;
  heroCta: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "sahara",
    name: "Sahara Gold",
    nameAr: "صحراء ذهبية",
    brandName: "Dar Sahara",
    tagline: "Warm · Luxurious · Timeless",
    description:
      "Desert-inspired warmth with gold accents on deep earth tones. Perfect for jewelry, leather goods, and luxury items.",
    niche: "Luxury / Jewelry / Leather",
    accent: "#D4A853",
    highlights: ["Gold accent palette", "Warm earth tones", "Serif headings", "Elegant spacing"],
    layout: "sahara",
    patch: {
      theme: "sahara",
      primary_color: "#D4A853",
      secondary_color: "#1a1410",
      accent_color: "#8B6914",
      background_color: "#0f0d0a",
      font_family: "Playfair Display",
      button_style: "pill",
      border_radius: "large",
      hero_layout: "fullbleed",
    },
    heroHeading: "Discover the Beauty of the Sahara",
    heroSubheading:
      "Handcrafted treasures from the heart of Algeria. Each piece tells a story of tradition and elegance.",
    heroCta: "Explore Collection",
  },
  {
    id: "mediterranean",
    name: "Mediterranean Breeze",
    nameAr: "نسيم البحر المتوسط",
    brandName: "Bleu Méditerranée",
    tagline: "Fresh · Coastal · Elegant",
    description:
      "Cool blues and whites inspired by the Algerian coast. Ideal for fashion, home decor, and lifestyle brands.",
    niche: "Fashion / Home / Lifestyle",
    accent: "#2563EB",
    highlights: ["Coastal blue palette", "Clean white space", "Sans-serif modern", "Airy layout"],
    layout: "mediterranean",
    patch: {
      theme: "mediterranean",
      primary_color: "#2563EB",
      secondary_color: "#1e3a5f",
      accent_color: "#0ea5e9",
      background_color: "#f0f7ff",
      font_family: "Outfit",
      button_style: "rounded",
      border_radius: "medium",
      hero_layout: "split",
    },
    heroHeading: "Coastal Elegance, Redefined",
    heroSubheading:
      "Mediterranean-inspired fashion and lifestyle. Fresh designs for the modern Algerian.",
    heroCta: "Shop the Coast",
  },
  {
    id: "casbah",
    name: "Casbah White",
    nameAr: "القصبة البيضاء",
    brandName: "Dar El Casbah",
    tagline: "Traditional · Pure · Architectural",
    description:
      "Clean white architecture with blue accents, inspired by Algiers' iconic Casbah. Perfect for home goods and artisan crafts.",
    niche: "Home / Artisan / Crafts",
    accent: "#1E40AF",
    highlights: [
      "White & blue palette",
      "Geometric patterns",
      "Architectural feel",
      "Minimal elegance",
    ],
    layout: "casbah",
    patch: {
      theme: "casbah",
      primary_color: "#1E40AF",
      secondary_color: "#1e293b",
      accent_color: "#60A5FA",
      background_color: "#ffffff",
      font_family: "Plus Jakarta Sans",
      button_style: "rounded",
      border_radius: "small",
      hero_layout: "centered",
    },
    heroHeading: "Where Tradition Meets Purity",
    heroSubheading: "Artisan home goods inspired by the timeless beauty of Algiers' Casbah.",
    heroCta: "Discover Art",
  },
  {
    id: "atlas",
    name: "Atlas Cedar",
    nameAr: "أرز الأطلس",
    brandName: "Cèdre d'Atlas",
    tagline: "Natural · Earthy · Organic",
    description:
      "Forest greens and warm browns inspired by the Atlas Mountains. Perfect for organic, wellness, and nature brands.",
    niche: "Organic / Wellness / Nature",
    accent: "#16A34A",
    highlights: ["Forest green palette", "Organic shapes", "Nature-inspired", "Warm textures"],
    layout: "atlas",
    patch: {
      theme: "atlas",
      primary_color: "#16A34A",
      secondary_color: "#1a2e1a",
      accent_color: "#A3E635",
      background_color: "#f0fdf4",
      font_family: "Manrope",
      button_style: "pill",
      border_radius: "large",
      hero_layout: "fullbleed",
    },
    heroHeading: "Rooted in Nature",
    heroSubheading:
      "Organic products from the heart of the Atlas Mountains. Pure, natural, sustainable.",
    heroCta: "Go Natural",
  },
  {
    id: "tlemcen",
    name: "Tlemcen Ornate",
    nameAr: "تلمسان الزخرفية",
    brandName: "Maison Tlemcen",
    tagline: "Ornate · Rich · Heritage",
    description:
      "Rich reds and golds inspired by Tlemcen's ornate Islamic architecture. Perfect for luxury fashion and traditional crafts.",
    niche: "Luxury Fashion / Traditional",
    accent: "#B91C1C",
    highlights: ["Rich red & gold", "Ornate patterns", "Heritage typography", "Lavish spacing"],
    layout: "tlemcen",
    patch: {
      theme: "tlemcen",
      primary_color: "#B91C1C",
      secondary_color: "#1c1008",
      accent_color: "#D4A853",
      background_color: "#1a1410",
      font_family: "DM Serif Display",
      button_style: "pill",
      border_radius: "medium",
      hero_layout: "fullbleed",
    },
    heroHeading: "Heritage of Tlemcen",
    heroSubheading:
      "Ornate craftsmanship passed down through generations. Luxury woven into every thread.",
    heroCta: "Shop Heritage",
  },
  {
    id: "constantine",
    name: "Constantine Bridge",
    nameAr: "جسر قسنطينة",
    brandName: "Pont Constantine",
    tagline: "Dramatic · Bold · Architectural",
    description:
      "High contrast black and white with dramatic accents, inspired by Constantine's legendary bridges and gorges.",
    niche: "Streetwear / Urban / Electronics",
    accent: "#E11D48",
    highlights: ["High contrast B&W", "Architectural lines", "Bold typography", "Dramatic spacing"],
    layout: "constantine",
    patch: {
      theme: "constantine",
      primary_color: "#E11D48",
      secondary_color: "#0f0f0f",
      accent_color: "#f8fafc",
      background_color: "#0a0a0a",
      font_family: "Archivo Black",
      button_style: "square",
      border_radius: "none",
      hero_layout: "fullbleed",
    },
    heroHeading: "Bridge the Gap",
    heroSubheading: "Urban essentials that defy convention. Bold designs for the bold-hearted.",
    heroCta: "Shop Now",
  },
  {
    id: "oran",
    name: "Oran White",
    nameAr: "وهران البيضاء",
    brandName: "Blanc d'Oran",
    tagline: "Mediterranean · Modern · Chic",
    description:
      "Crisp white with Mediterranean blue accents. Clean, modern, and sophisticated. Perfect for fashion and beauty.",
    niche: "Fashion / Beauty / Cosmetics",
    accent: "#0284C7",
    highlights: ["Crisp white base", "Mediterranean blue", "Modern minimal", "Chic typography"],
    layout: "oran",
    patch: {
      theme: "oran",
      primary_color: "#0284C7",
      secondary_color: "#0c4a6e",
      accent_color: "#38BDF8",
      background_color: "#f8fafc",
      font_family: "Sora",
      button_style: "rounded",
      border_radius: "medium",
      hero_layout: "split",
    },
    heroHeading: "Chic Made Simple",
    heroSubheading:
      "Modern Mediterranean style for the confident Algerian woman. Clean, elegant, effortless.",
    heroCta: "Explore Style",
  },
  {
    id: "ghardaia",
    name: "Ghardaia Blue",
    nameAr: "أزرق غرداية",
    brandName: "Bleu M'zab",
    tagline: "Desert Minimal · Blue · Serene",
    description:
      "Deep blue and white inspired by Ghardaia's M'zab valley. Minimalist desert aesthetic for home and lifestyle.",
    niche: "Home Decor / Pottery / Textiles",
    accent: "#1D4ED8",
    highlights: ["Deep blue palette", "Desert minimalism", "Geometric forms", "Serene spacing"],
    layout: "ghardaia",
    patch: {
      theme: "ghardaia",
      primary_color: "#1D4ED8",
      secondary_color: "#1e1b4b",
      accent_color: "#93C5FD",
      background_color: "#eef2ff",
      font_family: "Cormorant Garamond",
      button_style: "pill",
      border_radius: "large",
      hero_layout: "centered",
    },
    heroHeading: "Serenity of the M'zab",
    heroSubheading:
      "Handcrafted home goods inspired by the blue city of Ghardaia. Minimal, serene, timeless.",
    heroCta: "Discover Serenity",
  },
  {
    id: "kabyle",
    name: "Kabyle Earth",
    nameAr: "تراب القبائلي",
    brandName: "Tidukal",
    tagline: "Berber · Earthy · Handcrafted",
    description:
      "Terracotta reds and ochre yellows inspired by Kabyle Berber pottery and textiles. Authentic and warm.",
    niche: "Handcraft / Pottery / Textiles",
    accent: "#C2410C",
    highlights: ["Terracotta & ochre", "Berber patterns", "Handcraft feel", "Warm earthy tones"],
    layout: "kabyle",
    patch: {
      theme: "kabyle",
      primary_color: "#C2410C",
      secondary_color: "#292524",
      accent_color: "#F59E0B",
      background_color: "#fefce8",
      font_family: "Bricolage Grotesque",
      button_style: "rounded",
      border_radius: "medium",
      hero_layout: "split",
    },
    heroHeading: "Berber Roots, Modern Soul",
    heroSubheading:
      "Handcrafted with centuries of Kabyle tradition. Every piece carries the spirit of the mountains.",
    heroCta: "Shop Handcraft",
  },
  {
    id: "algiers",
    name: "Algiers Modern",
    nameAr: "الجزائر الحديثة",
    brandName: "Alger Moderne",
    tagline: "Urban · Sophisticated · Cosmopolitan",
    description:
      "Sleek black and white with gold accents. Modern cosmopolitan feel for tech, fashion, and premium brands.",
    niche: "Tech / Premium Fashion / Accessories",
    accent: "#CA8A04",
    highlights: [
      "Black & gold luxury",
      "Modern sans-serif",
      "Cosmopolitan feel",
      "Premium spacing",
    ],
    layout: "algiers",
    patch: {
      theme: "algiers",
      primary_color: "#CA8A04",
      secondary_color: "#0f0f0f",
      accent_color: "#FDE68A",
      background_color: "#fafafa",
      font_family: "Space Grotesk",
      button_style: "pill",
      border_radius: "small",
      hero_layout: "centered",
    },
    heroHeading: "The Capital of Style",
    heroSubheading:
      "Modern essentials for cosmopolitan Algeria. Premium quality, contemporary design.",
    heroCta: "Shop Premium",
  },
];

export function getPresetById(id: string): ThemePreset | undefined {
  return THEME_PRESETS.find((p) => p.id === id);
}

export function applyPreset(current: StoreSettings, preset: ThemePreset): StoreSettings {
  return {
    ...current,
    ...preset.patch,
    hero_heading: preset.heroHeading,
    hero_subheading: preset.heroSubheading,
    hero_cta_label: preset.heroCta,
  };
}
