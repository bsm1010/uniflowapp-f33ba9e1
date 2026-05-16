import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Search,
  ShoppingBag,
  Phone,
  MapPin,
  Truck,
  CheckCircle2,
  Download,
  Printer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateShipmentDialog } from "@/components/dashboard/CreateShipmentDialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { sendOrderStatusSms } from "@/lib/orders/sms.functions";
import type { Tables } from "@/integrations/supabase/types";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;
type Shipment = Tables<"shipments">;

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Orders — Fennecly" }] }),
});

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_VARIANT: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  confirmed: { label: "Confirmed", className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30" },
  shipped: { label: "Shipped", className: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30" },
  delivered: { label: "Delivered", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  cancelled: { label: "Cancelled", className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30" },
};

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});
  const [shipments, setShipments] = useState<Record<string, Shipment>>({});
  const [query, setQuery] = useState("");
  const [shipOrder, setShipOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadOrders = async () => {
    if (!user) return;
    const { data: ords } = await supabase
      .from("orders")
      .select("*")
      .eq("store_owner_id", user.id)
      .order("created_at", { ascending: false });
    const list = ords ?? [];
    setOrders(list);
    if (list.length) {
      const ids = list.map((o) => o.id);
      const [{ data: its }, { data: ships }] = await Promise.all([
        supabase.from("order_items").select("*").in("order_id", ids),
        supabase.from("shipments").select("*").in("order_id", ids),
      ]);
      const grouped: Record<string, OrderItem[]> = {};
      for (const it of its ?? []) (grouped[it.order_id] ??= []).push(it);
      setItems(grouped);
      const shipMap: Record<string, Shipment> = {};
      for (const s of ships ?? []) shipMap[s.order_id] = s;
      setShipments(shipMap);
    } else {
      setItems({});
      setShipments({});
    }
  };

  useEffect(() => {
    if (!user) return;
    loadOrders();
    const channel = supabase
      .channel(`orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `store_owner_id=eq.${user.id}` },
        () => loadOrders(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_items" },
        () => loadOrders(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateStatus = async (orderId: string, status: Status) => {
    const prev = orders;
    setOrders((cur) => (cur ? cur.map((o) => (o.id === orderId ? { ...o, status } : o)) : cur));
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) {
      setOrders(prev);
      toast.error("Failed to update status");
      return;
    }
    toast.success(`Order marked as ${STATUS_VARIANT[status].label}`);

    const smsStatuses = ["confirmed", "shipped", "delivered", "cancelled"] as const;
    if ((smsStatuses as readonly string[]).includes(status)) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (!accessToken) return;
        await sendOrderStatusSms({ data: { orderId, status, accessToken } });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const filtered = useMemo(
    () =>
      (orders ?? []).filter((o) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          o.customer_name.toLowerCase().includes(q) ||
          o.shipping_address.toLowerCase().includes(q) ||
          o.shipping_city.toLowerCase().includes(q) ||
          o.shipping_postal_code.toLowerCase().includes(q) ||
          o.id.toLowerCase().startsWith(q)
        );
      }),
    [orders, query],
  );

  const toggle = (id: string) => {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(new Set(filtered.map((o) => o.id)));
    else setSelectedIds(new Set());
  };

  const allChecked = filtered.length > 0 && filtered.every((o) => selectedIds.has(o.id));

  const bulkUpdateStatus = async (status: Status) => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const { error } = await supabase.from("orders").update({ status }).in("id", ids);
    if (error) {
      toast.error("Bulk update failed");
      return;
    }
    toast.success(`${ids.length} orders → ${STATUS_VARIANT[status].label}`);
    setOrders((cur) => cur?.map((o) => (selectedIds.has(o.id) ? { ...o, status } : o)) ?? null);
    setSelectedIds(new Set());
  };

  const exportCsv = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const rows = (orders ?? []).filter((o) => selectedIds.has(o.id));
    const headers = ["ID", "Customer", "Phone", "Wilaya", "City", "Status", "Total", "Date"];
    const csvRows = rows.map((o) =>
      [
        o.id,
        o.customer_name,
        o.shipping_address,
        o.shipping_postal_code,
        o.shipping_city,
        o.status,
        o.total,
        new Date(o.created_at).toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} orders`);
  };

  const printLabels = () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const rows = (orders ?? []).filter((o) => selectedIds.has(o.id));
    const win = window.open("", "_blank");
    if (!win) return;
    const html = `
      <html><head><title>Shipping Labels</title><style>
        body{font-family:system-ui,sans-serif;padding:20px}
        .label{border:2px solid #000;padding:16px;margin-bottom:16px;page-break-after:always;border-radius:8px}
        .label:last-child{page-break-after:auto}
        h2{margin:0 0 8px}
        .row{margin:4px 0;font-size:14px}
        .id{font-family:monospace;font-size:12px;color:#666}
      </style></head><body>
      ${rows
        .map((o) => {
          const its = items[o.id] ?? [];
          return `<div class="label">
            <h2>${o.customer_name}</h2>
            <div class="id">#${o.id.slice(0, 8).toUpperCase()}</div>
            <div class="row"><strong>Phone:</strong> ${o.shipping_address}</div>
            <div class="row"><strong>Wilaya:</strong> ${o.shipping_postal_code}</div>
            <div class="row"><strong>City:</strong> ${o.shipping_city}</div>
            <div class="row"><strong>Items:</strong> ${its.map((i) => `${i.product_name} ×${i.quantity}`).join(", ")}</div>
            <div class="row"><strong>Total:</strong> ${Number(o.total).toFixed(2)} DA</div>
          </div>`;
        })
        .join("")}
      </body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 250);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Manage incoming orders and update their delivery status."
        icon={ShoppingBag}
        gradient="from-emerald-500 via-teal-500 to-cyan-500"
      />

      {orders === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="Once customers buy, their orders show up here."
        />
      ) : (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border/60 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, phone, wilaya, city, or order ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {filtered.length} of {orders.length}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(!!v)} />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Wilaya / City</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Shipment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => {
                    const status = STATUS_VARIANT[o.status] ?? {
                      label: o.status,
                      className: "bg-muted text-foreground border-border",
                    };
                    const orderItems = items[o.id] ?? [];
                    const firstItem = orderItems[0];
                    const extraCount = orderItems.length - 1;
                    return (
                      <TableRow key={o.id} data-state={selectedIds.has(o.id) ? "selected" : undefined}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(o.id)}
                            onCheckedChange={() => toggle(o.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{o.customer_name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            #{o.id.slice(0, 8).toUpperCase()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <a
                            href={`tel:${o.shipping_address}`}
                            className="inline-flex items-center gap-1.5 text-sm hover:text-primary"
                          >
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {o.shipping_address}
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-start gap-1.5 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                            <div>
                              <div className="font-medium">{o.shipping_postal_code || "—"}</div>
                              <div className="text-xs text-muted-foreground">{o.shipping_city}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {firstItem ? (
                            <div className="flex items-center gap-2.5">
                              {firstItem.image_url ? (
                                <img
                                  src={firstItem.image_url}
                                  alt={firstItem.product_name}
                                  className="h-10 w-10 rounded-md object-cover border border-border/60 shrink-0"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center shrink-0">
                                  <ShoppingBag className="h-4 w-4 text-accent-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium line-clamp-1">{firstItem.product_name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Qty {firstItem.quantity}
                                  {extraCount > 0 && ` + ${extraCount} more`}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as Status)}>
                            <SelectTrigger className="h-8 w-[130px] border-0 p-0 focus:ring-0 shadow-none bg-transparent [&>svg]:opacity-50">
                              <Badge variant="outline" className={`${status.className} font-medium`}>
                                {status.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent align="end">
                              {STATUS_FLOW.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {STATUS_VARIANT[s].label}
                                </SelectItem>
                              ))}
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(o.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right font-semibold whitespace-nowrap">
                          {Number(o.total).toFixed(2)} DA
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          {shipments[o.id] ? (
                            <div className="inline-flex flex-col items-end gap-0.5">
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {shipments[o.id].status}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {shipments[o.id].tracking_number}
                              </span>
                            </div>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => setShipOrder(o)} className="h-8">
                              <Truck className="h-3.5 w-3.5" />
                              Create Shipment
                            </Button>
                          )}
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

      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-border shadow-xl rounded-full px-4 py-2 flex items-center gap-2">
          <span className="text-sm font-medium px-2">{selectedIds.size} selected</span>
          <Select onValueChange={(v) => bulkUpdateStatus(v as Status)}>
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Update status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FLOW.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_VARIANT[s].label}
                </SelectItem>
              ))}
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button size="sm" variant="outline" onClick={printLabels}>
            <Printer className="h-4 w-4 mr-1" /> Labels
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <CreateShipmentDialog
        order={shipOrder}
        open={!!shipOrder}
        onOpenChange={(v) => !v && setShipOrder(null)}
        onCreated={loadOrders}
      />
    </div>
  );
}
