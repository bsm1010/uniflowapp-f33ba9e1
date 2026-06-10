import type { TemplateKey } from "@/stores/editor-store";

interface SectionDefault {
  blockKey: string;
  props: Record<string, unknown>;
}

export const SECTION_DEFAULTS: Partial<Record<TemplateKey, SectionDefault[]>> = {
  product: [
    { blockKey: "hero", props: { title: "", subtitle: "", buttonText: "", backgroundImage: "" } },
    { blockKey: "products", props: { title: "Related Products", layout: "grid", columns: 4 } },
  ],
  collection: [
    { blockKey: "hero", props: { title: "Collection", subtitle: "", buttonText: "", backgroundImage: "" } },
    { blockKey: "products", props: { title: "All Products", layout: "grid", columns: 4 } },
  ],
  cart: [
    { blockKey: "trust", props: { items: ["Free Shipping", "Secure Checkout", "Easy Returns"] } },
  ],
  page: [
    { blockKey: "content", props: { title: "", body: "" } },
  ],
};
