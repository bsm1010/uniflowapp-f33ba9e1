import { useEffect, useState } from "react";
import { Truck, Loader2, Star, Eye, EyeOff, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

type Company = { id: string; name: string };
type StoreRow = {
  company_id: string;
  enabled: boolean;
  is_default: boolean;
  api_key: string;
};

export function ShippingCompaniesSection() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rows, setRows] = useState<Record<string, StoreRow>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: comps }, { data: store }] = await Promise.all([
        supabase
          .from("delivery_companies")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("store_delivery_companies")
          .select("company_id, enabled, is_default, api_key")
          .eq("store_id", user.id),
      ]);
      const list = (comps ?? []) as Company[];
      setCompanies(list);
      const map: Record<string, StoreRow> = {};
      for (const c of list) {
        map[c.id] = { company_id: c.id, enabled: false, is_default: false, api_key: "" };
      }
      for (const r of (store ?? []) as StoreRow[]) {
        map[r.company_id] = { ...map[r.company_id], ...r };
      }
      setRows(map);
      setLoading(false);
    })();
  }, [user]);

  const persist = async (companyId: string, patch: Partial<StoreRow>) => {
    if (!user) return;
    const next = { ...rows[companyId], ...patch };
    setRows((p) => ({ ...p, [companyId]: next }));
    setSavingId(companyId);
    try {
      // If setting as default, unset others first
      if (patch.is_default === true) {
        await supabase
          .from("store_delivery_companies")
          .update({ is_default: false })
          .eq("store_id", user.id)
          .neq("company_id", companyId);
        setRows((p) => {
          const copy = { ...p };
          for (const id of Object.keys(copy)) {
            if (id !== companyId) copy[id] = { ...copy[id], is_default: false };
          }
          return copy;
        });
      }
      const { error } = await supabase.from("store_delivery_companies").upsert(
        {
          store_id: user.id,
          company_id: companyId,
          enabled: next.enabled,
          is_default: next.is_default,
          api_key: next.api_key,
        },
        { onConflict: "store_id,company_id" },
      );
      if (error) throw error;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold leading-none">Shipping Companies</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Enable carriers, add API keys, and set a default.
            </p>
          </div>
        </div>
        <Badge variant="secondary">{companies.length} available</Badge>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : companies.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No shipping companies available yet.
          </div>
        ) : (
          <ul className="divide-y">
            {companies.map((c) => {
              const r = rows[c.id];
              const visible = !!showKey[c.id];
              return (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-sm font-bold text-primary">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{c.name}</p>
                          {r?.is_default && (
                            <Badge className="gap-1 bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">
                              <Star className="h-3 w-3 fill-current" />
                              Default
                            </Badge>
                          )}
                          {r?.enabled && !r?.is_default && (
                            <Badge variant="secondary">Enabled</Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r?.enabled ? "Active for your store" : "Disabled"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {savingId === c.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant={r?.is_default ? "secondary" : "outline"}
                        disabled={!r?.enabled || r?.is_default}
                        onClick={() => persist(c.id, { is_default: true })}
                        className="gap-1.5"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${r?.is_default ? "fill-current" : ""}`}
                        />
                        {r?.is_default ? "Default" : "Set default"}
                      </Button>
                      <Switch
                        checked={!!r?.enabled}
                        onCheckedChange={(v) =>
                          persist(c.id, { enabled: v, is_default: v ? r?.is_default : false })
                        }
                      />
                    </div>
                  </div>

                  {r?.enabled && (
                    <div className="mt-3 flex items-center gap-2 pl-13">
                      <div className="relative flex-1">
                        <Input
                          type={visible ? "text" : "password"}
                          placeholder={`${c.name} API key`}
                          value={r.api_key}
                          onChange={(e) =>
                            setRows((p) => ({
                              ...p,
                              [c.id]: { ...p[c.id], api_key: e.target.value },
                            }))
                          }
                          className="pr-10 font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowKey((p) => ({ ...p, [c.id]: !p[c.id] }))
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={visible ? "Hide key" : "Show key"}
                        >
                          {visible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => persist(c.id, { api_key: r.api_key })}
                        className="gap-1.5"
                      >
                        <Save className="h-3.5 w-3.5" />
                        Save key
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
