import { motion, AnimatePresence, Reorder } from "framer-motion";
import { GripVertical, Copy, Trash2, Eye } from "lucide-react";
import { BlockRenderer } from "@/components/storefront/blocks";
import { getBlock } from "@/components/storefront/blocks/registry";
import type { SectionInstance, BlockContext } from "@/components/storefront/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  sections: SectionInstance[];
  selectedId: string | null;
  context: BlockContext;
  onReorder: (next: SectionInstance[]) => void;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BuilderCanvas({
  sections,
  selectedId,
  context,
  onReorder,
  onSelect,
  onDuplicate,
  onDelete,
}: Props) {
  if (sections.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="max-w-md rounded-2xl border border-dashed bg-card/40 p-10 text-center">
          <Eye className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h3 className="text-base font-semibold">Empty canvas</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a section from the library on the left to start building your storefront.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={sections}
      onReorder={onReorder}
      className="space-y-4 p-6"
    >
      <AnimatePresence>
        {sections.map((section) => {
          const def = getBlock(section.blockKey);
          const selected = section.id === selectedId;
          return (
            <Reorder.Item key={section.id} value={section} className="list-none">
              <motion.div
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onClick={() => onSelect(section.id)}
                className={cn(
                  "group relative cursor-pointer overflow-hidden rounded-xl border bg-background transition-all",
                  selected
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40",
                )}
              >
                {/* Section toolbar */}
                <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-lg border bg-card/95 p-1 opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100">
                  <span className="flex h-7 w-7 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(section.id);
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(section.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Section label */}
                <div className="absolute left-2 top-2 z-10 rounded-md bg-card/95 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                  {def?.label ?? section.blockKey}
                </div>

                {/* Live preview */}
                <div className="pointer-events-none">
                  <BlockRenderer sections={[section]} context={context} />
                </div>
              </motion.div>
            </Reorder.Item>
          );
        })}
      </AnimatePresence>
    </Reorder.Group>
  );
}
