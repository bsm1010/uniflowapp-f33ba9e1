import { useEffect, useMemo, useState } from "react";
import { Search, Save, Loader2, Truck, Home, Store, Zap, Info } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { ALGERIA_GEO, getCitiesForWilaya } from "@/lib/algeriaWilayas";

const AUTO_TARIFFS_STORAGE_KEY = "fennecly:auto-tariffs";

function loadAutoTariffsMap(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(AUTO_TARIFFS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, boolean>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

function saveAutoTariffsMap(map: Record<string, boolean>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTO_TARIFFS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

type Company = { id: string; name: string };
type DeliveryType = "domicile" | "stopdesk";

// key: `${wilaya}|${city}|${type}` → price string
type PriceMap = Record<string, string>;

const cellKey = (wilaya: string, city: string, type: DeliveryType) =>
  `${wilaya}|${city}|${type}`;

export function TariffsSection() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyId, setCompanyId] = useState<string>("");
  const [prices, setPrices] = useState<PriceMap>({});
  const [initialPrices, setInitialPrices] = useState<PriceMap>({});
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [autoMap, setAutoMap] = useState<Record<string, boolean>>(() =>
    loadAutoTariffsMap(),
  );
  const autoEnabled = !!autoMap[companyId];

  const setAutoEnabled = (enabled: boolean) => {
    if (!companyId) return;
    const next = { ...autoMap, [companyId]: enabled };
    setAutoMap(next);
    saveAutoTariffsMap(next);
    toast.success(
      enabled
        ? "Automatic tariffs enabled — manual editing disabled."
        : "Switched to manual tariffs.",
    );
  };

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
        .select("wilaya, city, delivery_type, price")
        .eq("store_id", user.id)
        .eq("company_id", companyId);
      if (error) {
        toast.error("Failed to load delivery prices");
      } else {
        const map: PriceMap = {};
        for (const row of data ?? []) {
          const type = (row.delivery_type === "stopdesk" ? "stopdesk" : "domicile") as DeliveryType;
          map[cellKey(row.wilaya, row.city ?? "", type)] = String(row.price);
        }
        setPrices(map);
        setInitialPrices(map);
      }
      setLoading(false);
    })();
  }, [user, companyId]);

  const dirtyKeys = useMemo(() => {
    const all = new Set([...Object.keys(prices), ...Object.keys(initialPrices)]);
    const keys: string[] = [];
    for (const k of all) {
      if ((prices[k] ?? "").trim() !== (initialPrices[k] ?? "").trim()) keys.push(k);
    }
    return keys;
  }, [prices, initialPrices]);

  const filteredWilayas = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ALGERIA_GEO;
    return ALGERIA_GEO.filter(
      (w) =>
        w.wilaya.toLowerCase().includes(q) ||
        w.cities.some((c) => c.toLowerCase().includes(q)),
    );
  }, [search]);

  const setOne = (wilaya: string, city: string, type: DeliveryType, value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    setPrices((p) => ({ ...p, [cellKey(wilaya, city, type)]: cleaned }));
  };

  const configuredWilayas = useMemo(() => {
    const set = new Set<string>();
    for (const k of Object.keys(initialPrices)) {
      if ((initialPrices[k] ?? "").trim() !== "") set.add(k.split("|")[0]);
    }
    return set;
  }, [initialPrices]);

  const wilayaCounts = (wilaya: string) => {
    const cities = getCitiesForWilaya(wilaya);
    let dom = 0;
    let sd = 0;
    for (const c of cities) {
      if ((prices[cellKey(wilaya, c, "domicile")] ?? "").trim() !== "") dom++;
      if ((prices[cellKey(wilaya, c, "stopdesk")] ?? "").trim() !== "") sd++;
    }
    return { dom, sd, total: cities.length };
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
      city: string;
      delivery_type: DeliveryType;
      price: number;
    }[] = [];
    const toDelete: { wilaya: string; city: string; type: DeliveryType }[] = [];

    for (const k of dirtyKeys) {
      const [wilaya, city, type] = k.split("|") as [string, string, DeliveryType];
      const raw = (prices[k] ?? "").trim();
      if (raw === "") {
        if (initialPrices[k] !== undefined) toDelete.push({ wilaya, city, type });
      } else {
        const num = Number(raw);
        if (Number.isNaN(num) || num < 0) {
          toast.error(`Invalid price for ${city} (${wilaya})`);
          setSaving(false);
          return;
        }
        toUpsert.push({
          store_id: user.id,
          company_id: companyId,
          wilaya,
          city,
          delivery_type: type,
          price: num,
        });
      }
    }

    try {
      if (toUpsert.length > 0) {
        const { error } = await supabase
          .from("delivery_tariffs")
          .upsert(toUpsert, {
            onConflict: "store_id,company_id,wilaya,city,delivery_type",
          });
        if (error) throw error;
      }
      for (const d of toDelete) {
        const { error } = await supabase
          .from("delivery_tariffs")
          .delete()
          .eq("store_id", user.id)
          .eq("company_id", companyId)
          .eq("wilaya", d.wilaya)
          .eq("city", d.city)
          .eq("delivery_type", d.type);
        if (error) throw error;
      }

      const newInit = { ...initialPrices };
      for (const row of toUpsert) {
        newInit[cellKey(row.wilaya, row.city, row.delivery_type)] = String(row.price);
      }
      for (const d of toDelete) {
        delete newInit[cellKey(d.wilaya, d.city, d.type)];
      }
      setInitialPrices(newInit);
      toast.success(
        `Saved ${dirtyKeys.length} change${dirtyKeys.length === 1 ? "" : "s"}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

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
            {configuredWilayas.size} / 58 wilayas configured
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
              placeholder="Search wilaya or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-56 pl-8"
            />
          </div>
          <Button
            onClick={saveAll}
            disabled={saving || loading || dirtyKeys.length === 0}
            className="h-9 gap-2"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
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
            <Accordion type="multiple" className="divide-y">
              {filteredWilayas.map(({ wilaya, code }) => {
                const cities = getCitiesForWilaya(wilaya);
                const counts = wilayaCounts(wilaya);
                return (
                  <AccordionItem
                    key={wilaya}
                    value={wilaya}
                    className="border-0"
                  >
                    <AccordionTrigger className="px-5 py-3 hover:bg-muted/40 hover:no-underline">
                      <div className="flex flex-1 items-center gap-3 pr-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                          {String(code).padStart(2, "0")}
                        </span>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{wilaya}</p>
                          <p className="text-xs text-muted-foreground">
                            {counts.total} {counts.total === 1 ? "city" : "cities"}
                          </p>
                        </div>
                        <div className="hidden items-center gap-2 sm:flex">
                          <Badge variant="outline" className="gap-1 font-normal">
                            <Home className="h-3 w-3" /> {counts.dom}/{counts.total}
                          </Badge>
                          <Badge variant="outline" className="gap-1 font-normal">
                            <Store className="h-3 w-3" /> {counts.sd}/{counts.total}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="bg-muted/20 px-5 pb-4 pt-1">
                      {cities.length === 0 ? (
                        <p className="py-2 text-sm text-muted-foreground">
                          No cities listed for this wilaya.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="hidden grid-cols-[1fr_180px_180px] gap-3 px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid">
                            <span>City</span>
                            <span className="flex items-center gap-1">
                              <Home className="h-3 w-3" /> Domicile (DZD)
                            </span>
                            <span className="flex items-center gap-1">
                              <Store className="h-3 w-3" /> Stop desk (DZD)
                            </span>
                          </div>
                          {cities.map((city) => {
                            const dKey = cellKey(wilaya, city, "domicile");
                            const sKey = cellKey(wilaya, city, "stopdesk");
                            const dVal = prices[dKey] ?? "";
                            const sVal = prices[sKey] ?? "";
                            const dDirty = (initialPrices[dKey] ?? "") !== dVal;
                            const sDirty = (initialPrices[sKey] ?? "") !== sVal;
                            return (
                              <div
                                key={city}
                                className="grid grid-cols-1 gap-2 rounded-md bg-background px-3 py-2 sm:grid-cols-[1fr_180px_180px] sm:items-center sm:gap-3"
                              >
                                <span className="truncate text-sm font-medium">
                                  {city}
                                </span>
                                <PriceInput
                                  value={dVal}
                                  dirty={dDirty}
                                  onChange={(v) => setOne(wilaya, city, "domicile", v)}
                                />
                                <PriceInput
                                  value={sVal}
                                  dirty={sDirty}
                                  onChange={(v) => setOne(wilaya, city, "stopdesk", v)}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
              {filteredWilayas.length === 0 && (
                <div className="px-5 py-12 text-center text-sm text-muted-foreground">
                  No matches for "{search}"
                </div>
              )}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PriceInput({
  value,
  dirty,
  onChange,
}: {
  value: string;
  dirty: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        placeholder="—"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`h-9 pr-12 text-right tabular-nums ${
          dirty ? "border-amber-400 ring-1 ring-amber-200" : ""
        }`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
        DZD
      </span>
    </div>
  );
}
