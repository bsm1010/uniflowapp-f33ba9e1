import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Store as StoreIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CreateStoreWizard } from "@/components/dashboard/CreateStoreWizard";
import { Img } from "@/components/ui/Img";

export const Route = createFileRoute("/select-store")({
  component: SelectStorePage,
});

type StoreRow = {
  id: string;
  name: string;
  logo_url: string | null;
  category: string | null;
};

function SelectStorePage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [stores, setStores] = useState<StoreRow[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [authLoading, user, navigate]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("id, name, logo_url, category")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    const list = (data ?? []) as StoreRow[];
    setStores(list);

    if (list.length > 0) {
      const ids = list.map((s) => s.id);
      const { data: orders } = await supabase.from("orders").select("store_id").in("store_id", ids);
      const map: Record<string, number> = {};
      for (const row of orders ?? []) {
        if (row.store_id) map[row.store_id] = (map[row.store_id] ?? 0) + 1;
      }
      setCounts(map);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auto-select if only one store
  useEffect(() => {
    if (!loading && stores.length === 1) {
      handleSelect(stores[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, stores]);

  const handleSelect = async (storeId: string) => {
    localStorage.setItem("selectedStore", storeId);
    if (user) {
      await supabase.from("profiles").update({ current_store_id: storeId }).eq("id", user.id);
    }
    navigate({ to: "/dashboard" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground text-xl font-bold mb-4">
            F
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Select Your Store</h1>
          <p className="text-muted-foreground mt-3">
            {stores.length === 0
              ? "Create your first store to get started"
              : "Choose which store you want to manage"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stores.map((store, i) => (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              key={store.id}
              onClick={() => handleSelect(store.id)}
              className="rounded-3xl border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-xl"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold mb-5 overflow-hidden">
                {store.logo_url ? (
                  <Img src={store.logo_url} alt={(store.name || "Store") + " logo"} className="h-full w-full" />
                ) : (
                  store.name.charAt(0).toUpperCase()
                )}
              </div>
              <h2 className="text-xl font-semibold truncate">{store.name}</h2>
              <p className="text-sm text-muted-foreground mt-2">{counts[store.id] ?? 0} orders</p>
            </motion.button>
          ))}

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: stores.length * 0.05 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setWizardOpen(true)}
            className="rounded-3xl border-2 border-dashed p-6 flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all min-h-[180px]"
          >
            <Plus className="h-8 w-8 mb-2" />
            <span className="font-medium">Create New Store</span>
          </motion.button>
        </div>
      </div>

      <CreateStoreWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={async (id) => {
          setWizardOpen(false);
          await handleSelect(id);
        }}
      />
    </div>
  );
}
