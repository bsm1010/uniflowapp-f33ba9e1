import { useEffect, useState } from "react";
import { Plus, Store as StoreIcon, Loader2, ShoppingBag } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore, type Store } from "@/hooks/use-current-store";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CreateStoreWizard } from "@/components/dashboard/CreateStoreWizard";
import { cn } from "@/lib/utils";

export function StorePickerDialog() {
  const { stores, currentStore, setCurrent, pickerOpen, closePicker, refresh } = useCurrentStore();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (!pickerOpen || stores.length === 0) return;
    (async () => {
      const ids = stores.map((s) => s.id);
      const { data } = await supabase.from("orders").select("store_id").in("store_id", ids);
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.store_id) map[row.store_id] = (map[row.store_id] ?? 0) + 1;
      }
      setCounts(map);
    })();
  }, [pickerOpen, stores]);

  const pick = async (s: Store) => {
    await setCurrent(s.id);
    closePicker();
    navigate({ to: "/dashboard" });
  };

  return (
    <>
      <Dialog open={pickerOpen} onOpenChange={(o) => (o ? null : closePicker())}>
        <DialogContent className="max-w-4xl border border-gray-200 bg-white dark:bg-background dark:border-border/60 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-3 shadow-soft">
              <StoreIcon className="h-6 w-6 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-display font-bold">
              Which store would you like to manage?
            </DialogTitle>
            <DialogDescription className="mt-2">
              Switch between your stores or create a new one.
            </DialogDescription>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto p-1">
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => pick(s)}
                className={cn(
                  "group relative rounded-2xl border bg-white dark:bg-zinc-950 p-5 text-left transition-all duration-200 text-gray-900 dark:text-white dark:border-white/10",
                  "hover:-translate-y-1 hover:shadow-xl hover:border-primary/50 dark:hover:border-primary/60",
                  currentStore?.id === s.id && "ring-2 ring-primary",
                )}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
                    {s.logo_url ? (
                      <img src={s.logo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <StoreIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{s.name}</div>
                    <div className="text-xs text-gray-500 dark:text-white/50 capitalize truncate">
                      {s.category}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2 py-1 text-gray-600 dark:text-white/80">
                    <ShoppingBag className="h-3 w-3" />
                    {counts[s.id] ?? 0} orders
                  </span>
                  <span className="text-gray-400 dark:text-white/50">{s.currency}</span>
                </div>
              </button>
            ))}

            <button
              onClick={() => {
                closePicker();
                setWizardOpen(true);
              }}
              className="rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary/60 p-5 flex flex-col items-center justify-center gap-2 min-h-[140px] text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Plus className="h-6 w-6" />
              <span className="text-sm font-medium">Create New Store</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateStoreWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreated={async (id) => {
          await refresh();
          await setCurrent(id);
          setWizardOpen(false);
          navigate({ to: "/dashboard" });
        }}
      />
    </>
  );
}
