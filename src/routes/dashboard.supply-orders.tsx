import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Loader2,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  AlertCircle,
  PackageCheck,
  Store,
  Wallet,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Img } from "@/components/ui/Img";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMySupplyOrders, useMyWallet, type SupplyOrder } from "@/hooks/useDropshipping";

export const Route = createFileRoute("/dashboard/supply-orders")({
  component: SupplyOrdersPage,
  head: () => ({ meta: [{ title: "طلبيات التوريد — Fennecly" }] }),
});

function formatPrice(n: number) {
  return `${Math.round(n).toLocaleString("fr-DZ")} DA`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-DZ", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: {
    label: "بانتظار المعالجة",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  processing: {
    label: "قيد المعالجة",
    color: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    icon: Package,
  },
  shipped: {
    label: "تم الشحن",
    color: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: Truck,
  },
  delivered: {
    label: "تم التسليم",
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: PackageCheck,
  },
  cancelled: {
    label: "ملغي",
    color: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    icon: XCircle,
  },
};

const PIPELINE: { key: string; label: string }[] = [
  { key: "pending", label: "بانتظار المعالجة" },
  { key: "processing", label: "قيد المعالجة" },
  { key: "shipped", label: "تم الشحن" },
  { key: "delivered", label: "تم التسليم" },
];

const PIPELINE_INDEX: Record<string, number> = PIPELINE.reduce(
  (m, s, i) => ({ ...m, [s.key]: i }),
  {} as Record<string, number>,
);

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? {
    label: status,
    color: "border-border bg-muted text-muted-foreground",
    icon: AlertCircle,
  };
  const Icon = meta.icon;
  return (
    <Badge variant="outline" className={`${meta.color} font-normal`}>
      <Icon className="h-3 w-3 me-1" />
      {meta.label}
    </Badge>
  );
}

function PipelineSteps({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <Badge variant="outline" className={STATUS_META[status].color}>
        {STATUS_META[status].label}
      </Badge>
    );
  }
  const current = PIPELINE_INDEX[status] ?? 0;
  return (
    <div className="flex items-center gap-1.5">
      {PIPELINE.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1.5">
          <div
            className={`h-2 w-2 rounded-full ${
              i <= current ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            title={step.label}
          />
          {i < PIPELINE.length - 1 && (
            <div className={`h-0.5 w-3 ${i < current ? "bg-primary" : "bg-muted-foreground/30"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function SupplyOrdersPage() {
  const { user } = useAuth();
  const { currentStore, loading: storeLoading } = useCurrentStore();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: orders = [], isLoading: ordersLoading } = useMySupplyOrders();
  const { data: wallet } = useMyWallet();

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const counts = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === "pending").length,
      processing: orders.filter((o) => o.status === "processing").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
    }),
    [orders],
  );

  if (!user) return null;
  if (storeLoading) {
    return (
      <div className="max-w-7xl mx-auto" dir="rtl">
        <PageHeader
          eyebrow="Supply"
          title="طلبيات التوريد"
          description="تابع طلبياتك من سوق التوريد"
          icon={Store}
          gradient="from-amber-500 via-orange-500 to-rose-500"
        />
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <PageHeader
        eyebrow="Supply"
        title="طلبيات التوريد"
        description="تابع طلبياتك من سوق التوريد"
        icon={Store}
        gradient="from-amber-500 via-orange-500 to-rose-500"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        <Card className="border-border/60 overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white grid place-items-center shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">رصيد المحفظة</p>
              <p className="text-lg font-bold font-display" dir="ltr">
                {formatPrice(Number(wallet?.balance ?? 0))}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/60 overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white grid place-items-center shrink-0">
              <Clock className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">بانتظار المعالجة</p>
              <p className="text-lg font-bold font-display" dir="ltr">
                {counts.pending.toLocaleString("fr-DZ")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/60 overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 text-white grid place-items-center shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">قيد المعالجة</p>
              <p className="text-lg font-bold font-display" dir="ltr">
                {counts.processing.toLocaleString("fr-DZ")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/60 overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white grid place-items-center shrink-0">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">تم الشحن</p>
              <p className="text-lg font-bold font-display" dir="ltr">
                {counts.shipped.toLocaleString("fr-DZ")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/60 overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white grid place-items-center shrink-0">
              <PackageCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">مُسلّمة</p>
              <p className="text-lg font-bold font-display" dir="ltr">
                {counts.delivered.toLocaleString("fr-DZ")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card className="border-border/60">
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="كل الحالات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {Object.entries(STATUS_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="ms-auto text-sm text-muted-foreground">
            {filtered.length} من {orders.length} طلبية
          </span>
        </div>

        {ordersLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={ShoppingBag}
              title="لا توجد طلبيات"
              description="ستظهر طلبياتك من سوق التوريد هنا تلقائياً."
            />
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((o) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="p-4 flex flex-col md:flex-row md:items-center gap-4"
              >
                <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
                  {o.supply_product?.images?.[0] ? (
                    <Img
                      src={o.supply_product.images[0]}
                      alt={o.supply_product.name ?? ""}
                      objectFit="cover"
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold line-clamp-1">
                      {o.supply_product?.name ?? "طلبية توريد"}
                    </p>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    الكمية: {o.quantity} &middot; سعر الوحدة: {formatPrice(Number(o.unit_price))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{o.id.slice(0, 8)} &middot; {formatDate(o.created_at)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <PipelineSteps status={o.status} />
                  </div>
                </div>

                <div className="text-left md:text-right shrink-0">
                  <p className="text-xs text-muted-foreground">الإجمالي</p>
                  <p className="text-lg font-bold" dir="ltr">
                    {formatPrice(Number(o.total_price))}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
