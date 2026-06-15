import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Row = {
  wilaya: string;
  city: string;
  delivery_type: string;
  price: number;
};

type WilayaRow = {
  wilaya: string;
  domicile: number | null;
  stopdesk: number | null;
};

export function ZRExpressRatesPreview({ companyId }: { companyId: string }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("delivery_tariffs")
        .select("wilaya, city, delivery_type, price")
        .eq("store_id", user.id)
        .eq("company_id", companyId);
      if (!cancelled) {
        setRows((data ?? []) as Row[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, companyId]);

  const grouped: WilayaRow[] = useMemo(() => {
    const map = new Map<string, WilayaRow>();
    for (const r of rows) {
      const w = (r.wilaya ?? "").trim();
      if (!w) continue;
      const existing = map.get(w) ?? { wilaya: w, domicile: null, stopdesk: null };
      const p = Number(r.price) || 0;
      if (r.delivery_type === "domicile") {
        existing.domicile = existing.domicile == null ? p : Math.min(existing.domicile, p);
      } else if (r.delivery_type === "stopdesk") {
        existing.stopdesk = existing.stopdesk == null ? p : Math.min(existing.stopdesk, p);
      }
      map.set(w, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.wilaya.localeCompare(b.wilaya));
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return grouped;
    return grouped.filter((r) => r.wilaya.toLowerCase().includes(needle));
  }, [grouped, q]);

  if (loading) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading ZRExpress rates…
      </div>
    );
  }

  if (grouped.length === 0) {
    return (
      <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        No synced rates yet. Reconnect to trigger a fresh sync.
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-md border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium">ZRExpress rates</span>
          <Badge variant="secondary" className="text-[10px]">
            {grouped.length} wilayas
          </Badge>
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
      </div>
      <div className="max-h-72 overflow-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Wilaya</th>
              <th className="px-3 py-2 text-right font-medium">Home delivery</th>
              <th className="px-3 py-2 text-right font-medium">Stop desk</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.wilaya} className="border-t">
                <td className="px-3 py-1.5">{r.wilaya}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {r.domicile != null ? (
                    `${r.domicile} DZD`
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {r.stopdesk != null ? (
                    `${r.stopdesk} DZD`
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                  No matches
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
