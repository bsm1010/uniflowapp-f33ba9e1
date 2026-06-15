import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Mail,
  Phone,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Search,
  MapPin,
  CalendarDays,
  ExternalLink,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice as fmtPrice } from "@/lib/storeTheme";

export const Route = createFileRoute("/dashboard/customers")({
  component: CustomersPage,
  head: () => ({ meta: [{ title: "Customers — Fennecly" }] }),
});

type CustomerProfile = {
  email: string;
  name: string;
  phone: string;
  address: string;
  orderCount: number;
  totalSpent: number;
  avgOrderValue: number;
  lastOrderDate: string | null;
  firstOrderDate: string | null;
  wilaya: string;
  city: string;
  orders: Array<{
    id: string;
    total: number;
    status: string;
    created_at: string;
    delivery_type: string;
  }>;
};

function CustomersPage() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const currency = currentStore?.currency ?? "DZD";
  const formatPrice = (n: number) => fmtPrice(n, currency);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<CustomerProfile | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setLoadError(null);
      const { data: orders, error } = await supabase
        .from("orders")
        .select(
          "id, customer_name, customer_email, customer_phone, shipping_address, shipping_city, shipping_wilaya, total, status, delivery_type, created_at",
        )
        .eq("store_owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }
      const map = new Map<string, CustomerProfile>();
      for (const o of orders ?? []) {
        // Group by email > phone > name (more unique than name alone)
        const key = (
          o.customer_email?.trim() ||
          o.customer_phone?.trim() ||
          o.customer_name?.trim() ||
          "unknown"
        ).toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.orderCount++;
          existing.totalSpent += Number(o.total) || 0;
          if (o.created_at && (!existing.lastOrderDate || o.created_at > existing.lastOrderDate)) {
            existing.lastOrderDate = o.created_at;
          }
          // Orders are desc — last encounter is the oldest, so keep updating firstOrderDate
          if (o.created_at) {
            existing.firstOrderDate = o.created_at;
          }
          existing.orders.push({
            id: o.id,
            total: Number(o.total) || 0,
            status: o.status ?? "",
            created_at: o.created_at ?? "",
            delivery_type: o.delivery_type ?? "",
          });
          existing.avgOrderValue = existing.totalSpent / existing.orderCount;
          if (o.shipping_wilaya && !existing.wilaya) existing.wilaya = o.shipping_wilaya;
          if (o.shipping_city && !existing.city) existing.city = o.shipping_city;
          if (o.customer_phone && !existing.phone) existing.phone = o.customer_phone;
          if (o.shipping_address && !existing.address) existing.address = o.shipping_address;
        } else {
          map.set(key, {
            email: o.customer_email ?? "",
            name: o.customer_name ?? "Unknown",
            phone: o.customer_phone ?? "",
            address: o.shipping_address ?? "",
            orderCount: 1,
            totalSpent: Number(o.total) || 0,
            avgOrderValue: Number(o.total) || 0,
            lastOrderDate: o.created_at ?? null,
            firstOrderDate: o.created_at ?? null,
            wilaya: o.shipping_wilaya ?? "",
            city: o.shipping_city ?? "",
            orders: [
              {
                id: o.id,
                total: Number(o.total) || 0,
                status: o.status ?? "",
                created_at: o.created_at ?? "",
                delivery_type: o.delivery_type ?? "",
              },
            ],
          });
        }
      }
      setCustomers(Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent));
    } catch {
      setLoadError("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    if (!needle) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.phone.includes(needle) ||
        c.wilaya.toLowerCase().includes(needle),
    );
  }, [customers, q]);

  const totalCustomers = customers.length;
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const avgOrderValue =
    totalCustomers > 0
      ? Math.round(totalRevenue / customers.reduce((s, c) => s + c.orderCount, 0))
      : 0;
  const repeatRate =
    totalCustomers > 0
      ? Math.round((customers.filter((c) => c.orderCount > 1).length / totalCustomers) * 100)
      : 0;

  const statusColor = (s: string) => {
    const st = s?.toLowerCase() ?? "";
    if (st === "delivered" || st === "confirmed") return "bg-emerald-500/15 text-emerald-600";
    if (st === "shipped") return "bg-sky-500/15 text-sky-600";
    if (st === "pending") return "bg-amber-500/15 text-amber-600";
    if (st === "cancelled") return "bg-destructive/15 text-destructive";
    return "bg-muted/40 text-muted-foreground";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Audience"
        title="Customers"
        description="View your customers, their order history, and spending."
        icon={Users}
        gradient="from-cyan-500 via-sky-500 to-blue-500"
      />

      {loadError && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{loadError}</span>
          <button onClick={() => void load()} className="ml-auto underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" /> Total customers
            </div>
            <p className="mt-1 text-2xl font-bold">{loading ? "…" : totalCustomers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" /> Total revenue
            </div>
            <p className="mt-1 text-2xl font-bold">{loading ? "…" : formatPrice(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShoppingCart className="h-4 w-4" /> Avg. order value
            </div>
            <p className="mt-1 text-2xl font-bold">{loading ? "…" : formatPrice(avgOrderValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Repeat rate
            </div>
            <p className="mt-1 text-2xl font-bold">{loading ? "…" : `${repeatRate}%`}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Customer list */}
        <Card className="lg:col-span-2">
          <CardHeader className="px-5 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, phone, or wilaya…"
                className="h-9 w-full pl-9"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Users}
                title={q ? "No matches" : "No customers yet"}
                description={
                  q
                    ? "Try a different search term."
                    : "Customers appear here after their first order."
                }
              />
            ) : (
              <ul className="divide-y">
                {filtered.map((c) => (
                  <li
                    key={c.email || c.name}
                    onClick={() => setSelected(selected?.email === c.email ? null : c)}
                    className={`flex cursor-pointer items-center gap-4 px-5 py-3 transition-colors hover:bg-muted/30 ${
                      selected?.email === c.email ? "bg-muted/40" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.email || c.phone || "No contact"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatPrice(c.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.orderCount} order{c.orderCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Customer detail */}
        <Card>
          <CardHeader className="border-b px-5 py-3">
            <span className="font-medium text-sm">
              {selected ? "Customer details" : "Select a customer"}
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {!selected ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                <Users className="h-8 w-8 opacity-40" />
                <p>Click a customer to view details</p>
              </div>
            ) : (
              <div className="divide-y">
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {selected.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{selected.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selected.orderCount} order{selected.orderCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {selected.email && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />{" "}
                        <span className="truncate">{selected.email}</span>
                      </div>
                    )}
                    {selected.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <a href={`tel:${selected.phone}`} className="hover:text-primary truncate">
                          {selected.phone}
                        </a>
                      </div>
                    )}
                    {(selected.wilaya || selected.city) && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {selected.city}
                          {selected.city && selected.wilaya ? ", " : ""}
                          {selected.wilaya}
                        </span>
                      </div>
                    )}
                    {selected.address && (
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="text-xs leading-relaxed">{selected.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-[11px] text-muted-foreground">Total spent</p>
                      <p className="mt-0.5 font-bold">{formatPrice(selected.totalSpent)}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-[11px] text-muted-foreground">Orders</p>
                      <p className="mt-0.5 font-bold">{selected.orderCount}</p>
                    </div>
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-[11px] text-muted-foreground">Avg. order</p>
                      <p className="mt-0.5 font-bold">{formatPrice(selected.avgOrderValue)}</p>
                    </div>
                  </div>
                  {selected.firstOrderDate && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      First order: {new Date(selected.firstOrderDate).toLocaleDateString()}
                      {selected.lastOrderDate &&
                        selected.lastOrderDate !== selected.firstOrderDate && (
                          <> · Last: {new Date(selected.lastOrderDate).toLocaleDateString()}</>
                        )}
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order history
                  </p>
                  <div className="space-y-2 max-h-72 overflow-auto">
                    {selected.orders.map((o) => (
                      <Link
                        key={o.id}
                        to="/dashboard/orders/$orderId/tracking"
                        params={{ orderId: o.id }}
                        className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-xs font-mono text-muted-foreground">
                              {o.id.slice(0, 8)}…
                            </p>
                            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="font-medium">{formatPrice(o.total)}</p>
                          <div className="flex items-center gap-1 justify-end">
                            <Badge className={`text-[10px] ${statusColor(o.status)}`}>
                              {o.status || "pending"}
                            </Badge>
                            {o.delivery_type && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-muted-foreground"
                              >
                                {o.delivery_type === "stopdesk" ? "Stop Desk" : "Home"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
