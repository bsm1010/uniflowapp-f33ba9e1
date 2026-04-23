import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Truck, Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ALGERIAN_WILAYAS } from "@/lib/algeriaWilayas";
import { ShippingCompaniesSection } from "@/components/dashboard/ShippingCompaniesSection";

export const Route = createFileRoute("/dashboard/delivery")({
  component: DeliverySettingsPage,
  head: () => ({ meta: [{ title: "Delivery Settings — Fennecly" }] }),
});

function DeliverySettingsPage() {
  const { user } = useAuth();
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [initialPrices, setInitialPrices] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("delivery_tariffs")
        .select("wilaya, price")
        .eq("store_id", user.id);
      if (error) {
        toast.error("Failed to load delivery prices");
      } else {
        const map: Record<string, string> = {};
        for (const row of data ?? []) {
          map[row.wilaya] = String(row.price);
        }
        setPrices(map);
        setInitialPrices(map);
      }
      setLoading(false);
    })();
  }, [user]);

  const dirtyKeys = useMemo(() => {
    const keys: string[] = [];
    for (const w of ALGERIAN_WILAYAS) {
      const cur = (prices[w] ?? "").trim();
      const init = (initialPrices[w] ?? "").trim();
      if (cur !== init) keys.push(w);
    }
    return keys;
  }, [prices, initialPrices]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALGERIAN_WILAYAS;
    return ALGERIAN_WILAYAS.filter((w) => w.toLowerCase().includes(q));
  }, [search]);

  const setOne = (wilaya: string, value: string) => {
    // Allow only digits and a single decimal
    const cleaned = value.replace(/[^\d.]/g, "");
    setPrices((p) => ({ ...p, [wilaya]: cleaned }));
  };

  const saveAll = async () => {
    if (!user) return;
    if (dirtyKeys.length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);

    const toUpsert: { store_id: string; wilaya: string; price: number }[] = [];
    const toDelete: string[] = [];

    for (const w of dirtyKeys) {
      const raw = (prices[w] ?? "").trim();
      if (raw === "") {
        if (initialPrices[w] !== undefined) toDelete.push(w);
      } else {
        const num = Number(raw);
        if (Number.isNaN(num) || num < 0) {
          toast.error(`Invalid price for ${w}`);
          setSaving(false);
          return;
        }
        toUpsert.push({ store_id: user.id, wilaya: w, price: num });
      }
    }

    try {
      if (toUpsert.length > 0) {
        const { error } = await supabase
          .from("delivery_tariffs")
          .upsert(toUpsert, { onConflict: "store_id,wilaya" });
        if (error) throw error;
      }
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("delivery_tariffs")
          .delete()
          .eq("store_id", user.id)
          .in("wilaya", toDelete);
        if (error) throw error;
      }
      // Refresh baseline
      const newInit = { ...initialPrices };
      for (const row of toUpsert) newInit[row.wilaya] = String(row.price);
      for (const w of toDelete) delete newInit[w];
      setInitialPrices(newInit);
      // Normalize prices state to match (drop empties)
      const normalized: Record<string, string> = {};
      for (const w of ALGERIAN_WILAYAS) {
        if (newInit[w] !== undefined) normalized[w] = newInit[w];
      }
      setPrices(normalized);
      toast.success(`Saved ${dirtyKeys.length} change${dirtyKeys.length === 1 ? "" : "s"}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const configuredCount = Object.values(initialPrices).filter((v) => v !== "").length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Truck}
        title="Delivery Settings"
        description="Set delivery prices per Algerian wilaya. Customers will see these at checkout."
      />

      <ShippingCompaniesSection />

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-medium">
              {configuredCount} / 58 configured
            </Badge>
            {dirtyKeys.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/15">
                {dirtyKeys.length} unsaved
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search wilaya..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-56 pl-8"
              />
            </div>
            <Button
              onClick={saveAll}
              disabled={saving || loading || dirtyKeys.length === 0}
              className="gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="max-h-[65vh] overflow-y-auto">
              <ul className="divide-y">
                {filtered.map((wilaya, idx) => {
                  const code = ALGERIAN_WILAYAS.indexOf(wilaya) + 1;
                  const value = prices[wilaya] ?? "";
                  const isDirty = (initialPrices[wilaya] ?? "") !== value;
                  return (
                    <li
                      key={wilaya}
                      className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/30"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                        {String(code).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{wilaya}</p>
                      </div>
                      <div className="relative w-44">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="—"
                          value={value}
                          onChange={(e) => setOne(wilaya, e.target.value)}
                          className={`pr-14 text-right tabular-nums ${
                            isDirty ? "border-amber-400 ring-1 ring-amber-200" : ""
                          }`}
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                          DZD
                        </span>
                      </div>
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="px-5 py-12 text-center text-sm text-muted-foreground">
                    No wilayas match "{search}"
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
