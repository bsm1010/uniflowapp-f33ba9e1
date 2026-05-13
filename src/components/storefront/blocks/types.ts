import type { ComponentType, LazyExoticComponent } from "react";

/** Categories used to group blocks in the builder library panel. */
export type BlockCategory =
  | "hero"
  | "products"
  | "social-proof"
  | "media"
  | "banners"
  | "content"
  | "trust"
  | "cta";

/** Schema field types — drive the auto-generated editor in Phase 3. */
export type SchemaField =
  | { type: "text"; key: string; label: string; placeholder?: string; multiline?: boolean }
  | { type: "number"; key: string; label: string; min?: number; max?: number; step?: number }
  | { type: "boolean"; key: string; label: string }
  | { type: "color"; key: string; label: string }
  | { type: "image"; key: string; label: string }
  | { type: "url"; key: string; label: string }
  | { type: "select"; key: string; label: string; options: Array<{ value: string; label: string }> }
  | { type: "list"; key: string; label: string; itemFields: SchemaField[]; itemLabel?: string };

export interface BlockSchema {
  fields: SchemaField[];
}

/** Common context every block receives from the storefront shell. */
export interface BlockContext {
  storeSlug: string;
  currency: string;
  brandName: string;
  isPreview?: boolean;
}

/** Generic props envelope passed to every block component. */
export interface BlockComponentProps<TProps = Record<string, unknown>> {
  props: TProps;
  context: BlockContext;
}

export interface BlockDefinition<TProps = Record<string, unknown>> {
  key: string;
  label: string;
  description: string;
  category: BlockCategory;
  /** Lucide icon name — resolved at render time to avoid bundling all icons. */
  icon: string;
  defaultProps: TProps;
  schema: BlockSchema;
  component: LazyExoticComponent<ComponentType<BlockComponentProps<TProps>>>;
}

/** Stored shape for a section instance inside store_settings.sections. */
export interface SectionInstance {
  id: string;
  blockKey: string;
  props: Record<string, unknown>;
  styleOverrides?: {
    paddingY?: number;
    background?: string;
    radius?: number;
    fullWidth?: boolean;
  };
}
