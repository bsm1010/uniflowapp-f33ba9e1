import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ReturnRow = Tables<"returns">;
type Order = Tables<"orders">;

export const Route = createFileRoute("/dashboard/returns")({
  component: ReturnsPage,
  head: () => ({ meta: [{ title: "Returns & Refunds — Fennecly" }] }),
});

const STATUS_VARIANT: Record<string, { label: string; className: string }> = {
  requested: { label: "Requested", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  approved: { label: "Approved", className: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
  rejected: { label: "Rejected", className: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  received: { label: "Received", className: "bg-violet-500/10 text-violet-600 border-violet-500/30" },
  refunded: { label: "Refunded", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
};

function ReturnsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<ReturnRow[] | null>(null);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReturnRow | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("returns")
      .select("*")
      .eq("store_owner_id", user.id)
      .order("created_at", { ascending: false });
    const list = data ?? [];
    setRows(list);
    if (list.length) {
      const ids = list.map((r) => r.order_id);
      const { data: ords } = await supabase.from("orders").select("*").in("id", ids);
      const map: Record<string, Order> = {};
      for (const o of ords ?? []) map[o.id] = o;
      setOrders(map);
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`returns-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "returns", filter: `store_owner_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateStatus = async (id: string, status: string, refund_amount?: number) => {
    const payload: Partial<ReturnRow> = { status };
    if (refund_amount !== undefined) payload.refund_amount = refund_amount;
    const { error } = await supabase.from("returns").update(payload).eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }
    toast.success(`Marked as ${status}`);
    setRows((cur) =>
      cur ? cur.map((r) => (r.id === id ? { ...r, ...payload } : r)) : cur,
    );
    if (selected?.id === id) setSelected({ ...selected, ...payload } as ReturnRow);
  };

  const filtered = useMemo(
    () =>
      (rows ?? []).filter((r) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          r.customer_name.toLowerCase().includes(q) ||
          r.customer_email.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q) ||
          r.id.toLowerCase().startsWith(q)
        );
      }),
    [rows, query],
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Operations"
        title="Returns & Refunds"
        description="Review and process customer return requests."
        icon={RotateCcw}
        gradient="from-rose-500 via-pink-500 to-fuchsia-500"
      />

      {rows === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No returns yet"
          description="When customers request a return, it will appear here."
        />
      ) : (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border/60 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, reason, or ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {filtered.length} of {rows.length}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Refund</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const status = STATUS_VARIANT[r.status] ?? {
                      label: r.status,
                      className: "bg-muted text-foreground border-border",
                    };
                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer"
                        onClick={() => setSelected(r)}
                      >
                        <TableCell className="font-mono text-xs">
                          #{r.order_id.slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{r.customer_name}</div>
                          <div className="text-xs text-muted-foreground">{r.customer_email}</div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={status.className}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {Number(r.refund_amount).toFixed(2)} DA
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(r.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Return request</SheetTitle>
                <SheetDescription>
                  #{selected.id.slice(0, 8).toUpperCase()}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div>
                  <div className="text-xs text-muted-foreground">Customer</div>
                  <div className="font-medium">{selected.customer_name}</div>
                  <div className="text-sm text-muted-foreground">{selected.customer_email}</div>
                </div>
                {orders[selected.order_id] && (
                  <div>
                    <div className="text-xs text-muted-foreground">Order</div>
                    <div className="text-sm">
                      #{selected.order_id.slice(0, 8).toUpperCase()} —{" "}
                      {Number(orders[selected.order_id].total).toFixed(2)} DA
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground">Reason</div>
                  <div className="text-sm">{selected.reason}</div>
                </div>
                {selected.details && (
                  <div>
                    <div className="text-xs text-muted-foreground">Details</div>
                    <p className="text-sm whitespace-pre-wrap">{selected.details}</p>
                  </div>
                )}
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Current status</div>
                  <Badge
                    variant="outline"
                    className={STATUS_VARIANT[selected.status]?.className}
                  >
                    {STATUS_VARIANT[selected.status]?.label ?? selected.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(selected.id, "approved")}
                    disabled={selected.status === "approved"}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(selected.id, "rejected")}
                    disabled={selected.status === "rejected"}
                  >
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateStatus(selected.id, "received")}
                    disabled={selected.status !== "approved"}
                  >
                    Mark Received
                  </Button>
                  <Button
                    onClick={() => {
                      const order = orders[selected.order_id];
                      const amt = order ? Number(order.total) : Number(selected.refund_amount);
                      updateStatus(selected.id, "refunded", amt);
                    }}
                    disabled={selected.status === "refunded"}
                  >
                    Refund
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
