import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Wallet,
  TrendingUp,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  RotateCcw,
  Loader2,
  Plus,
  Copy,
  Banknote,
  AlertCircle,
  ChevronRight,
  PackageCheck,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Img } from "@/components/ui/Img";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  useMyDropshipOrders,
  useMyWallet,
  useMyWalletTransactions,
  useMyTopupRequests,
  useRequestWalletTopup,
  useConfirmAndPayOrder,
  type DropshipOrder,
} from "@/hooks/useDropshipping";

export const Route = createFileRoute("/dashboard/dropship-orders")({
  component: DropshipOrdersPage,
  head: () => ({ meta: [{ title: "Dropship Orders — Fennecly" }] }),
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
  pending_payment: {
    label: "بانتظار الدفع",
    color:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: Clock,
  },
  paid_by_reseller: {
    label: "مدفوع",
    color:
      "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
    icon: CheckCircle2,
  },
  purchased_by_admin: {
    label: "تم الشراء",
    color:
      "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
    icon: PackageCheck,
  },
  shipped: {
    label: "تم الشحن",
    color:
      "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
    icon: Truck,
  },
  delivered: {
    label: "تم التسليم",
    color:
      "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    icon: PackageCheck,
  },
  refused: {
    label: "مرفوض",
    color:
      "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
    icon: XCircle,
  },
  in_stock_buffer: {
    label: "في المخزن المؤقت",
    color:
      "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    icon: RotateCcw,
  },
  returned_to_reseller: {
    label: "أُعيد إليك",
    color:
      "border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
    icon: RotateCcw,
  },
};

const PIPELINE: { key: string; label: string }[] = [
  { key: "pending_payment", label: "بانتظار الدفع" },
  { key: "paid_by_reseller", label: "مدفوع" },
  { key: "purchased_by_admin", label: "تم الشراء" },
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
  if (status === "refused" || status === "in_stock_buffer" || status === "returned_to_reseller") {
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
            <div
              className={`h-0.5 w-3 ${
                i < current ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function DropshipOrdersPage() {
  const { user } = useAuth();
  const { currentStore, loading: storeLoading } = useCurrentStore();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmingPay, setConfirmingPay] = useState<DropshipOrder | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<string>("");
  const [topupReference, setTopupReference] = useState<string>("");

  const { data: orders = [], isLoading: ordersLoading } = useMyDropshipOrders(
    statusFilter === "all" ? undefined : statusFilter,
    currentStore?.id,
  );
  const { data: wallet } = useMyWallet();
  const { data: walletTx = [] } = useMyWalletTransactions();
  const { data: topupRequests = [] } = useMyTopupRequests();
  const requestTopup = useRequestWalletTopup();
  const confirmPay = useConfirmAndPayOrder();

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const counts = useMemo(
    () => ({
      pending_payment: orders.filter((o) => o.status === "pending_payment").length,
      paid_by_reseller: orders.filter((o) => o.status === "paid_by_reseller").length,
      purchased_by_admin: orders.filter((o) => o.status === "purchased_by_admin").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      refused: orders.filter((o) => o.status === "refused").length,
      in_stock_buffer: orders.filter((o) => o.status === "in_stock_buffer").length,
      returned_to_reseller: orders.filter((o) => o.status === "returned_to_reseller").length,
    }),
    [orders],
  );

  const handleConfirmPay = async () => {
    if (!confirmingPay) return;
    try {
      await confirmPay.mutateAsync({ orderId: confirmingPay.id });
      toast.success("تم تأكيد الطلب وخصم المبلغ من المحفظة");
      setConfirmingPay(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleRequestTopup = async () => {
    const amount = Number(topupAmount);
    if (!(amount > 0)) {
      toast.error("أدخل مبلغاً صحيحاً");
      return;
    }
    if (!topupReference.trim()) {
      toast.error("أدخل مرجع الدفع (وصل CCP / Baridimob)");
      return;
    }
    try {
      await requestTopup.mutateAsync({
        amount,
        paymentReference: topupReference.trim(),
      });
      toast.success("تم إرسال طلب التعبئة. سيتم مراجعته من الإدارة.");
      setTopupOpen(false);
      setTopupAmount("");
      setTopupReference("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!user) return null;
  if (storeLoading) {
    return (
      <div className="max-w-7xl mx-auto" dir="rtl">
        <PageHeader
          eyebrow="Dropshipping"
          title="طلبات التوريد"
          description="تابع طلبيات زبائنك وادفع ثمنها من محفظتك"
          icon={ShoppingBag}
          gradient="from-sky-500 via-blue-500 to-indigo-500"
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
        eyebrow="Dropshipping"
        title="طلبات التوريد"
        description="تابع طلبيات زبائنك وادفع ثمنها من محفظتك"
        icon={ShoppingBag}
        gradient="from-sky-500 via-blue-500 to-indigo-500"
        actions={
          <Button onClick={() => setTopupOpen(true)}>
            <Plus className="h-4 w-4 ms-2" /> تعبئة المحفظة
          </Button>
        }
      />

      {/* Stats - RTL order: first in JSX = rightmost visually */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard
          icon={Wallet}
          label="رصيد المحفظة"
          value={formatPrice(Number(wallet?.balance ?? 0))}
          gradient="from-violet-500 to-fuchsia-500"
        />
        <StatCard
          icon={RotateCcw}
          label="أُعيد إليك"
          value={counts.returned_to_reseller.toLocaleString("fr-DZ")}
          gradient="from-zinc-500 to-gray-500"
        />
        <StatCard
          icon={RotateCcw}
          label="في المخزن المؤقت"
          value={counts.in_stock_buffer.toLocaleString("fr-DZ")}
          gradient="from-amber-500 to-orange-500"
        />
        <StatCard
          icon={XCircle}
          label="مرفوضة"
          value={counts.refused.toLocaleString("fr-DZ")}
          gradient="from-rose-500 to-pink-500"
        />
        <StatCard
          icon={PackageCheck}
          label="مُسلّمة"
          value={counts.delivered.toLocaleString("fr-DZ")}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={Truck}
          label="تم الشحن"
          value={counts.shipped.toLocaleString("fr-DZ")}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={PackageCheck}
          label="تم الشراء"
          value={counts.purchased_by_admin.toLocaleString("fr-DZ")}
          gradient="from-indigo-500 to-violet-500"
        />
        <StatCard
          icon={CheckCircle2}
          label="مدفوعة"
          value={counts.paid_by_reseller.toLocaleString("fr-DZ")}
          gradient="from-sky-500 to-blue-500"
        />
        <StatCard
          icon={Clock}
          label="بانتظار الدفع"
          value={counts.pending_payment.toLocaleString("fr-DZ")}
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      <Tabs defaultValue="orders" dir="ltr">
        <TabsList className="mb-4">
          <TabsTrigger value="orders">الطلبيات</TabsTrigger>
          <TabsTrigger value="topups">طلبات التعبئة</TabsTrigger>
          <TabsTrigger value="ledger">سجل المعاملات</TabsTrigger>
        </TabsList>

        {/* ORDERS TAB */}
        <TabsContent value="orders">
          <Card className="border-border/60 shadow-soft">
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
                  description="ستظهر طلبيات زبائنك هنا تلقائياً."
                />
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filtered.map((o) => {
                  const product = (o as DropshipOrder & {
                    reseller_listing?: { marketplace_product?: { name?: string; images?: string[] } | null } | null;
                  }).reseller_listing?.marketplace_product;
                  const isPending = o.status === "pending_payment";
                  const walletBalance = Number(wallet?.balance ?? 0);
                  const canPay = walletBalance >= Number(o.platform_price);
                  return (
                    <div
                      key={o.id}
                      className="p-4 flex flex-col md:flex-row md:items-center gap-4"
                    >
                      <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
                        {product?.images?.[0] ? (
                          <Img
                            src={product.images[0]}
                            alt={product.name ?? ""}
                            width={112}
                            quality={70}
                            objectFit="cover"
                            className="h-full w-full"
                          />
                        ) : (
                          <div className="h-full w-full grid place-items-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold line-clamp-1">
                            {product?.name ?? "طلبية"}
                          </p>
                          <StatusBadge status={o.status} />
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {o.client_name} • {o.client_phone} • {o.client_wilaya}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {o.client_address}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <PipelineSteps status={o.status} />
                        </div>
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        <p className="text-xs text-muted-foreground">سعر البيع</p>
                        <p className="text-lg font-bold" dir="ltr">
                          {formatPrice(Number(o.selling_price))}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          التكلفة: {formatPrice(Number(o.platform_price))}
                        </p>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          ربحك: {formatPrice(Number(o.reseller_profit))}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isPending ? (
                          <Button
                            onClick={() => setConfirmingPay(o)}
                            disabled={!canPay}
                            className="w-full md:w-auto"
                            size="sm"
                          >
                            <Banknote className="h-4 w-4 ms-2" />
                            تأكيد ودفع
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                            className="w-full md:w-auto"
                          >
                            <a
                              href={`https://zi.express/track/${o.tracking_number ?? ""}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              التفاصيل
                              <ChevronRight className="h-4 w-4 ms-1" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TOPUP REQUESTS TAB */}
        <TabsContent value="topups">
          <Card className="border-border/60 shadow-soft overflow-hidden">
            {topupRequests.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  icon={Wallet}
                  title="لا توجد طلبات تعبئة"
                  description="عند رصيد منخفض، اطلب تعبئة وستظهر الحالة هنا."
                  action={
                    <Button onClick={() => setTopupOpen(true)}>
                      <Plus className="h-4 w-4 ms-2" /> طلب تعبئة جديد
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">مرجع الدفع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">ملاحظة الإدارة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topupRequests.map((r) => {
                      const statusColor =
                        r.status === "approved"
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                          : r.status === "rejected"
                            ? "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                            : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400";
                      const statusLabel =
                        r.status === "approved"
                          ? "موافق عليه"
                          : r.status === "rejected"
                            ? "مرفوض"
                            : "قيد المراجعة";
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-bold" dir="ltr">
                            {formatPrice(Number(r.amount))}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {r.payment_reference}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColor}>
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {r.admin_note ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(r.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* LEDGER TAB */}
        <TabsContent value="ledger">
          <Card className="border-border/60 shadow-soft overflow-hidden">
            {walletTx.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  icon={TrendingUp}
                  title="لا توجد معاملات"
                  description="ستظهر تعبئات المحفظة والمدفوعات والأرباح هنا."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">الرصيد بعد</TableHead>
                      <TableHead className="text-right">الوصف</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {walletTx.map((tx) => {
                      const amt = Number(tx.amount);
                      const positive = amt > 0;
                      const typeLabel: Record<string, string> = {
                        topup: "تعبئة",
                        payment: "دفع طلبية",
                        earning: "أرباح",
                        withdrawal: "سحب",
                        refund: "استرداد",
                        return_fee: "رسوم إرجاع",
                      };
                      return (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                positive
                                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                              }
                            >
                              {typeLabel[tx.type] ?? tx.type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={`font-bold ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                            dir="ltr"
                          >
                            {positive ? "+" : ""}
                            {formatPrice(amt)}
                          </TableCell>
                          <TableCell dir="ltr" className="text-muted-foreground">
                            {formatPrice(Number(tx.balance_after))}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">
                            {tx.description ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(tx.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm & Pay dialog */}
      <Dialog
        open={!!confirmingPay}
        onOpenChange={(o) => !o && setConfirmingPay(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد ودفع الطلبية</DialogTitle>
            <DialogDescription>
              سيتم خصم {confirmingPay ? formatPrice(Number(confirmingPay.platform_price)) : ""} من محفظتك
              ({confirmingPay ? formatPrice(Number(wallet?.balance ?? 0)) : ""} متاح).
            </DialogDescription>
          </DialogHeader>
          {confirmingPay && (
            <div className="rounded-lg border border-border/60 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">الزبون</span>
                <span className="font-medium">{confirmingPay.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الهاتف</span>
                <span dir="ltr">{confirmingPay.client_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الولاية</span>
                <span className="font-medium">{confirmingPay.client_wilaya}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">العنوان</span>
                <span className="text-end max-w-[60%] truncate">
                  {confirmingPay.client_address}
                </span>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmingPay(null)}
              disabled={confirmPay.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmPay}
              disabled={confirmPay.isPending}
            >
              {confirmPay.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <Banknote className="h-4 w-4 ms-2" />
              )}
              تأكيد الخصم والدفع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Topup dialog */}
      <Dialog open={topupOpen} onOpenChange={setTopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>طلب تعبئة محفظة</DialogTitle>
            <DialogDescription>
              حوّل المبلغ إلى حساب Fennecly ثم أدخل مرجع العملية هنا.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CCP</span>
                <span className="font-mono">12345 67 890</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Baridimob</span>
                <span className="font-mono">+213 555 12 34 56</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الاسم</span>
                <span className="font-medium">Fennecly SARL</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المبلغ (دج)</label>
              <Input
                type="number"
                inputMode="decimal"
                min={100}
                step={100}
                placeholder="مثال: 5000"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">مرجع العملية</label>
              <Input
                placeholder="رقم وصل CCP / Baridimob"
                value={topupReference}
                onChange={(e) => setTopupReference(e.target.value)}
                dir="ltr"
              />
              <p className="text-[11px] text-muted-foreground">
                سيتحقق فريق الإدارة من التحويل قبل الموافقة على التعبئة.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setTopupOpen(false)}
              disabled={requestTopup.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleRequestTopup}
              disabled={requestTopup.isPending}
            >
              {requestTopup.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <Copy className="h-4 w-4 ms-2" />
              )}
              إرسال الطلب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Stat card
// ============================================================
function StatCard({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  gradient: string;
}) {
  return (
    <Card className="border-border/60 shadow-soft overflow-hidden">
      <div className="p-3 sm:p-4 flex items-center gap-3">
        <div
          className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${gradient} text-white grid place-items-center shadow-sm shrink-0`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
            {label}
          </p>
          <p className="text-base sm:text-xl font-bold font-display truncate" dir="ltr">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}
