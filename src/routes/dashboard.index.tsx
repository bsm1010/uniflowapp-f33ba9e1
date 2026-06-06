import { IphoneShortcutBanner } from "@/components/dashboard/IphoneShortcutBanner";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Package,
  ShoppingBag,
  DollarSign,
  Users,
  Plus,
  Palette,
  ExternalLink,
  CircleDot,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Store,
  TrendingUp,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useSubscription } from "@/hooks/use-subscription";
import { useCountUp } from "@/hooks/use-count-up";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { InstalledAppsSection } from "@/components/dashboard/InstalledAppsSection";
import { StoreProgressCard } from "@/components/dashboard/StoreProgressCard";
import { WindowsAppBanner } from "@/components/dashboard/WindowsAppBanner";
import { Img } from "@/components/ui/Img";
import { GamificationHub } from "@/components/dashboard/core-loop/GamificationHub";
import { useServerFn } from "@tanstack/react-start";
import { getGamification, type GamificationData } from "@/lib/core-loop";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  head: () => ({
    meta: [{ title: "Dashboard — Storely" }],
  }),
});

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  shipped: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  delivered: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  refunded: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
};

function DashboardHome() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const { t } = useTranslation();
  const { status, daysRemaining, hadPaidSubscription } = useSubscription();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [counts, setCounts] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    customers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Array<{
    id: string;
    customer_name: string;
    total: number;
    status: string;
    created_at: string;
    product_name: string | null;
    product_image: string | null;
    item_count: number;
  }>>([]);
  const [gamiData, setGamiData] = useState<GamificationData | null>(null);
  const [gamiLoading, setGamiLoading] = useState(true);
  const callGami = useServerFn(getGamification);

  const loadDashboard = useCallback(() => {
    if (!user) return;
    const storeId = currentStore?.id ?? null;

    supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.name) setName(data.name);
      });

    supabase
      .from("payment_submissions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .limit(1)
      .then(({ data }) => setHasPendingPayment((data?.length ?? 0) > 0));

    const scopedProducts = () => {
      let q = supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if (storeId) q = q.eq("store_id", storeId);
      return q;
    };
    const scopedOrdersCount = () => {
      let q = supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("store_owner_id", user.id);
      if (storeId) q = q.eq("store_id", storeId);
      return q;
    };
    const scopedOrdersForAgg = () => {
      let q = supabase
        .from("orders")
        .select("customer_email,total")
        .eq("store_owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (storeId) q = q.eq("store_id", storeId);
      return q;
    };
    const scopedRecentOrders = () => {
      let q = supabase
        .from("orders")
        .select("id,customer_name,total,status,created_at")
        .eq("store_owner_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (storeId) q = q.eq("store_id", storeId);
      return q;
    };

    Promise.all([
      scopedProducts(),
      scopedOrdersCount(),
      scopedOrdersForAgg(),
      scopedRecentOrders(),
    ]).then(async ([prodRes, ordersCountRes, ordersAggRes, recentRes]) => {
      const agg = ordersAggRes.data ?? [];
      const revenue = agg.reduce((n, o) => n + Number(o.total ?? 0), 0);
      const customers = new Set(
        agg.map((o) => (o.customer_email ?? "").toLowerCase()).filter(Boolean),
      ).size;
      setCounts({
        products: prodRes.count ?? 0,
        orders: ordersCountRes.count ?? 0,
        revenue,
        customers,
      });

      const recent = recentRes.data ?? [];
      const recentIds = recent.map((o) => o.id);
      const itemsByOrder: Record<
        string,
        { product_name: string; image_url: string | null; count: number }
      > = {};
      if (recentIds.length) {
        const { data: its } = await supabase
          .from("order_items")
          .select("order_id,product_name,image_url")
          .in("order_id", recentIds);
        for (const it of its ?? []) {
          const cur = itemsByOrder[it.order_id];
          if (cur) cur.count += 1;
          else
            itemsByOrder[it.order_id] = {
              product_name: it.product_name,
              image_url: it.image_url,
              count: 1,
            };
        }
      }
      setRecentOrders(
        recent.map((o) => ({
          id: o.id,
          customer_name: o.customer_name,
          total: Number(o.total),
          status: o.status,
          created_at: o.created_at,
          product_name: itemsByOrder[o.id]?.product_name ?? null,
          product_image: itemsByOrder[o.id]?.image_url ?? null,
          item_count: itemsByOrder[o.id]?.count ?? 0,
        })),
      );
    });
  }, [user, currentStore?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setGamiLoading(false); return; }
      try {
        const result = await callGami({ data: { accessToken: session.access_token } });
        setGamiData(result);
      } catch { /* ignore */ }
      setGamiLoading(false);
    };
    load();
  }, [callGami]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`dashboard-orders-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `store_owner_id=eq.${user.id}`,
        },
        () => loadDashboard(),
      )
      .subscribe();
    let lastFocusReload = Date.now();
    const onFocus = () => {
      if (Date.now() - lastFocusReload > 30_000) {
        lastFocusReload = Date.now();
        loadDashboard();
      }
    };
    window.addEventListener("focus", onFocus);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, loadDashboard]);

  const stats = [
    {
      label: t("dashboard.home.stats.products"),
      raw: counts.products,
      icon: Package,
      iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    },
    {
      label: t("dashboard.home.stats.orders"),
      raw: counts.orders,
      icon: ShoppingBag,
      iconBg: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400",
    },
    {
      label: t("dashboard.home.stats.revenue"),
      raw: counts.revenue,
      isRevenue: true,
      icon: DollarSign,
      iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: t("dashboard.home.stats.customers"),
      raw: counts.customers,
      icon: Users,
      iconBg: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    },
  ];

  const displayName = name || user?.email?.split("@")[0] || "—";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-border/50 p-6 sm:p-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary">
              <TrendingUp className="h-3 w-3" />
              {t("dashboard.home.kicker")}
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold font-display">
              {t("dashboard.home.welcome")}{" "}
              <span className="aurora-text">{displayName}</span>
            </h1>
            <p className="mt-1.5 text-muted-foreground/80 text-sm">
              {t("dashboard.home.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {t("dashboard.home.storeActive")}
            </Badge>
          </div>
        </div>
      </motion.div>

      <WindowsAppBanner />
      <IphoneShortcutBanner />

      <SubscriptionStatusCard
        status={status}
        daysRemaining={daysRemaining}
        hadPaidSubscription={!!hadPaidSubscription}
        hasPendingPayment={hasPendingPayment}
      />

      {/* Stats */}
      {counts.products === 0 && counts.orders === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <EmptyState
            icon={Store}
            title="Welcome to your dashboard"
            description="Your store stats will show up here once you add products and start getting orders."
            action={{ label: "Add your first product", onClick: () => navigate({ to: "/dashboard/products" }) }}
          />
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 * i }}
            >
              <StatCard
                label={s.label}
                rawValue={s.raw}
                isRevenue={s.isRevenue}
                icon={s.icon}
                iconBg={s.iconBg}
                delay={i * 120}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Progress + Gamification */}
      <div className="grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <StoreProgressCard />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
        >
          {gamiData && <GamificationHub data={gamiData} loading={gamiLoading} compact />}
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
        className="grid gap-4 md:grid-cols-3"
      >
        <QuickAction
          to="/dashboard/products"
          icon={Plus}
          iconGradient="from-violet-500 to-fuchsia-500"
          title={t("dashboard.home.actions.addProduct.title")}
          description={t("dashboard.home.actions.addProduct.desc")}
        />
        <QuickAction
          to="/customize"
          external
          icon={Palette}
          iconGradient="from-sky-500 to-indigo-500"
          title={t("dashboard.home.actions.customize.title")}
          description={t("dashboard.home.actions.customize.desc")}
        />
        <QuickAction
          to="/dashboard/store"
          icon={ExternalLink}
          iconGradient="from-emerald-500 to-teal-500"
          title={t("dashboard.home.actions.viewStore.title")}
          description={t("dashboard.home.actions.viewStore.desc")}
        />
      </motion.div>

      {/* Recent orders + Launch checklist */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="grid gap-4 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2 border-border/50 shadow-sm overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h3 className="font-semibold">{t("dashboard.home.recentOrders")}</h3>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
                <Link to="/dashboard/orders">
                  {t("dashboard.home.viewAll")}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="mt-3 font-medium">{t("dashboard.home.noOrders")}</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                  {t("dashboard.home.noOrdersDesc")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {o.product_image ? (
                        <Img
                          src={o.product_image}
                          alt={o.product_name ?? ""}
                          width={88}
                          quality={75}
                          className="h-11 w-11 rounded-lg shrink-0 ring-1 ring-border/30"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center shrink-0 ring-1 ring-border/30">
                          <ShoppingBag className="h-4 w-4 text-violet-500" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {o.product_name ?? o.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground/70 truncate">
                          {o.customer_name}
                          {o.item_count > 1 && ` • +${o.item_count - 1} more`}
                          {" • "}
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="outline"
                        className={`capitalize text-[11px] px-2 py-0.5 border ${STATUS_COLORS[o.status] || "bg-muted text-muted-foreground border-border/50"}`}
                      >
                        {o.status}
                      </Badge>
                      <span className="font-semibold text-sm tabular-nums text-foreground">
                        ${Number(o.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm overflow-hidden">
          <CardContent className="p-5 sm:p-6 flex flex-col h-full">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="mt-4 text-lg sm:text-xl font-bold font-display text-foreground">
              {t("dashboard.home.checklist")}
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground/70">
              {t("dashboard.home.checklistDesc")}
            </p>
            <div className="mt-auto pt-6">
              <Button
                size="sm"
                asChild
                className="w-full gap-1.5"
              >
                <Link to="/dashboard/store">
                  {t("dashboard.home.continueSetup")}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <InstalledAppsSection />
    </div>
  );
}

function StatCard({
  label,
  rawValue,
  isRevenue,
  icon: Icon,
  iconBg,
  delay,
}: {
  label: string;
  rawValue: number;
  isRevenue?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  delay: number;
}) {
  const animated = useCountUp(rawValue, 1400, delay);
  const display = isRevenue
    ? `${animated.toLocaleString()} DA`
    : animated.toLocaleString();

  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">
            {label}
          </span>
          <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-bold font-display tabular-nums tracking-tight">
            {display}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({
  to,
  icon: Icon,
  iconGradient,
  title,
  description,
  external,
}: {
  to: "/dashboard/products" | "/dashboard/store" | "/customize";
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
  title: string;
  description: string;
  external?: boolean;
}) {
  const inner = (
    <Card className="border-border/50 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md cursor-pointer overflow-hidden bg-card">
      <CardContent className="p-5 flex items-start gap-4">
        <div
          className={`h-11 w-11 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shrink-0 shadow-sm`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm">{title}</div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return (
    <Link to={to as "/dashboard/products" | "/dashboard/store"} className="block">
      {inner}
    </Link>
  );
}

function SubscriptionStatusCard({
  status,
  daysRemaining,
  hadPaidSubscription,
  hasPendingPayment,
}: {
  status: string;
  daysRemaining: number;
  hadPaidSubscription: boolean;
  hasPendingPayment: boolean;
}) {
  const { t } = useTranslation();

  if (status === "active") {
    return (
      <Card className="border-emerald-500/20 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t("dashboard.home.subActive")}</p>
              <p className="text-xs text-muted-foreground/70">
                {t("dashboard.home.subActiveDesc")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (hasPendingPayment) {
    return (
      <Card className="border-amber-500/20 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{t("dashboard.home.subPending")}</p>
              <p className="text-xs text-muted-foreground/70">
                {t("dashboard.home.subPendingDesc")}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild className="border-amber-500/20 hover:bg-amber-500/10">
            <Link to="/dashboard/upgrade">{t("dashboard.home.viewStatus")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "expired") {
    const title = hadPaidSubscription
      ? t("dashboard.home.subExpired")
      : t("dashboard.home.trialExpired");
    const desc = hadPaidSubscription
      ? t("dashboard.home.subExpiredDesc")
      : t("dashboard.home.trialExpiredDesc");
    const cta = hadPaidSubscription
      ? t("dashboard.home.renew")
      : t("dashboard.home.upgradeNow");
    return (
      <Card className="border-red-500/20 shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 ring-1 ring-red-500/20">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{title}</p>
              <p className="text-xs text-muted-foreground/70">{desc}</p>
            </div>
          </div>
          <Button size="sm" asChild variant="destructive">
            <Link to="/dashboard/upgrade">
              <Sparkles className="size-3.5 mr-1" />
              {cta}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/20">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-semibold text-sm">
              {t("dashboard.home.trialLeft", {
                days: daysRemaining,
                unit: daysRemaining === 1 ? t("dashboard.home.day") : t("dashboard.home.days"),
              })}
            </p>
            <p className="text-xs text-muted-foreground/70">
              {t("dashboard.home.trialDesc")}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" asChild className="border-primary/20 hover:bg-primary/10">
          <Link to="/dashboard/upgrade">{t("dashboard.home.upgrade")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
