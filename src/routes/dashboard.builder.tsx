import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Save, Undo2, Redo2, Loader2, Monitor, Smartphone, Tablet, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BuilderLibrary } from "@/components/builder/BuilderLibrary";
import { BuilderEditor } from "@/components/builder/BuilderEditor";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import type {
  BlockContext,
  BlockDefinition,
  SectionInstance,
} from "@/components/storefront/blocks/types";

export const Route = createFileRoute("/dashboard/builder")({
  component: BuilderRoute,
  head: () => ({ meta: [{ title: "Section Builder — Fennecly" }] }),
});

type Device = "desktop" | "tablet" | "mobile";
const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "820px",
  mobile: "390px",
};

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

interface StoreCtx {
  slug: string;
  brandName: string;
  currency: string;
}

function BuilderRoute() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<StoreCtx | null>(null);
  const [sections, setSections] = useState<SectionInstance[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [history, setHistory] = useState<SectionInstance[][]>([]);
  const [future, setFuture] = useState<SectionInstance[][]>([]);
  const lastSavedRef = useRef<string>("");
  const initialLoadRef = useRef(true);

  // Load
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("slug, store_name, currency, sections")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (data) {
        setStore({
          slug: data.slug,
          brandName: data.store_name,
          currency: data.currency ?? "USD",
        });
        const raw = Array.isArray(data.sections) ? (data.sections as unknown as SectionInstance[]) : [];
        setSections(raw);
        lastSavedRef.current = JSON.stringify(raw);
      }
      setLoading(false);
      initialLoadRef.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pushHistory = useCallback((current: SectionInstance[]) => {
    setHistory((h) => [...h.slice(-29), current]);
    setFuture([]);
  }, []);

  const updateSections = useCallback(
    (next: SectionInstance[]) => {
      setSections((prev) => {
        pushHistory(prev);
        return next;
      });
    },
    [pushHistory],
  );

  const addBlock = useCallback(
    (def: BlockDefinition) => {
      const instance: SectionInstance = {
        id: newId(),
        blockKey: def.key,
        props: { ...(def.defaultProps as Record<string, unknown>) },
      };
      updateSections([...sections, instance]);
      setSelectedId(instance.id);
      toast.success(`${def.label} added`);
    },
    [sections, updateSections],
  );

  const updateSection = useCallback(
    (next: SectionInstance) => {
      updateSections(sections.map((s) => (s.id === next.id ? next : s)));
    },
    [sections, updateSections],
  );

  const deleteSection = useCallback(
    (id: string) => {
      updateSections(sections.filter((s) => s.id !== id));
      if (selectedId === id) setSelectedId(null);
    },
    [sections, selectedId, updateSections],
  );

  const duplicateSection = useCallback(
    (id: string) => {
      const idx = sections.findIndex((s) => s.id === id);
      if (idx < 0) return;
      const copy: SectionInstance = {
        ...sections[idx],
        id: newId(),
        props: { ...sections[idx].props },
      };
      const next = [...sections];
      next.splice(idx + 1, 0, copy);
      updateSections(next);
      setSelectedId(copy.id);
    },
    [sections, updateSections],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [sections, ...f.slice(0, 29)]);
      setSections(prev);
      return h.slice(0, -1);
    });
  }, [sections]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory((h) => [...h.slice(-29), sections]);
      setSections(next);
      return f.slice(1);
    });
  }, [sections]);

  const save = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ sections: sections as unknown as never })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
      return;
    }
    lastSavedRef.current = JSON.stringify(sections);
    toast.success("Saved");
  }, [sections, user]);

  // Auto-save (debounced 3s) when dirty.
  useEffect(() => {
    if (loading || initialLoadRef.current || !user) return;
    const current = JSON.stringify(sections);
    if (current === lastSavedRef.current) return;
    const t = setTimeout(() => {
      void save();
    }, 3000);
    return () => clearTimeout(t);
  }, [sections, loading, user, save]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, save]);

  const selected = useMemo(
    () => sections.find((s) => s.id === selectedId) ?? null,
    [sections, selectedId],
  );

  const blockContext: BlockContext = useMemo(
    () => ({
      storeSlug: store?.slug ?? "",
      currency: store?.currency ?? "USD",
      brandName: store?.brandName ?? "Store",
      isPreview: true,
    }),
    [store],
  );

  if (loading || !store) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Skeleton className="h-64 w-full max-w-3xl" />
      </div>
    );
  }

  const dirty = JSON.stringify(sections) !== lastSavedRef.current;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-muted/20">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 border-b bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold">Section Builder</div>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">{store.brandName}</span>
          {dirty && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-600"
            >
              Unsaved
            </motion.span>
          )}
        </div>

        <div className="flex items-center gap-1 rounded-lg border bg-background p-1">
          <DeviceBtn icon={Monitor} active={device === "desktop"} onClick={() => setDevice("desktop")} />
          <DeviceBtn icon={Tablet} active={device === "tablet"} onClick={() => setDevice("tablet")} />
          <DeviceBtn icon={Smartphone} active={device === "mobile"} onClick={() => setDevice("mobile")} />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={undo} disabled={history.length === 0}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={redo} disabled={future.length === 0}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/s/${store.slug}`, "_blank")}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Workspace */}
      <div className="grid flex-1 grid-cols-[280px_1fr_320px] overflow-hidden">
        <BuilderLibrary onAdd={addBlock} />

        <div className="overflow-auto bg-muted/30">
          <div
            className="mx-auto my-4 origin-top rounded-xl bg-background shadow-sm transition-all"
            style={{ maxWidth: DEVICE_WIDTH[device] }}
          >
            <BuilderCanvas
              sections={sections}
              selectedId={selectedId}
              context={blockContext}
              onReorder={updateSections}
              onSelect={setSelectedId}
              onDuplicate={duplicateSection}
              onDelete={deleteSection}
            />
          </div>
        </div>

        <BuilderEditor
          section={selected}
          brandName={store.brandName}
          onChange={updateSection}
          onDelete={() => selected && deleteSection(selected.id)}
        />
      </div>
    </div>
  );
}

function DeviceBtn({
  icon: Icon,
  active,
  onClick,
}: {
  icon: typeof Monitor;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-7 w-9 items-center justify-center rounded transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
