import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice as fmtPrice } from "@/lib/storeTheme";
import { AlgeriaOrdersMap } from "@/components/dashboard/AlgeriaOrdersMap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — Fennecly" }] }),
});

type Stats = {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  avgOrderValue: number;
  deliveryRate: string;
  pendingOrders: number;
  deliveredOrders: number;
  revenue7d: number;
  orders7d: number;
};

type ChartPoint = { date: string; revenue: number; orders: number };

function aggregateDailyRevenue(
  orders: { created_at: string; total: number; status: string }[],
  days: number,
): ChartPoint[] {
  const result: Record<string, { revenue: number; orders: number }> = {};

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    result[key] = { revenue: 0, orders: 0 };
  }

  for (const order of orders) {
    const key = order.created_at.slice(0, 10);
    if (result[key]) {
      result[key].revenue += Number(order.total) || 0;
      result[key].orders += 1;
    }
  }

  return Object.entries(result).map(([date, v]) => ({
    date,
    revenue: Math.round(v.revenue),
    orders: v.orders,
  }));
}

function AnalyticsPage() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const currency = currentStore?.currency ?? "DZD";
  const formatPrice = (n: number) => fmtPrice(n, currency);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartDays, setChartDays] = useState<30 | 90>(30);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setLoadError(null);
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString();

      const [ordersRes, productsRes, recentRes, timeSeriesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total, status, customer_email, customer_phone, customer_name, created_at")
          .eq("store_owner_id", user.id),
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
        supabase
          .from("orders")
          .select("id, total, status")
          .eq("store_owner_id", user.id)
          .gte("created_at", sevenDaysAgo),
        supabase
          .from("orders")
          .select("created_at, total, status")
          .eq("store_owner_id", user.id)
          .gte("created_at", ninetyDaysAgo)
          .order("created_at", { ascending: true }),
      ]);

      if (ordersRes.error || productsRes.error || recentRes.error || timeSeriesRes.error) {
        setLoadError("Failed to load analytics data");
        setLoading(false);
        return;
      }

      const orders = ordersRes.data ?? [];
      const recent = recentRes.data ?? [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const deliveredOrders = orders.filter((o) => o.status?.toLowerCase() === "delivered").length;
      const pendingOrders = orders.filter((o) => o.status?.toLowerCase() === "pending").length;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      const customerKeys = new Set<string>();
      for (const o of orders) {
        const key = (
          o.customer_email?.trim() ||
          o.customer_phone?.trim() ||
          o.customer_name?.trim() ||
          ""
        ).toLowerCase();
        if (key) customerKeys.add(key);
      }

      const revenue7d = recent.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const orders7d = recent.length;
      const delivered7d = recent.filter((o) => o.status?.toLowerCase() === "delivered").length;

      setStats({
        totalOrders,
        totalRevenue,
        totalProducts: productsRes.count ?? 0,
        totalCustomers: customerKeys.size,
        avgOrderValue,
        deliveryRate: orders7d > 0 ? `${Math.round((delivered7d / orders7d) * 100)}%` : "0%",
        pendingOrders,
        deliveredOrders,
        revenue7d,
        orders7d,
      });

      setChartData(aggregateDailyRevenue(timeSeriesRes.data ?? [], 90));
    } catch {
      setLoadError("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user, load]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto py-24 text-center">
        <p className="text-muted-foreground mb-4">{loadError}</p>
        <button onClick={() => void load()} className="text-sm underline hover:no-underline">
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Orders (total)",
      value: String(stats?.totalOrders ?? 0),
      gradient: "from-violet-500 to-fuchsia-500",
      icon: ShoppingCart,
    },
    {
      label: "Revenue",
      value: formatPrice(stats?.totalRevenue ?? 0),
      gradient: "from-emerald-500 to-teal-500",
      icon: DollarSign,
    },
    {
      label: "Avg. order value",
      value: formatPrice(stats?.avgOrderValue ?? 0),
      gradient: "from-amber-500 to-orange-500",
      icon: TrendingUp,
    },
    {
      label: "Customers",
      value: String(stats?.totalCustomers ?? 0),
      gradient: "from-cyan-500 to-blue-500",
      icon: Users,
    },
    {
      label: "Products",
      value: String(stats?.totalProducts ?? 0),
      gradient: "from-pink-500 to-rose-500",
      icon: Package,
    },
    {
      label: "Delivered",
      value: String(stats?.deliveredOrders ?? 0),
      gradient: "from-green-500 to-emerald-500",
      icon: BarChart3,
    },
    {
      label: "Pending",
      value: String(stats?.pendingOrders ?? 0),
      gradient: "from-amber-500 to-yellow-500",
      icon: BarChart3,
    },
    {
      label: "Revenue (7d)",
      value: formatPrice(stats?.revenue7d ?? 0),
      gradient: "from-sky-500 to-indigo-500",
      icon: TrendingUp,
    },
  ];

  const sliced = chartData.slice(-chartDays);
  const hasRevenue = sliced.some((d) => d.revenue > 0);

  const firstHalf = sliced.slice(0, Math.floor(sliced.length / 2));
  const secondHalf = sliced.slice(Math.floor(sliced.length / 2));
  const firstRevenue = firstHalf.reduce((s, d) => s + d.revenue, 0);
  const secondRevenue = secondHalf.reduce((s, d) => s + d.revenue, 0);
  const growthPct =
    firstRevenue > 0 ? Math.round(((secondRevenue - firstRevenue) / firstRevenue) * 100) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Understand how your store is performing."
        icon={BarChart3}
        gradient="from-emerald-500 via-teal-500 to-cyan-500"
      />

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {statCards.map((k) => (
          <Card
            key={k.label}
            className={`relative overflow-hidden border-0 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${k.gradient}`}
          >
            <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-white/15 blur-2xl pointer-events-none" />
            <CardContent className="relative p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                  {k.label}
                </span>
                <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm text-white flex items-center justify-center">
                  <k.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold font-display tabular-nums text-white">
                {k.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="border-border/60">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-base">Revenue over time</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Daily revenue and order volume
              </p>
            </div>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {([30, 90] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setChartDays(d)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    chartDays === d
                      ? "bg-background shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Total revenue ({chartDays}d)</p>
                {growthPct !== null && (
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      growthPct >= 0
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-rose-500/10 text-rose-600",
                    )}
                  >
                    {growthPct >= 0 ? "+" : ""}
                    {growthPct}%
                  </span>
                )}
              </div>
              <p className="mt-1 text-xl font-bold">
                {formatPrice(sliced.reduce((s, d) => s + d.revenue, 0))}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total orders ({chartDays}d)</p>
              <p className="mt-1 text-xl font-bold">
                {sliced.reduce((s, d) => s + d.orders, 0)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Best day</p>
              <p className="mt-1 text-xl font-bold">
                {formatPrice(Math.max(...sliced.map((d) => d.revenue), 0))}
              </p>
            </div>
          </div>

          {hasRevenue ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={sliced} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(var(--border))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: string) => {
                    const d = new Date(value);
                    return d.toLocaleDateString("fr-DZ", {
                      day: "numeric",
                      month: "short",
                    });
                  }}
                  interval={chartDays === 30 ? 4 : 13}
                />
                <YAxis
                  yAxisId="revenue"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                  width={45}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(value, name) => [
                    name === "revenue" ? formatPrice(Number(value)) : `${value} orders`,
                    name === "revenue" ? "Revenue" : "Orders",
                  ]}
                  labelFormatter={(label) =>
                    new Date(String(label)).toLocaleDateString("fr-DZ", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    })
                  }
                />
                <Legend
                  formatter={(value) => (value === "revenue" ? "Revenue" : "Orders")}
                  wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
                />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#7C3AED" }}
                />
                <Area
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke="#06B6D4"
                  strokeWidth={1.5}
                  fill="url(#ordersGradient)"
                  dot={false}
                  activeDot={{ r: 3, fill: "#06B6D4" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center gap-3 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No revenue data yet</p>
              <p className="text-xs text-muted-foreground/70">
                Revenue will appear here once you receive your first orders
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <AlgeriaOrdersMap />

        <Card className="border-border/60">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm">7-day snapshot</h3>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Orders (7d)</p>
                <p className="mt-1 text-2xl font-bold">{stats?.orders7d ?? 0}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Revenue (7d)</p>
                <p className="mt-1 text-2xl font-bold">{formatPrice(stats?.revenue7d ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Delivery rate (7d)</p>
                <p className="mt-1 text-2xl font-bold">{stats?.deliveryRate ?? "0%"}</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Order/product ratio</p>
                <p className="mt-1 text-2xl font-bold">
                  {stats && stats.totalProducts > 0
                    ? (stats.totalOrders / stats.totalProducts).toFixed(1)
                    : "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
