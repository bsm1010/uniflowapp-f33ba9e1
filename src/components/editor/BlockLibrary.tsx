import { useEffect, useState } from "react";
import { Search, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BLOCK_LIST, BLOCK_CATEGORIES } from "@/components/storefront/blocks/registry";
import type { BlockCategory, BlockDefinition } from "@/components/storefront/blocks/types";
import { useEditorStore } from "@/stores/editor-store";

interface Props {
  onClose: () => void;
}

export function BlockLibrary({ onClose }: Props) {
  const addSection = useEditorStore((s) => s.addSection);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<BlockCategory | "all">("all");

  const filtered = BLOCK_LIST.filter((b) => {
    if (active !== "all" && b.category !== active) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return b.label.toLowerCase().includes(q) || b.description.toLowerCase().includes(q);
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleAdd = (def: BlockDefinition) => {
    addSection(def.key);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl max-h-[80vh] bg-card rounded-xl border shadow-xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Add a section</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search sections..."
                className="pl-8"
                autoFocus
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill label="All" active={active === "all"} onClick={() => setActive("all")} />
              {BLOCK_CATEGORIES.map((c) => (
                <Pill
                  key={c.key}
                  label={c.label}
                  active={active === c.key}
                  onClick={() => setActive(c.key as BlockCategory)}
                />
              ))}
            </div>
          </div>

          {/* Block list */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 gap-2 p-4">
              {filtered.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => handleAdd(b)}
                  className="flex items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium leading-tight">{b.label}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {b.description}
                    </div>
                    <div className="mt-1">
                      <span className="inline-block px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground">
                        {b.category}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">
                  No sections match your search.
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 text-xs font-medium rounded-full transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}
