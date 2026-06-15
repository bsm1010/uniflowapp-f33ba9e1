import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  CircleDot,
  Copy,
  ExternalLink,
  Globe,
  Loader2,
  Package,
  Palette,
  Store,
  ShoppingBag,
  DollarSign,
  Users,
  QrCode,
  Activity,
  AlertTriangle,
  Trash2,
  EyeOff,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ExpiredOverlay } from "@/components/dashboard/ExpiredOverlay";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type StoreSettings = Tables<"store_settings">;

interface RecentOrder {
  id: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export const Route = createFileRoute("/dashboard/store")({
  component: StorePage,
  head: () => ({ meta: [{ title: "My Store — Fennecly" }] }),
});

function StorePage() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [showQr, setShowQr] = useState(false);
  const [storeVisible, setStoreVisible] = useState(true);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStore = useCallback(() => {
    if (!user) return;
    let active = true;

    setError(null);

    Promise.all([
      supabase.from("store_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_owner_id", user.id),
      supabase
        .from("orders")
        .select("total,customer_email")
        .eq("store_owner_id", user.id)
        .limit(5000),
      supabase
        .from("orders")
        .select("id,customer_name,total,status,created_at")
        .eq("store_owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])
      .then(([s, p, o, agg, recent]) => {
        if (!active) return;
        if (s.error || p.error || o.error || agg.error || recent.error) {
          console.error({
            s: s.error,
            p: p.error,
            o: o.error,
            agg: agg.error,
            recent: recent.error,
          });
          setError("Failed to load store data. Please try again.");
          setLoading(false);
          return;
        }
        setSettings(s.data);
        setStoreVisible(s.data?.is_active !== false);
        setProductCount(p.count ?? 0);
        setOrderCount(o.count ?? 0);

        const aggData = agg.data ?? [];
        setRevenue(aggData.reduce((n, r) => n + Number(r.total ?? 0), 0));
        setCustomerCount(
          new Set(aggData.map((r) => (r.customer_email ?? "").toLowerCase()).filter(Boolean)).size,
        );
        setRecentOrders(recent.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Store page load failed:", err);
        setError("Something went wrong loading your store.");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    return loadStore();
  }, [loadStore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button
          onClick={() => {
            setLoading(true);
            loadStore();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const slug = settings?.slug;
  const liveUrl = slug ? `/s/${slug}` : "";
  const themePicked =
    settings != null &&
    (settings.store_name !== "My Store" ||
      settings.theme !== "default" ||
      settings.hero_image_url != null);

  const checklist = [
    {
      title: "Add your first product",
      done: productCount > 0,
      to: "/dashboard/products",
      external: false,
      icon: Package,
    },
    {
      title: "Customize your storefront",
      done: themePicked,
      to: "/customize",
      external: true,
      icon: Palette,
    },
    { title: "Share your store URL", done: !!slug, to: "/customize", external: true, icon: Globe },
  ];

  const completedCount = checklist.filter((c) => c.done).length;
  const healthScore = Math.round((completedCount / checklist.length) * 100);

  const copyUrl = async () => {
    if (!liveUrl) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${liveUrl}`);
      toast.success("Store URL copied");
    } catch {
      toast.error("Failed to copy URL");
    }
  };

  const toggleVisibility = async () => {
    if (!user || !settings) return;
    setTogglingVisibility(true);
    const newVal = !storeVisible;
    try {
      const { error: updateErr } = await supabase
        .from("store_settings")
        .update({ is_active: newVal })
        .eq("user_id", user.id);
      if (updateErr) throw updateErr;
      setStoreVisible(newVal);
      toast.success(newVal ? "Store is now visible" : "Store is now hidden");
    } catch {
      toast.error("Failed to update store visibility");
    } finally {
      setTogglingVisibility(false);
    }
  };

  const QR_URL = slug
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(liveUrl)}&bgcolor=09090f&color=ffffff&format=png&margin=6`
    : "";

  const stats = [
    {
      label: "Products",
      value: productCount,
      icon: Package,
      color: "from-violet-500/15 to-violet-500/5",
    },
    {
      label: "Orders",
      value: orderCount,
      icon: ShoppingBag,
      color: "from-fuchsia-500/15 to-fuchsia-500/5",
    },
    {
      label: "Revenue",
      value: `${revenue.toLocaleString()} ${settings?.currency ?? "DZD"}`,
      icon: DollarSign,
      color: "from-emerald-500/15 to-emerald-500/5",
    },
    {
      label: "Customers",
      value: customerCount,
      icon: Users,
      color: "from-sky-500/15 to-sky-500/5",
    },
  ];

  const statusColor = (s: string) => {
    if (s === "paid" || s === "delivered" || s === "completed") return "text-emerald-500";
    if (s === "pending") return "text-amber-400";
    return "text-muted-foreground";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {isExpired && <ExpiredOverlay />}

      <PageHeader
        eyebrow="Storefront"
        title="My Store"
        description="Your storefront at a glance."
        icon={Store}
        gradient="from-sky-500 via-blue-500 to-indigo-500"
        actions={
          slug ? (
            <Button variant="outline" asChild>
              <a href={`/s/${slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> View live store
              </a>
            </Button>
          ) : null
        }
      />

      {/* ── Store identity card ── */}
      <Card className="border-border/60 shadow-soft overflow-hidden">
        <div
          className="h-32 relative"
          style={{
            background: settings?.primary_color
              ? `linear-gradient(135deg, ${settings.primary_color}, ${settings.primary_color}88)`
              : undefined,
          }}
        >
          <div className="absolute inset-0 bg-soft-radial opacity-60" />
        </div>
        <CardContent className="p-6 -mt-10 relative">
          <div className="h-20 w-20 rounded-2xl bg-background border-4 border-background shadow-soft flex items-center justify-center overflow-hidden">
            {settings?.logo_url ? (
              <img src={settings.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-12 w-12 rounded-xl"
                style={{ backgroundColor: settings?.primary_color }}
              />
            )}
          </div>
          <div className="mt-4 flex items-start justify-between flex-wrap gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold font-display truncate">
                {settings?.store_name ?? "Your Store"}
              </h2>
              {slug ? (
                <button
                  onClick={copyUrl}
                  className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span className="font-mono">/s/{slug}</span>
                  <Copy className="h-3 w-3" />
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">No store URL set yet</p>
              )}
            </div>
            <Badge
              variant="outline"
              className={`gap-1.5 ${storeVisible ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "border-orange-500/40 bg-orange-500/10 text-orange-500"}`}
            >
              <CircleDot
                className={`h-3 w-3 ${storeVisible ? "fill-emerald-500 text-emerald-500" : "fill-orange-500 text-orange-500"}`}
              />
              {storeVisible ? "Active" : "Hidden"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* ── Quick stats ── */}
      <div>
        <h3 className="font-semibold mb-4">Store stats</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="relative overflow-hidden border-border/60 shadow-soft">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.color} pointer-events-none`}
              />
              <CardContent className="relative p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                  <p className="text-2xl font-bold font-display mt-1">{s.value}</p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-background/70 border border-border/60 flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Store health + QR ── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Health score */}
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Store health</h3>
              <span
                className="text-2xl font-bold"
                style={{
                  color:
                    healthScore === 100 ? "#10b981" : healthScore >= 60 ? "#f59e0b" : "#ef4444",
                }}
              >
                {healthScore}%
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-accent overflow-hidden mb-5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${healthScore}%`,
                  background:
                    healthScore === 100 ? "#10b981" : healthScore >= 60 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.title} className="flex items-center gap-3">
                  <div
                    className={`h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? "bg-emerald-500/15 text-emerald-500" : "bg-accent text-muted-foreground"}`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    )}
                  </div>
                  <span
                    className={`text-sm ${item.done ? "line-through text-muted-foreground" : "text-foreground"}`}
                  >
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* QR code */}
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6 flex flex-col items-center justify-center gap-4 text-center h-full">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
              <QrCode className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">Store QR Code</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Let customers scan to visit your store instantly
              </p>
            </div>
            {!showQr ? (
              <Button variant="outline" onClick={() => setShowQr(true)} disabled={!slug}>
                {slug ? "Show QR Code" : "Set a store URL first"}
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-2xl border border-border/60 p-3 bg-[#09090f]">
                  <img
                    src={QR_URL}
                    alt="Store QR code"
                    width={160}
                    height={160}
                    className="rounded-xl block"
                    loading="eager"
                  />
                </div>
                <p className="text-xs text-muted-foreground font-mono">{liveUrl}</p>
                <Button variant="ghost" size="sm" onClick={copyUrl}>
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy URL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Recent activity ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            Recent orders
          </h3>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/orders">View all</Link>
          </Button>
        </div>
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-0">
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-accent-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {recentOrders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{o.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-medium capitalize ${statusColor(o.status)}`}>
                        {o.status}
                      </span>
                      <span className="font-semibold text-sm tabular-nums">
                        ${Number(o.total).toFixed(2)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Setup checklist ── */}
      <div>
        <h3 className="font-semibold mb-4">Setup checklist</h3>
        <div className="grid gap-3">
          {checklist.map((item) => {
            const card = (
              <Card className="border-border/60 shadow-soft hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                  <div
                    className={`h-10 w-10 rounded-xl flex items-center justify-center ${item.done ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-accent text-accent-foreground"}`}
                  >
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.done ? "Completed" : "Not started"}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {item.done ? "Edit" : "Start"}
                  </Button>
                </CardContent>
              </Card>
            );
            if (item.external) {
              return (
                <a key={item.title} href={item.to} target="_blank" rel="noopener noreferrer">
                  {card}
                </a>
              );
            }
            return (
              <Link key={item.title} to={item.to as "/dashboard/products"}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Danger zone ── */}
      <div>
        <h3 className="font-semibold text-destructive mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Danger zone
        </h3>
        <Card className="border-destructive/30 shadow-soft">
          <CardContent className="p-5 space-y-4">
            {/* Toggle visibility */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-sm">
                  {storeVisible ? "Hide your store" : "Show your store"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {storeVisible
                    ? "Customers won't be able to visit your storefront while it's hidden."
                    : "Your store is currently hidden. Make it visible to customers again."}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleVisibility}
                disabled={togglingVisibility}
                className="shrink-0 border-orange-500/40 text-orange-500 hover:bg-orange-500/10"
              >
                {togglingVisibility ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : storeVisible ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1.5" /> Hide store
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" /> Show store
                  </>
                )}
              </Button>
            </div>

            <div className="h-px bg-destructive/10" />

            {/* Delete store */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-sm text-destructive">Delete store</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently delete your store and all its data. This cannot be undone.
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="shrink-0" disabled>
                    <Trash2 className="h-4 w-4 mr-1.5" /> Delete store
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Coming soon</AlertDialogTitle>
                    <AlertDialogDescription>
                      Store deletion will be available in a future update.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
