import { create } from "zustand";
import type { Tables } from "@/integrations/supabase/types";
import type { SectionInstance } from "@/components/storefront/blocks/types";
import { getBlock } from "@/components/storefront/blocks/registry";

type StoreSettings = Tables<"store_settings">;

export type TemplateKey = "home" | "product" | "collection" | "cart" | "page";
export type DeviceMode = "desktop" | "tablet" | "mobile";
export type LeftTab = "sections" | "theme" | "pages";

interface HistoryEntry {
  template: TemplateKey;
  sections: SectionInstance[];
}

interface EditorState {
  settings: StoreSettings | null;
  pageSections: Record<TemplateKey, SectionInstance[]>;
  activeTemplate: TemplateKey;
  selectedId: string | null;
  device: DeviceMode;
  leftTab: LeftTab;
  dirty: boolean;
  saving: boolean;
  history: HistoryEntry[];
  future: HistoryEntry[];
  publishStatus: "published" | "draft";
  lastPropSnapshot: string | null;

  loadSettings: (s: StoreSettings) => void;
  updateSettings: (partial: Partial<StoreSettings>) => void;
  switchTemplate: (t: TemplateKey) => void;
  setDevice: (d: DeviceMode) => void;
  setLeftTab: (t: LeftTab) => void;
  selectSection: (id: string | null) => void;

  getSections: () => SectionInstance[];
  addSection: (blockKey: string) => void;
  removeSection: (id: string) => void;
  moveSection: (fromIndex: number, toIndex: number) => void;
  duplicateSection: (id: string) => void;
  updateSectionProps: (id: string, props: Record<string, unknown>) => void;
  updateSectionStyles: (id: string, styles: NonNullable<SectionInstance["styleOverrides"]>) => void;
  toggleSectionVisibility: (id: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  setSaving: (v: boolean) => void;
  setDirty: (v: boolean) => void;
  setPublishStatus: (s: "published" | "draft") => void;

  getSerializableSections: () => Record<TemplateKey, SectionInstance[]>;
}

const EMPTY_SECTIONS: SectionInstance[] = [];

function pushHistory(
  history: HistoryEntry[],
  template: TemplateKey,
  sections: SectionInstance[],
): HistoryEntry[] {
  return [...history, { template, sections: [...sections] }].slice(-50);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  settings: null,
  pageSections: { home: [], product: [], collection: [], cart: [], page: [] },
  activeTemplate: "home",
  selectedId: null,
  device: "desktop",
  leftTab: "sections",
  dirty: false,
  saving: false,
  history: [],
  future: [],
  publishStatus: "published",
  lastPropSnapshot: null,

  loadSettings: (s) => {
    const raw = s.sections as unknown;
    const parsed: Record<TemplateKey, SectionInstance[]> = {
      home: [],
      product: [],
      collection: [],
      cart: [],
      page: [],
    };

    if (raw && typeof raw === "object") {
      if (Array.isArray(raw)) {
        parsed.home = raw as SectionInstance[];
      } else {
        for (const key of Object.keys(raw) as TemplateKey[]) {
          const val = (raw as Record<string, unknown>)[key];
          if (Array.isArray(val)) {
            parsed[key] = val as SectionInstance[];
          }
        }
      }
    }

    set({ settings: s, pageSections: parsed, dirty: false, history: [], future: [], lastPropSnapshot: null });
  },

  updateSettings: (partial) => {
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...partial } : null,
      dirty: true,
    }));
  },

  switchTemplate: (t) => set({ activeTemplate: t, selectedId: null }),

  setDevice: (d) => set({ device: d }),

  setLeftTab: (t) => set({ leftTab: t }),

  selectSection: (id) => set({ selectedId: id }),

  getSections: () => {
    const s = get();
    return s.pageSections[s.activeTemplate] ?? EMPTY_SECTIONS;
  },

  addSection: (blockKey) => {
    const def = getBlock(blockKey);
    const instance: SectionInstance = {
      id: crypto.randomUUID(),
      blockKey,
      props: { ...def?.defaultProps },
    };
    set((state) => {
      const current = state.pageSections[state.activeTemplate];
      const next = [...current, instance];
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        selectedId: instance.id,
        dirty: true,
        history: pushHistory(state.history, state.activeTemplate, current),
        future: [],
      };
    });
  },

  removeSection: (id) => {
    set((state) => {
      const current = state.pageSections[state.activeTemplate];
      const next = current.filter((s) => s.id !== id);
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        selectedId: state.selectedId === id ? null : state.selectedId,
        dirty: true,
        history: pushHistory(state.history, state.activeTemplate, current),
        future: [],
      };
    });
  },

  moveSection: (fromIndex, toIndex) => {
    set((state) => {
      const current = [...state.pageSections[state.activeTemplate]];
      if (fromIndex < 0 || fromIndex >= current.length) return state;
      if (toIndex < 0 || toIndex >= current.length) return state;
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: current },
        dirty: true,
        history: pushHistory(state.history, state.activeTemplate, state.pageSections[state.activeTemplate]),
        future: [],
      };
    });
  },

  duplicateSection: (id) => {
    set((state) => {
      const current = state.pageSections[state.activeTemplate];
      const original = current.find((s) => s.id === id);
      if (!original) return state;
      const clone: SectionInstance = {
        ...original,
        id: crypto.randomUUID(),
        props: { ...original.props },
        styleOverrides: original.styleOverrides
          ? { ...original.styleOverrides }
          : undefined,
      };
      const idx = current.findIndex((s) => s.id === id);
      const next = [...current];
      next.splice(idx + 1, 0, clone);
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        selectedId: clone.id,
        dirty: true,
        history: pushHistory(state.history, state.activeTemplate, current),
        future: [],
      };
    });
  },

  updateSectionProps: (id, props) => {
    set((state) => {
      const current = state.pageSections[state.activeTemplate];
      const snapshot = JSON.stringify(current);
      const shouldPush = state.lastPropSnapshot !== null && state.lastPropSnapshot !== snapshot;

      const next = current.map((s) =>
        s.id === id ? { ...s, props: { ...s.props, ...props } } : s,
      );
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        dirty: true,
        history: shouldPush
          ? pushHistory(state.history, state.activeTemplate, current)
          : state.history,
        future: shouldPush ? [] : state.future,
        lastPropSnapshot: JSON.stringify(next),
      };
    });
  },

  updateSectionStyles: (id, styles) => {
    set((state) => {
      const current = state.pageSections[state.activeTemplate];
      const next = current.map((s) =>
        s.id === id
          ? { ...s, styleOverrides: { ...s.styleOverrides, ...styles } }
          : s,
      );
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        dirty: true,
        history: pushHistory(state.history, state.activeTemplate, current),
        future: [],
      };
    });
  },

  toggleSectionVisibility: (id) => {
    set((state) => {
      const current = state.pageSections[state.activeTemplate];
      const next = current.map((s) =>
        s.id === id
          ? {
              ...s,
              styleOverrides: {
                ...s.styleOverrides,
                hidden: !s.styleOverrides?.hidden,
              },
            }
          : s,
      );
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        dirty: true,
      };
    });
  },

  undo: () => {
    set((state) => {
      if (state.history.length === 0) return state;
      const entry = state.history[state.history.length - 1];
      if (entry.template !== state.activeTemplate) return state;

      const current = state.pageSections[state.activeTemplate];
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: entry.sections },
        history: state.history.slice(0, -1),
        future: [{ template: state.activeTemplate, sections: current }, ...state.future].slice(0, 50),
        dirty: true,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const entry = state.future[0];
      if (entry.template !== state.activeTemplate) return state;

      const current = state.pageSections[state.activeTemplate];
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: entry.sections },
        history: pushHistory(state.history, state.activeTemplate, current),
        future: state.future.slice(1),
        dirty: true,
      };
    });
  },

  canUndo: () => {
    const s = get();
    return s.history.length > 0 && s.history[s.history.length - 1].template === s.activeTemplate;
  },
  canRedo: () => {
    const s = get();
    return s.future.length > 0 && s.future[0].template === s.activeTemplate;
  },

  setSaving: (v) => set({ saving: v }),
  setDirty: (v) => set({ dirty: v }),
  setPublishStatus: (s) => set({ publishStatus: s }),

  getSerializableSections: () => get().pageSections,
}));
