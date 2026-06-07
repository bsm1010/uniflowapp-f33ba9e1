import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Store = {
  id: string;
  owner_id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string;
  category: string;
  currency: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

interface Ctx {
  stores: Store[];
  currentStore: Store | null;
  loading: boolean;
  setCurrent: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  pickerOpen: boolean;
  openPicker: () => void;
  closePicker: () => void;
}

const CurrentStoreCtx = createContext<Ctx | undefined>(undefined);

export function CurrentStoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [autoOpenedOnce, setAutoOpenedOnce] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: storesData }, { data: prof }] = await Promise.all([
      supabase.from("stores").select("id, owner_id, name, slug, logo_url, description, category, currency, is_default, is_active, tiktok_pixel_id, created_at, updated_at").eq("owner_id", user.id).order("created_at", { ascending: true }),
      supabase.from("profiles").select("current_store_id").eq("id", user.id).maybeSingle(),
    ]);
    const list = (storesData ?? []) as Store[];
    setStores(list);
    let cur = prof?.current_store_id ?? null;
    if (!cur || !list.find((s) => s.id === cur)) {
      cur = list.find((s) => s.is_default)?.id ?? list[0]?.id ?? null;
    }
    setCurrentId(cur);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  // Auto-open picker the first time after login if user has multiple stores
  useEffect(() => {
    if (!loading && !autoOpenedOnce && stores.length > 1) {
      setPickerOpen(true);
      setAutoOpenedOnce(true);
    }
  }, [loading, stores.length, autoOpenedOnce]);

  const setCurrent = useCallback(
    async (id: string) => {
      if (!user) return;
      setCurrentId(id);
      await supabase.from("profiles").update({ current_store_id: id }).eq("id", user.id);
    },
    [user],
  );

  const currentStore = useMemo(() => stores.find((s) => s.id === currentId) ?? null, [stores, currentId]);

  const value: Ctx = {
    stores,
    currentStore,
    loading,
    setCurrent,
    refresh: load,
    pickerOpen,
    openPicker: () => setPickerOpen(true),
    closePicker: () => setPickerOpen(false),
  };

  return <CurrentStoreCtx.Provider value={value}>{children}</CurrentStoreCtx.Provider>;
}

export function useCurrentStore() {
  const ctx = useContext(CurrentStoreCtx);
  if (!ctx) throw new Error("useCurrentStore must be used within CurrentStoreProvider");
  return ctx;
}
