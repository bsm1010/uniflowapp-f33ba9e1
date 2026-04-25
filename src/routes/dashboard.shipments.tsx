import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Truck, Search, Copy, CheckCircle2 } from "lucide-react";
import deliveryMan from "@/assets/delivery-man.png";
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

type Shipment = Tables<"shipments">;
type Order = Tables<"orders">;
type Company = { id: string; name: string };

export const Route = createFileRoute("/dashboard/shipments")({
  component: ShipmentsPage,
  head: () => ({ meta: [{ title: "Shipments — Tracking" }] }),
});

const STATUS_FLOW = ["pending", "in_transit", "delivered"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_VARIANT: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  in_transit: {
    label: "In transit",
    className:
      "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
};

function ShipmentsPage() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[] | null>(null);
  const [orders, setOrders] = useState<Record<string, Order>>({});
  const [companies, setCompanies] = useState<Record<string, Company>>({});
  const [query, setQuery] = useState("");

  const load = async () => {
    if (!user) return;
    const { data: ships } = await supabase
      .from("shipments")
      .select("*")
      .eq("store_id", user.id)
      .order("created_at", { ascending: false });
    const list = ships ?? [];
    setShipments(list);
    if (list.length) {
      const orderIds = Array.from(new Set(list.map((s) => s.order_id)));
      const companyIds = Array.from(
        new Set(list.map((s) => s.company_id).filter(Boolean) as string[]),
      );
      const [{ data: ords }, { data: comps }] = await Promise.all([
        supabase.from("orders").select("*").in("id", orderIds),
        companyIds.length
          ? supabase
              .from("delivery_companies")
              .select("id, name")
              .in("id", companyIds)
          : Promise.resolve({ data: [] as Company[] }),
      ]);
      const oMap: Record<string, Order> = {};
      for (const o of ords ?? []) oMap[o.id] = o;
      setOrders(oMap);
      const cMap: Record<string, Company> = {};
      for (const c of (comps as Company[]) ?? []) cMap[c.id] = c;
      setCompanies(cMap);
    } else {
      setOrders({});
      setCompanies({});
    }
  };

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`shipments-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
          filter: `store_id=eq.${user.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const updateStatus = async (id: string, status: Status) => {
    const prev = shipments;
    setShipments((cur) =>
      cur ? cur.map((s) => (s.id === id ? { ...s, status } : s)) : cur,
    );
    const { error } = await supabase
      .from("shipments")
      .update({ status })
      .eq("id", id);
    if (error) {
      setShipments(prev);
      toast.error("Failed to update status");
    } else {
      toast.success(`Marked as ${STATUS_VARIANT[status]?.label ?? status}`);
    }
  };

  const filtered = useMemo(
    () =>
      (shipments ?? []).filter((s) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        const o = orders[s.order_id];
        return (
          s.tracking_number.toLowerCase().includes(q) ||
          o?.customer_name.toLowerCase().includes(q) ||
          o?.shipping_address.toLowerCase().includes(q) ||
          s.id.toLowerCase().startsWith(q)
        );
      }),
    [shipments, orders, query],
  );

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Logistics"
        title="Shipments & Tracking"
        description="Follow every shipment from pickup to delivery."
        icon={Truck}
        gradient="from-sky-500 via-indigo-500 to-violet-500"
      />

      {/* Hero showcase */}
      <section className="relative my-6 overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white shadow-lg">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative grid items-center gap-6 p-6 sm:p-8 md:grid-cols-2 md:gap-4">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              📦 Real-time Shipment Tracking
            </span>
            <h2 className="text-2xl font-bold leading-tight sm:text-3xl md:text-4xl">
              تابع طلباتك من الانطلاق حتى وصولها للزبون 🚀
            </h2>
            <p className="text-sm leading-relaxed text-white/80 sm:text-base">
              Track every package in real-time, update statuses on the fly, and keep your customers informed at every step of the delivery journey.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">Live Updates</span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">Tracking Numbers</span>
              <span className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur">Status Workflow</span>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full" />
            <img
              src={deliveryMan}
              alt="Delivery man carrying Fennecly packages"
              className="relative w-full max-w-sm drop-shadow-2xl animate-[float_6s_ease-in-out_infinite]"
            />
          </div>
        </div>
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </section>

        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : shipments.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No shipments yet"
          description="Create a shipment from the Orders page once an order is placed."
        />
      ) : (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border/60 flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by tracking, customer or phone"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {filtered.length} of {shipments.length}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Wilaya</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => {
                    const o = orders[s.order_id];
                    const status = STATUS_VARIANT[s.status] ?? {
                      label: s.status,
                      className: "bg-muted text-foreground border-border",
                    };
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(s.tracking_number);
                              toast.success("Tracking copied");
                            }}
                            className="inline-flex items-center gap-1.5 font-mono text-xs hover:text-primary"
                          >
                            <Copy className="h-3 w-3 opacity-60" />
                            {s.tracking_number || "—"}
                          </button>
                        </TableCell>
                        <TableCell>
                          {o ? (
                            <>
                              <div className="font-medium text-sm">
                                {o.customer_name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {o.shipping_address}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {s.company_id ? companies[s.company_id]?.name ?? "—" : "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {o?.shipping_postal_code || "—"}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={STATUS_FLOW.includes(s.status as Status) ? s.status : "pending"}
                            onValueChange={(v) =>
                              updateStatus(s.id, v as Status)
                            }
                          >
                            <SelectTrigger className="h-8 w-[140px] border-0 p-0 focus:ring-0 shadow-none bg-transparent [&>svg]:opacity-50">
                              <Badge
                                variant="outline"
                                className={`${status.className} font-medium gap-1`}
                              >
                                {s.status === "delivered" && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {status.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent align="end">
                              {STATUS_FLOW.map((st) => (
                                <SelectItem key={st} value={st}>
                                  {STATUS_VARIANT[st].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
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
    </div>
  );
}
