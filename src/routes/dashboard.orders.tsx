import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, ShoppingBag, Phone, MapPin, Truck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateShipmentDialog } from "@/components/dashboard/CreateShipmentDialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
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
  head: () => ({ meta: [{ title: "Orders — Storely" }] }),
});

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_VARIANT: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  shipped: {
    label: "Shipped",
    className:
      "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    className:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
};

function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});
  const [shipments, setShipments] = useState<Record<string, Shipment>>({});
  const [query, setQuery] = useState("");
  const [shipOrder, setShipOrder] = useState<Order | null>(null);

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
      for (const it of its ?? []) {
        (grouped[it.order_id] ??= []).push(it);
      }
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
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `store_owner_id=eq.${user.id}`,
        },
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
    setOrders((cur) =>
      cur ? cur.map((o) => (o.id === orderId ? { ...o, status } : o)) : cur,
    );
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);
    if (error) {
      setOrders(prev);
      toast.error("Failed to update status");
    } else {
      toast.success(`Order marked as ${STATUS_VARIANT[status].label}`);
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

  return (
    <div className="max-w-7xl mx-auto">
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
          action={
            <a
              href="/customize"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Customize your store →
            </a>
          }
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
                      <TableRow key={o.id}>
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
                              <div className="font-medium">
                                {o.shipping_postal_code || "—"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {o.shipping_city}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {firstItem ? (
                            <div>
                              <div className="text-sm font-medium line-clamp-1">
                                {firstItem.product_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Qty {firstItem.quantity}
                                {extraCount > 0 && ` + ${extraCount} more`}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={o.status}
                            onValueChange={(v) =>
                              updateStatus(o.id, v as Status)
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px] border-0 p-0 focus:ring-0 shadow-none bg-transparent [&>svg]:opacity-50">
                              <Badge
                                variant="outline"
                                className={`${status.className} font-medium`}
                              >
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
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShipOrder(o)}
                              className="h-8"
                            >
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

      <CreateShipmentDialog
        order={shipOrder}
        open={!!shipOrder}
        onOpenChange={(v) => !v && setShipOrder(null)}
        onCreated={loadOrders}
      />
    </div>
  );
}
