import { useEffect, useMemo, useState } from "react";
import { Search, Save, Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ALGERIAN_WILAYAS } from "@/lib/algeriaWilayas";

type Company = { id: string; name: string };

export function TariffsSection() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [initialPrices, setInitialPrices] = useState<Record<string, string>>({});
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // Load companies + pick default
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingCompanies(true);
      const [{ data: comps }, { data: storeComps }] = await Promise.all([
        supabase
          .from("delivery_companies")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("store_delivery_companies")
          .select("company_id, is_default, enabled")
          .eq("store_id", user.id),
      ]);
      const list = (comps ?? []) as Company[];
      setCompanies(list);
      const def = (storeComps ?? []).find((s) => s.is_default)?.company_id;
      const firstEnabled = (storeComps ?? []).find((s) => s.enabled)?.company_id;
      setCompanyId(def || firstEnabled || list[0]?.id || "");
      setLoadingCompanies(false);
    })();
  }, [user]);

  // Load tariffs for selected company
  useEffect(() => {
    if (!user || !companyId) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("delivery_tariffs")
        .select("wilaya, price")
        .eq("store_id", user.id)
        .eq("company_id", companyId);
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
  }, [user, companyId]);

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
    const cleaned = value.replace(/[^\d.]/g, "");
    setPrices((p) => ({ ...p, [wilaya]: cleaned }));
  };

  const fillAll = () => {
    const first = prices[ALGERIAN_WILAYAS[0]] || Object.values(prices).find((v) => v) || "";
    if (!first) {
      toast.info("Set a price on the first row, then click Apply to all");
      return;
    }
    const next: Record<string, string> = {};
    for (const w of ALGERIAN_WILAYAS) next[w] = first;
    setPrices(next);
  };

  const saveAll = async () => {
    if (!user || !companyId) return;
    if (dirtyKeys.length === 0) {
      toast.info("No changes to save");
      return;
    }
    setSaving(true);

    const toUpsert: {
      store_id: string;
      company_id: string;
      wilaya: string;
      price: number;
    }[] = [];
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
        toUpsert.push({ store_id: user.id, company_id: companyId, wilaya: w, price: num });
      }
    }

    try {
      if (toUpsert.length > 0) {
        const { error } = await supabase
          .from("delivery_tariffs")
          .upsert(toUpsert, { onConflict: "store_id,wilaya,company_id" });
        if (error) throw error;
      }
      if (toDelete.length > 0) {
        const { error } = await supabase
          .from("delivery_tariffs")
          .delete()
          .eq("store_id", user.id)
          .eq("company_id", companyId)
          .in("wilaya", toDelete);
        if (error) throw error;
      }
      const newInit = { ...initialPrices };
      for (const row of toUpsert) newInit[row.wilaya] = String(row.price);
      for (const w of toDelete) delete newInit[w];
      setInitialPrices(newInit);
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

  if (loadingCompanies) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
        </CardContent>
      </Card>
    );
  }

  if (companies.length === 0) {
    return (
      <Card>
        <CardContent className="px-5 py-12 text-center text-sm text-muted-foreground">
          No shipping companies available. Add one in the Companies tab first.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Company</span>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              className="h-9 w-48 pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={fillAll} className="h-9">
            Apply to all
          </Button>
          <Button
            onClick={saveAll}
            disabled={saving || loading || dirtyKeys.length === 0}
            className="h-9 gap-2"
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
          <div className="max-h-[60vh] overflow-y-auto">
            <ul className="divide-y">
              {filtered.map((wilaya) => {
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
  );
}
