import React, { useEffect, useMemo, useState } from "react";
import { Loader2, Search, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type TariffRow = {
  company_id: string;
  company_name?: string;
  wilaya: string;
  delivery_type: string;
  price: number;
};

type WilayaComparison = {
  wilaya: string;
  carriers: Record<string, { domicile: number | null; stopdesk: number | null }>;
};

export function RatesComparisonTable({
  connectedCompanies,
}: {
  connectedCompanies: { companyId: string; name: string; enabled: boolean }[];
}) {
  const { user } = useAuth();
  const [tariffs, setTariffs] = useState<TariffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user || connectedCompanies.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const companyIds = connectedCompanies.map((c) => c.companyId);
      const { data } = await supabase
        .from("delivery_tariffs")
        .select("company_id, wilaya, delivery_type, price")
        .eq("store_id", user.id)
        .in("company_id", companyIds);
      if (!cancelled) {
        const mapped = (data ?? []).map((r) => ({
          ...r,
          company_name: connectedCompanies.find((c) => c.companyId === r.company_id)?.name ?? "Unknown",
        })) as TariffRow[];
        setTariffs(mapped);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, connectedCompanies]);

  const companyNames = useMemo(
    () => [...new Set(tariffs.map((t) => t.company_name ?? ""))].filter(Boolean),
    [tariffs],
  );

  const comparison: WilayaComparison[] = useMemo(() => {
    const map = new Map<string, WilayaComparison>();
    for (const t of tariffs) {
      const w = t.wilaya.trim();
      if (!w) continue;
      const entry = map.get(w) ?? { wilaya: w, carriers: {} };
      const carrier = entry.carriers[t.company_name ?? ""] ?? { domicile: null, stopdesk: null };
      const price = Number(t.price) || 0;
      if (t.delivery_type === "domicile") {
        carrier.domicile = carrier.domicile == null ? price : Math.min(carrier.domicile, price);
      } else if (t.delivery_type === "stopdesk") {
        carrier.stopdesk = carrier.stopdesk == null ? price : Math.min(carrier.stopdesk, price);
      }
      entry.carriers[t.company_name ?? ""] = carrier;
      map.set(w, entry);
    }
    return Array.from(map.values()).sort((a, b) => a.wilaya.localeCompare(b.wilaya));
  }, [tariffs]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return comparison;
    return comparison.filter((r) => r.wilaya.toLowerCase().includes(needle));
  }, [comparison, q]);

  if (connectedCompanies.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 px-5 py-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Rate comparison by carrier</span>
          <Badge variant="secondary" className="text-[10px]">{comparison.length} wilayas</Badge>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search wilaya…"
            className="h-7 w-44 pl-7 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading rates…
          </div>
        ) : comparison.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No synced rates found. Connect and sync a delivery carrier first.
          </div>
        ) : (
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/60 text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Wilaya</th>
                  {companyNames.map((name) => (
                    <th key={name} colSpan={2} className="px-2 py-2 text-center font-medium">
                      {name}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="px-3 py-1" />
                  {companyNames.map((name) => (
                    <React.Fragment key={name}>
                      <th className="px-2 py-1 text-right text-[10px] font-normal">Home</th>
                      <th className="px-2 py-1 text-right text-[10px] font-normal">Desk</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.wilaya} className="border-t">
                    <td className="px-3 py-1.5 font-medium">{row.wilaya}</td>
                    {companyNames.map((name) => {
                      const c = row.carriers[name];
                      return (
                        <React.Fragment key={`${row.wilaya}-${name}`}>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {c?.domicile != null ? `${c.domicile} DZD` : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-2 py-1.5 text-right tabular-nums">
                            {c?.stopdesk != null ? `${c.stopdesk} DZD` : <span className="text-muted-foreground">—</span>}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={1 + companyNames.length * 2} className="px-3 py-4 text-center text-muted-foreground">
                      No matches
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
