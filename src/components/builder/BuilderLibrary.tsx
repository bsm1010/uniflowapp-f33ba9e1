import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BLOCK_LIST, BLOCK_CATEGORIES } from "@/components/storefront/blocks/registry";
import type { BlockCategory, BlockDefinition } from "@/components/storefront/blocks/types";

export function BuilderLibrary({ onAdd }: { onAdd: (def: BlockDefinition) => void }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<BlockCategory | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BLOCK_LIST.filter((b) => {
      if (active !== "all" && b.category !== active) return false;
      if (!q) return true;
      return (
        b.label.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.key.toLowerCase().includes(q)
      );
    });
  }, [query, active]);

  return (
    <div className="flex h-full flex-col border-r bg-card">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections..."
            className="pl-8"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <CategoryPill label="All" active={active === "all"} onClick={() => setActive("all")} />
          {BLOCK_CATEGORIES.map((c) => (
            <CategoryPill
              key={c.key}
              label={c.label}
              active={active === c.key}
              onClick={() => setActive(c.key as BlockCategory)}
            />
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 gap-2 p-3">
          {filtered.map((b) => (
            <motion.button
              key={b.key}
              whileHover={{ y: -2 }}
              onClick={() => onAdd(b)}
              className="group flex items-start gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:border-primary/40 hover:bg-accent/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Plus className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-tight">{b.label}</div>
                <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {b.description}
                </div>
              </div>
            </motion.button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              No sections match your search.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      size="sm"
      variant={active ? "default" : "outline"}
      className="h-7 rounded-full px-3 text-xs"
    >
      {label}
    </Button>
  );
}
