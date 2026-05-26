import { useState } from "react";
import { Loader2, Send, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { bulkPushOrderToProviders } from "@/lib/delivery/bulk-push.functions";
import type { BulkPushResult } from "@/lib/delivery/bulk-push.functions";

type ConnectedCarrier = {
  companyId: string;
  name: string;
  enabled: boolean;
};

type BulkPushSectionProps = {
  carriers: ConnectedCarrier[];
  onDone?: () => void;
};

export function BulkPushSection({ carriers, onDone }: BulkPushSectionProps) {
  const { session } = useAuth();
  const bulkPushFn = useServerFn(bulkPushOrderToProviders);
  const [orderId, setOrderId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState<BulkPushResult | null>(null);

  const enabledCarriers = carriers.filter((c) => c.enabled);

  const toggleCarrier = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(enabledCarriers.map((c) => c.companyId)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
    setResult(null);
  };

  const handlePush = async () => {
    if (!session?.access_token) {
      toast.error("Please sign in again.");
      return;
    }
    if (!orderId.trim()) {
      toast.error("Enter an order ID.");
      return;
    }
    if (selectedIds.size === 0) {
      toast.error("Select at least one carrier.");
      return;
    }
    setPushing(true);
    setResult(null);
    try {
      const res = await bulkPushFn({
        data: {
          accessToken: session.access_token,
          orderId: orderId.trim(),
          companyIds: Array.from(selectedIds),
        },
      });
      setResult(res);
      if (res.ok) {
        const successCount = res.results.filter((r) => r.ok).length;
        toast.success(`Pushed to ${successCount}/${res.results.length} carriers`);
        if (onDone) onDone();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("Failed to push order.");
    } finally {
      setPushing(false);
    }
  };

  if (enabledCarriers.length === 0) {
    return null;
  }

  return (
    <Card>
      <div className="flex items-center gap-2 border-b bg-amber-500/10 px-5 py-3">
        <Send className="h-4 w-4 text-amber-600" />
        <span className="text-sm font-medium">Bulk push — send to multiple carriers</span>
      </div>
      <CardContent className="space-y-3 p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Order ID</label>
          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Paste order UUID…"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none ring-primary/30 focus:ring-2"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Carriers ({selectedIds.size} selected)</label>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-[11px] text-primary underline">Select all</button>
              <button onClick={clearAll} className="text-[11px] text-muted-foreground underline">Clear</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {enabledCarriers.map((c) => (
              <button
                key={c.companyId}
                onClick={() => toggleCarrier(c.companyId)}
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedIds.has(c.companyId)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                }`}
              >
                {selectedIds.has(c.companyId) ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <div className="h-3 w-3 rounded-full border" />
                )}
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="button"
          onClick={handlePush}
          disabled={pushing || !orderId.trim() || selectedIds.size === 0}
          className="w-full gap-1.5"
        >
          {pushing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {pushing ? "Pushing…" : `Push to ${selectedIds.size} carrier${selectedIds.size !== 1 ? "s" : ""}`}
        </Button>

        {result && result.ok && (
          <div className="space-y-1 rounded-md border bg-card p-3 text-xs">
            <p className="font-medium">Results:</p>
            {result.results.map((r) => (
              <div key={r.companyId} className="flex items-center gap-2">
                {r.ok ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-3 w-3 shrink-0 text-destructive" />
                )}
                <span className={r.ok ? "text-emerald-700" : "text-destructive"}>
                  {r.ok ? `${r.trackingNumber ?? "Sent"}` : r.message}
                </span>
              </div>
            ))}
          </div>
        )}

        {result && !result.ok && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {result.message}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
