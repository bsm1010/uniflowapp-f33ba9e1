/**
 * Layout template registry.
 * 10 Algerian-themed storefront layouts, each with unique visual structure.
 */
import { lazy } from "react";
import type { LayoutTemplate } from "@/lib/themePresets";

export type { LayoutTemplate };

export const LAYOUT_COMPONENTS: Record<
  LayoutTemplate,
  React.LazyExoticComponent<React.ComponentType<LayoutProps>>
> = {
  sahara: lazy(() => import("./SaharaLayout")),
  mediterranean: lazy(() => import("./MediterraneanLayout")),
  casbah: lazy(() => import("./CasbahLayout")),
  atlas: lazy(() => import("./AtlasLayout")),
  tlemcen: lazy(() => import("./TlemcenLayout")),
  constantine: lazy(() => import("./ConstantineLayout")),
  oran: lazy(() => import("./OranLayout")),
  ghardaia: lazy(() => import("./GhardaiaLayout")),
  kabyle: lazy(() => import("./KabyleLayout")),
  algiers: lazy(() => import("./AlgiersLayout")),
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
