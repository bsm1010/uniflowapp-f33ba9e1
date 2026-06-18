import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Send,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateShipmentDialog } from "@/components/dashboard/CreateShipmentDialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendOrderStatusSms } from "@/lib/orders/sms.functions";
import { pushOrderToProvider } from "@/lib/delivery/push-order.functions";
import { importZRExpressOrders } from "@/lib/delivery/import-zr-orders.functions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Img } from "@/components/ui/Img";
import { WhatsAppCallButton } from "@/components/dashboard/WhatsAppCallButton";
import { useCallLog } from "@/hooks/use-call-log";
import { useBordereaux, type BordereauOrder } from "@/hooks/use-bordereaux";
import { useDebounce } from "@/hooks/use-debounce";
import { formatDistanceToNow } from "date-fns";

import type { Tables } from "@/integrations/supabase/types";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

type Order = Tables<"orders"> & { zr_colis_id?: string | null };
type OrderItem = Tables<"order_items">;
type Shipment = Tables<"shipments">;

export const Route = createFileRoute("/dashboard/orders")({
  component: OrdersPage,
  head: () => ({ meta: [{ title: "Orders — Fennecly" }] }),
});

const STATUS_FLOW = ["pending", "confirmed", "shipped", "delivered"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_VARIANT: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  shipped: {
    label: "Shipped",
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/30",
  },
  delivered: {
    label: "Delivered",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
  },
};

function OrdersPage() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const pushFn = useServerFn(pushOrderToProvider);
  const importZRFn = useServerFn(importZRExpressOrders);
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [items, setItems] = useState<Record<string, OrderItem[]>>({});
  const [shipments, setShipments] = useState<Record<string, Shipment>>({});
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query);
  const [shipOrder, setShipOrder] = useState<Order | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pushingId, setPushingId] = useState<string | null>(null);
  const [importingZR, setImportingZR] = useState(false);
  const [callLogs, setCallLogs] = useState<
    Record<string, { outcome: string; called_at: string; channel: string }>
  >({});
  const { printBordereaux, loading: printingBordereaux } = useBordereaux();

  const importFromZRExpress = async () => {
    if (!user) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      toast.error("Please sign in again.");
      return;
    }
    const { data: companies } = await supabase
      .from("delivery_companies")
      .select("id, name")
      .eq("is_active", true);
    const zr = (companies ?? []).find((c) => /zr\s*[-_]?\s*express|zrexpress/i.test(c.name));
    if (!zr) {
      toast.error("ZRExpress is not available.");
      return;
    }
    setImportingZR(true);
    try {
      const res = await importZRFn({ data: { accessToken, companyId: zr.id } });
      if (res.ok) {
        toast.success(res.message);
        loadOrders();
      } else toast.error(res.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImportingZR(false);
    }
  };

  const sendToProvider = async (orderId: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      toast.error("Please sign in again.");
      return;
    }
    setPushingId(orderId);
    try {
      const res = await pushFn({ data: { accessToken, orderId } });
      if (res.ok) {
        toast.success(res.message);
        loadOrders();
      } else {
        toast.error(res.message);
        loadOrders();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send to delivery provider.");
    } finally {
      setPushingId(null);
    }
  };

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      let q = supabase
        .from("orders")
        .select("*")
        .eq("store_owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (currentStore?.id) q = q.eq("store_id", currentStore.id);
      const { data: ords } = await q;
      const list = ords ?? [];
      setOrders(list);
      if (list.length) {
        const ids = list.map((o) => o.id);
        const [{ data: its }, { data: ships }, { data: calls }] = await Promise.all([
          supabase.from("order_items").select("*").in("order_id", ids),
          supabase.from("shipments").select("*").in("order_id", ids),
          (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> })
            .from("call_logs")
            .select("order_id, outcome, called_at, channel")
            .in("order_id", ids)
            .order("called_at", { ascending: false }),
        ]);
        const grouped: Record<string, OrderItem[]> = {};
        for (const it of its ?? []) (grouped[it.order_id] ??= []).push(it);
        setItems(grouped);
        const shipMap: Record<string, Shipment> = {};
        for (const s of ships ?? []) shipMap[s.order_id] = s;
        setShipments(shipMap);
        const callMap: Record<string, { outcome: string; called_at: string; channel: string }> = {};
        for (const c of calls ?? []) {
          if (!callMap[c.order_id]) callMap[c.order_id] = c;
        }
        setCallLogs(callMap);
      } else {
        setItems({});
        setShipments({});
      }
    } catch {
      toast.error("Failed to load orders");
    }
  }, [user, currentStore?.id]);

  useEffect(() => {
    if (!user) return;
    loadOrders();
    const channel = supabase
      .channel(`orders-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `store_owner_id=eq.${user.id}` },
        (payload) => {
          // Optimistically add new order to the top
          const newOrder = payload.new as Order;
          setOrders((cur) => cur ? [newOrder, ...cur].slice(0, 200) : cur);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `store_owner_id=eq.${user.id}` },
        (payload) => {
          const updated = payload.new as Order;
          setOrders((cur) => cur ? cur.map((o) => o.id === updated.id ? updated : o) : cur);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "orders", filter: `store_owner_id=eq.${user.id}` },
        (payload) => {
          const deleted = payload.old as { id: string };
          setOrders((cur) => cur ? cur.filter((o) => o.id !== deleted.id) : cur);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentStore?.id]);

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
        const q = debouncedQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          o.customer_name.toLowerCase().includes(q) ||
          o.shipping_address.toLowerCase().includes(q) ||
          o.shipping_city.toLowerCase().includes(q) ||
          o.shipping_postal_code.toLowerCase().includes(q) ||
          o.id.toLowerCase().startsWith(q)
        );
      }),
    [orders, debouncedQuery],
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
    const rows = selectedIds.size > 0 ? filtered.filter((o) => selectedIds.has(o.id)) : filtered;
    if (!rows.length) return;
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
    const rows = selectedIds.size > 0 ? filtered.filter((o) => selectedIds.has(o.id)) : filtered;
    if (!rows.length) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
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
          <h2>${esc(o.customer_name)}</h2>
          <div class="id">#${esc(o.id.slice(0, 8).toUpperCase())}</div>
          <div class="row"><strong>Phone:</strong> ${esc(o.shipping_address)}</div>
          <div class="row"><strong>Wilaya:</strong> ${esc(o.shipping_postal_code)}</div>
          <div class="row"><strong>City:</strong> ${esc(o.shipping_city)}</div>
          <div class="row"><strong>Items:</strong> ${its.map((i) => `${esc(i.product_name)} ×${esc(i.quantity)}`).join(", ")}</div>
          <div class="row"><strong>Total:</strong> ${esc(Number(o.total).toFixed(2))} DA</div>
        </div>`;
        })
        .join("")}
      </body></html>`;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 250);
  };

  const handlePrintBordereaux = () => {
    const rows = selectedIds.size > 0 ? filtered.filter((o) => selectedIds.has(o.id)) : filtered;
    const bordereauOrders: BordereauOrder[] = rows
      .filter((o) => o.tracking_number || o.zr_colis_id)
      .map((o) => ({
        id: o.id,
        zr_colis_id: o.zr_colis_id,
        tracking_number: o.tracking_number,
        customer_name: o.customer_name,
      }));
    printBordereaux(bordereauOrders);
  };

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Sales"
          title="Orders"
          description="Manage incoming orders and update their delivery status."
          icon={ShoppingBag}
          gradient="from-emerald-500 via-teal-500 to-cyan-500"
        />
        <div className="pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={importFromZRExpress}
            disabled={importingZR}
            className="gap-1.5"
          >
            {importingZR ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {orders && orders.some((o) => o.source === "zrexpress")
              ? "Sync ZRExpress orders"
              : "Import ZRExpress orders"}
          </Button>
        </div>
      </div>

      {orders === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders yet"
          description="When a customer places an order, it will appear here. Share your store link to start selling."
          action={
            <Button onClick={() => navigate({ to: "/dashboard/store" })}>View your store</Button>
          }
        />
      ) : (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-0">
            {/* ── Toolbar ── */}
            <div className="p-4 border-b border-border/60 flex flex-wrap items-center gap-3">
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
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportCsv}
                  disabled={filtered.length === 0}
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  {selectedIds.size > 0 ? `Export ${selectedIds.size} selected` : "Export CSV"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={printLabels}
                  disabled={filtered.length === 0}
                >
                  <Printer className="h-4 w-4 mr-1.5" />
                  {selectedIds.size > 0 ? `Print ${selectedIds.size} labels` : "Print Labels"}
                </Button>
                {orders.some((o) => o.tracking_number || o.zr_colis_id) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePrintBordereaux}
                    disabled={printingBordereaux}
                  >
                    {printingBordereaux ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4 mr-1.5" />
                    )}
                    {selectedIds.size > 0 ? `Print ${selectedIds.size} bordereaux` : "Print bordereaux"}
                  </Button>
                )}
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
                      <TableRow
                        key={o.id}
                        data-state={selectedIds.has(o.id) ? "selected" : undefined}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(o.id)}
                            onCheckedChange={() => toggle(o.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link
                              to="/dashboard/orders/$orderId/tracking"
                              params={{ orderId: o.id }}
                              className="font-medium hover:text-primary hover:underline"
                            >
                              {o.customer_name}
                            </Link>
                            {o.source === "zrexpress" && (
                              <Badge
                                variant="outline"
                                className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0"
                              >
                                ZRExpress
                              </Badge>
                            )}
                            {o.zr_colis_id && (
                              <Badge
                                variant="outline"
                                className="bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30 text-[10px] px-1.5 py-0"
                              >
                                Label
                              </Badge>
                            )}
                          </div>
                          <Link
                            to="/dashboard/orders/$orderId/tracking"
                            params={{ orderId: o.id }}
                            className="text-[11px] font-mono text-muted-foreground hover:text-primary"
                          >
                            #{o.id.slice(0, 8).toUpperCase()}
                          </Link>
                          {callLogs[o.id] && callLogs[o.id].outcome !== "pending" && (
                            <div
                              className={cn(
                                "text-[11px] mt-0.5",
                                callLogs[o.id].outcome === "answered" && "text-emerald-600 dark:text-emerald-400",
                                callLogs[o.id].outcome === "no_answer" && "text-rose-600 dark:text-rose-400",
                                callLogs[o.id].outcome === "callback" && "text-amber-600 dark:text-amber-400",
                              )}
                            >
                              Called {formatDistanceToNow(new Date(callLogs[o.id].called_at), { addSuffix: true })}
                              {" · "}
                              {callLogs[o.id].outcome === "answered" && "Answered"}
                              {callLogs[o.id].outcome === "no_answer" && "No answer"}
                              {callLogs[o.id].outcome === "callback" && "Call back later"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${o.customer_phone || o.shipping_address}`}
                              className="inline-flex items-center gap-1.5 text-sm hover:text-primary md:hidden"
                            >
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {o.customer_phone || o.shipping_address}
                            </a>
                            <span className="hidden md:inline-flex items-center gap-1.5 text-sm">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {o.customer_phone || o.shipping_address}
                            </span>
                            <span className="hidden md:inline-flex">
                              <WhatsAppCallButton
                                customerPhone={o.customer_phone || o.shipping_address}
                                customerName={o.customer_name}
                                orderId={o.id}
                                orderNumber={`#${o.id.slice(0, 8).toUpperCase()}`}
                                size="sm"
                              />
                            </span>
                          </div>
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
                                <Img
                                  src={firstItem.image_url}
                                  alt={firstItem.product_name}
                                  width={80}
                                  quality={75}
                                  className="h-10 w-10 rounded-md shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-md bg-accent flex items-center justify-center shrink-0">
                                  <ShoppingBag className="h-4 w-4 text-accent-foreground" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="text-sm font-medium line-clamp-1">
                                  {firstItem.product_name}
                                </div>
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
                          <Select
                            value={o.status}
                            onValueChange={(v) => updateStatus(o.id, v as Status)}
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
                          {(() => {
                            const ship = shipments[o.id];
                            const hasTracking =
                              ship && ship.tracking_number && ship.tracking_number.trim() !== "";
                            const hasError = ship && ship.last_error;
                            if (hasTracking) {
                              return (
                                <div className="inline-flex flex-col items-end gap-0.5">
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {ship.status}
                                  </span>
                                  <span className="text-[11px] font-mono text-muted-foreground">
                                    {ship.tracking_number}
                                  </span>
                                </div>
                              );
                            }
                            return (
                              <div className="inline-flex flex-col items-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => sendToProvider(o.id)}
                                  disabled={pushingId === o.id}
                                  className="h-8"
                                >
                                  {pushingId === o.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <Send className="h-3.5 w-3.5" />
                                  )}
                                  Send to ZRExpress
                                </Button>
                                {hasError && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 max-w-[180px] truncate">
                                          <AlertCircle className="h-3 w-3 shrink-0" />
                                          <span className="truncate">{ship.last_error}</span>
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-sm">
                                        {ship.last_error}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            );
                          })()}
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
            <SelectTrigger className="h-8 w-[130px] sm:w-[150px]">
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
