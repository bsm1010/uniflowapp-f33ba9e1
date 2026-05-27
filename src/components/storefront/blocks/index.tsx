import { Suspense } from "react";
import { getBlock } from "./registry";
import type { BlockContext, SectionInstance } from "./types";

/**
 * Renders an ordered list of section instances using the block registry.
 * Each block is lazy-loaded; unknown keys are silently skipped.
 */
export function BlockRenderer({
  sections,
  context,
}: {
  sections: SectionInstance[];
  context: BlockContext;
}) {
  return (
    <>
      {sections.map((section) => {
        const def = getBlock(section.blockKey);
        if (!def) return null;
        const Component = def.component;
        const merged = { ...def.defaultProps, ...section.props };
        return (
          <Suspense key={section.id} fallback={<div className="h-32" aria-hidden />}>
            <Component props={merged} context={context} />
          </Suspense>
        );
      })}
    </>
  );
}

export { BLOCK_REGISTRY, BLOCK_LIST, BLOCK_CATEGORIES, getBlock } from "./registry";
export type { BlockDefinition, SectionInstance, BlockCategory, BlockSchema, SchemaField, BlockComponentProps, BlockContext } from "./types";
