/**
 * Layout template registry.
 * Each layout template renders a full storefront homepage with a unique structure.
 */
import { lazy } from "react";
import type { LayoutTemplate } from "@/lib/themePresets";

export type { LayoutTemplate };

export const LAYOUT_COMPONENTS: Record<
  LayoutTemplate,
  React.LazyExoticComponent<React.ComponentType<LayoutProps>>
> = {
  editorial: lazy(() => import("./EditorialLayout")),
  "grid-dense": lazy(() => import("./GridDenseLayout")),
  magazine: lazy(() => import("./MagazineLayout")),
  showcase: lazy(() => import("./ShowcaseLayout")),
  storytelling: lazy(() => import("./StorytellingLayout")),
  catalog: lazy(() => import("./CatalogLayout")),
};

export interface LayoutProps {
  products: ProductForLayout[];
  tokens: import("@/lib/storeTheme").StoreTokens;
  currency: string;
  brandName: string;
  heroHeading: string;
  heroSubheading: string;
  heroCta: string;
  onAddToCart?: (product: ProductForLayout) => void;
}

export interface ProductForLayout {
  id: string;
  name: string;
  price: number;
  images: string[];
  category?: string | null;
  stock?: number | null;
  badge?: "sale" | "new" | "best-seller";
}
