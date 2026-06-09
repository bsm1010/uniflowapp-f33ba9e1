import { create } from "zustand";
import type { Tables } from "@/integrations/supabase/types";
import type { SectionInstance } from "@/components/storefront/blocks/types";
import { getBlock } from "@/components/storefront/blocks/registry";

type StoreSettings = Tables<"store_settings">;

export type TemplateKey = "home" | "product" | "collection" | "cart" | "page";
export type DeviceMode = "desktop" | "tablet" | "mobile";
export type LeftTab = "sections" | "theme" | "pages";

interface EditorState {
  settings: StoreSettings | null;
  pageSections: Record<TemplateKey, SectionInstance[]>;
  activeTemplate: TemplateKey;
  selectedId: string | null;
  device: DeviceMode;
  leftTab: LeftTab;
  dirty: boolean;
  saving: boolean;
  history: SectionInstance[][];
  future: SectionInstance[][];
  publishStatus: "published" | "draft";

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

    set({ settings: s, pageSections: parsed, dirty: false, history: [], future: [] });
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
        history: [...state.history, current].slice(-50),
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
        history: [...state.history, current].slice(-50),
        future: [],
      };
    });
  },

  moveSection: (fromIndex, toIndex) => {
    set((state) => {
      const current = [...state.pageSections[state.activeTemplate]];
      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: current },
        dirty: true,
        history: [...state.history, state.pageSections[state.activeTemplate]].slice(-50),
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
        styleOverrides: original.styleOverrides ? { ...original.styleOverrides } : undefined,
      };
      const idx = current.findIndex((s) => s.id === id);
      const next = [...current];
      next.splice(idx + 1, 0, clone);
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        selectedId: clone.id,
        dirty: true,
        history: [...state.history, current].slice(-50),
        future: [],
      };
    });
  },

  updateSectionProps: (id, props) => {
    set((state) => {
      const current = state.pageSections[state.activeTemplate];
      const next = current.map((s) =>
        s.id === id ? { ...s, props: { ...s.props, ...props } } : s,
      );
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        dirty: true,
      };
    });
  },

  updateSectionStyles: (id, styles) => {
    set((state) => {
      const current = state.pageSections[state.activeTemplate];
      const next = current.map((s) =>
        s.id === id ? { ...s, styleOverrides: { ...s.styleOverrides, ...styles } } : s,
      );
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        dirty: true,
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
                fullWidth: (s.styleOverrides?.fullWidth ?? false) ? undefined : true,
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
      const prev = state.history[state.history.length - 1];
      const current = state.pageSections[state.activeTemplate];
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: prev },
        history: state.history.slice(0, -1),
        future: [current, ...state.future].slice(0, 50),
        dirty: true,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const current = state.pageSections[state.activeTemplate];
      return {
        pageSections: { ...state.pageSections, [state.activeTemplate]: next },
        history: [...state.history, current].slice(-50),
        future: state.future.slice(1),
        dirty: true,
      };
    });
  },

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  setSaving: (v) => set({ saving: v }),
  setDirty: (v) => set({ dirty: v }),
  setPublishStatus: (s) => set({ publishStatus: s }),

  getSerializableSections: () => get().pageSections,
}));
