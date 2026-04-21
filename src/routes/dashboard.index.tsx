import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { InstalledAppsSection } from "@/components/dashboard/InstalledAppsSection";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
  head: () => ({
    meta: [{ title: "Dashboard — Storely" }],
  }),
});

function DashboardHome() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { status, daysRemaining, hadPaidSubscription } = useSubscription();
  const [name, setName] = useState("");
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [counts, setCounts] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    customers: 0,
  });

  useEffect(() => {
    if (!user) return;
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

    Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("orders")
        .select("total,customer_email")
        .eq("store_owner_id", user.id),
    ]).then(([prodRes, ordersRes]) => {
      const orders = ordersRes.data ?? [];
      const revenue = orders.reduce((n, o) => n + Number(o.total ?? 0), 0);
      const customers = new Set(
        orders.map((o) => o.customer_email.toLowerCase()),
      ).size;
      setCounts({
        products: prodRes.count ?? 0,
        orders: orders.length,
        revenue,
        customers,
      });
    });
  }, [user]);

  const stats = [
    {
      label: t("dashboard.home.stats.products"),
      value: counts.products.toString(),
      icon: Package,
      accent: "from-violet-500/15 to-violet-500/5",
    },
    {
      label: t("dashboard.home.stats.orders"),
      value: counts.orders.toString(),
      icon: ShoppingBag,
      accent: "from-fuchsia-500/15 to-fuchsia-500/5",
    },
    {
      label: t("dashboard.home.stats.revenue"),
      value: `$${counts.revenue.toFixed(2)}`,
      icon: DollarSign,
      accent: "from-emerald-500/15 to-emerald-500/5",
    },
    {
      label: t("dashboard.home.stats.customers"),
      value: counts.customers.toString(),
      icon: Users,
      accent: "from-sky-500/15 to-sky-500/5",
    },
  ];

  const displayName = name || user?.email?.split("@")[0] || "—";

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">
            {t("dashboard.home.kicker")}
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold font-display">
            {t("dashboard.home.welcome")}{" "}
            <span className="text-gradient-brand">{displayName}</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            {t("dashboard.home.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1.5"
          >
            <CircleDot className="h-3 w-3 fill-emerald-500 text-emerald-500" />
            {t("dashboard.home.storeActive")}
          </Badge>
        </div>
      </motion.div>

      <SubscriptionStatusCard
        status={status}
        daysRemaining={daysRemaining}
        hadPaidSubscription={!!hadPaidSubscription}
        hasPendingPayment={hasPendingPayment}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * i }}
          >
            <Card className="relative overflow-hidden border-border/60 shadow-soft hover:shadow-glow/20 transition-shadow">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${s.accent} pointer-events-none`}
              />
              <CardContent className="relative p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground font-medium">
                    {s.label}
                  </span>
                  <div className="h-9 w-9 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center border border-border/60">
                    <s.icon className="h-4 w-4 text-foreground" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold font-display">
                    {s.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-8 grid gap-4 md:grid-cols-3"
      >
        <QuickAction
          to="/dashboard/products"
          icon={Plus}
          title={t("dashboard.home.actions.addProduct.title")}
          description={t("dashboard.home.actions.addProduct.desc")}
          variant="primary"
        />
        <QuickAction
          to="/customize"
          external
          icon={Palette}
          title={t("dashboard.home.actions.customize.title")}
          description={t("dashboard.home.actions.customize.desc")}
        />
        <QuickAction
          to="/dashboard/store"
          icon={ExternalLink}
          title={t("dashboard.home.actions.viewStore.title")}
          description={t("dashboard.home.actions.viewStore.desc")}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-8 grid gap-4 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2 border-border/60 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{t("dashboard.home.recentOrders")}</h3>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/dashboard/orders">{t("dashboard.home.viewAll")}</Link>
              </Button>
            </div>
            <div className="mt-8 flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-accent-foreground" />
              </div>
              <p className="mt-4 font-medium">{t("dashboard.home.noOrders")}</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                {t("dashboard.home.noOrdersDesc")}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-soft bg-gradient-brand text-brand-foreground overflow-hidden relative">
          <div className="absolute inset-0 bg-soft-radial opacity-50" />
          <CardContent className="relative p-6 flex flex-col h-full">
            <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Palette className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-xl font-bold font-display">
              {t("dashboard.home.checklist")}
            </h3>
            <p className="mt-2 text-sm text-brand-foreground/80">
              {t("dashboard.home.checklistDesc")}
            </p>
            <div className="mt-auto pt-6">
              <Button variant="secondary" size="sm" asChild className="w-full">
                <Link to="/dashboard/store">{t("dashboard.home.continueSetup")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <InstalledAppsSection />
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  title,
  description,
  variant,
  external,
}: {
  to: "/dashboard/products" | "/dashboard/store" | "/customize";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  variant?: "primary";
  external?: boolean;
}) {
  const inner = (
    <Card
      className={`border-border/60 shadow-soft transition-all hover:shadow-glow/30 hover:-translate-y-0.5 ${
        variant === "primary" ? "bg-foreground text-background" : ""
      }`}
    >
      <CardContent className="p-6 flex items-start gap-4">
        <div
          className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
            variant === "primary"
              ? "bg-background/15"
              : "bg-accent text-accent-foreground"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="font-semibold">{title}</div>
          <p
            className={`mt-1 text-sm ${
              variant === "primary"
                ? "text-background/70"
                : "text-muted-foreground"
            }`}
          >
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="group">
        {inner}
      </a>
    );
  }
  return (
    <Link to={to as "/dashboard/products" | "/dashboard/store"} className="group">
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
      <Card className="mt-6 border-emerald-500/30 bg-emerald-500/5 shadow-soft">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{t("dashboard.home.subActive")}</p>
              <p className="text-sm text-muted-foreground">
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
      <Card className="mt-6 border-amber-500/30 bg-amber-500/5 shadow-soft">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{t("dashboard.home.subPending")}</p>
              <p className="text-sm text-muted-foreground">
                {t("dashboard.home.subPendingDesc")}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
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
      <Card className="mt-6 border-destructive/30 bg-destructive/5 shadow-soft">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-destructive/15 text-destructive">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          </div>
          <Button size="sm" asChild>
            <Link to="/dashboard/upgrade">
              <Sparkles className="size-4" />
              {cta}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-primary/30 bg-primary/5 shadow-soft">
      <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-semibold">
              {t("dashboard.home.trialLeft", {
                days: daysRemaining,
                unit: daysRemaining === 1 ? t("dashboard.home.day") : t("dashboard.home.days"),
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.home.trialDesc")}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard/upgrade">{t("dashboard.home.upgrade")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
