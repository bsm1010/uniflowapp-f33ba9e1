import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ShieldAlert,
  Loader2,
  Truck,
  PackageCheck,
  XCircle,
  RotateCcw,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Wallet,
  Save,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Img } from "@/components/ui/Img";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  useAdminDropshipOrders,
  useAdminUpdateOrderStatus,
  type DropshipOrder,
} from "@/hooks/useDropshipping";

export const Route = createFileRoute("/dashboard/admin/dropship-orders")({
  component: AdminDropshipOrdersPage,
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

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending_payment: {
    label: "بانتظار الدفع",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  paid_by_reseller: {
    label: "مدفوع",
    color: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  purchased_by_admin: {
    label: "تم الشراء",
    color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  },
  shipped: {
    label: "تم الشحن",
    color: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  delivered: {
    label: "مُسلَّم",
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  refused: {
    label: "مرفوض",
    color: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
  in_stock_buffer: {
    label: "مخزن مؤقت",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  returned_to_reseller: {
    label: "أُعيد للوكيل",
    color: "border-zinc-500/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-400",
  },
};

const STATUS_FLOW: {
  from: string;
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { from: "paid_by_reseller", to: "purchased_by_admin", label: "تأكيد الشراء", icon: PackageCheck },
  { from: "purchased_by_admin", to: "shipped", label: "شحن", icon: Truck },
  { from: "shipped", to: "delivered", label: "تسليم (يحرّض ربح الوكيل)", icon: CheckCircle2 },
  { from: "shipped", to: "refused", label: "رفض", icon: XCircle },
  { from: "refused", to: "in_stock_buffer", label: "نقل للمخزن المؤقت", icon: RotateCcw },
  { from: "in_stock_buffer", to: "returned_to_reseller", label: "إعادة للوكيل", icon: RotateCcw },
];

function AdminDropshipOrdersPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("paid_by_reseller");
  const [selected, setSelected] = useState<DropshipOrder | null>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [zrIdInput, setZrIdInput] = useState("");

  // Admin role check
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .in("role", ["admin", "marketplace_admin"]);
        if (error) {
          console.error("[AdminDropshipOrders] user_roles query error:", error.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data && data.length > 0);
        }
      } catch (e) {
        console.error(
          "[AdminDropshipOrders] Admin check failed:",
          e instanceof Error ? e.message : e,
        );
        setIsAdmin(false);
      }
    })();
  }, [user]);

  const { data: orders = [], isLoading: ordersLoading } = useAdminDropshipOrders(statusFilter);
  const updateStatus = useAdminUpdateOrderStatus();

  // Reset side-panel state when opening a new order
  useEffect(() => {
    if (selected) {
      setTrackingInput(selected.tracking_number ?? "");
      setZrIdInput(selected.zr_express_id ?? "");
    }
  }, [selected]);

  const counts = useMemo(() => {
    return {
      pending_payment: orders.filter((o) => o.status === "pending_payment").length,
      paid_by_reseller: orders.filter((o) => o.status === "paid_by_reseller").length,
      purchased_by_admin: orders.filter((o) => o.status === "purchased_by_admin").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      refused: orders.filter((o) => o.status === "refused").length,
    };
  }, [orders]);

  const handleStatusChange = async (order: DropshipOrder, newStatus: string) => {
    if (newStatus === "shipped" && !trackingInput.trim()) {
      toast.error("أدخل رقم التتبع لشحنة الطلب");
      return;
    }
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: newStatus as DropshipOrder["status"],
        trackingNumber: newStatus === "shipped" ? trackingInput.trim() : undefined,
        zrExpressId: newStatus === "shipped" ? zrIdInput.trim() || undefined : undefined,
      });
      toast.success(`تم تحديث الحالة إلى "${STATUS_LABEL[newStatus].label}"`);
      setSelected(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (isAdmin === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="p-8 text-center">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
          <h2 className="text-lg font-semibold mb-1">صلاحية المشرف مطلوبة</h2>
          <p className="text-sm text-muted-foreground">
            يجب أن تملك صلاحية admin أو marketplace_admin للوصول إلى هذه الصفحة.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <PageHeader
        eyebrow="Admin"
        title="إدارة طلبيات التوريد"
        description="معالجة الطلبيات المؤكدة من الزبائن وتحديث حالتها خطوة بخطوة"
        icon={ShoppingBag}
        gradient="from-rose-500 via-pink-500 to-fuchsia-500"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
        <AdminStat
          icon={Clock}
          label="بانتظار"
          value={counts.pending_payment}
          gradient="from-amber-500 to-orange-500"
        />
        <AdminStat
          icon={Wallet}
          label="مدفوعة"
          value={counts.paid_by_reseller}
          gradient="from-sky-500 to-blue-500"
        />
        <AdminStat
          icon={PackageCheck}
          label="تم الشراء"
          value={counts.purchased_by_admin}
          gradient="from-indigo-500 to-violet-500"
        />
        <AdminStat
          icon={Truck}
          label="تم الشحن"
          value={counts.shipped}
          gradient="from-blue-500 to-cyan-500"
        />
        <AdminStat
          icon={CheckCircle2}
          label="مُسلَّمة"
          value={counts.delivered}
          gradient="from-emerald-500 to-teal-500"
        />
        <AdminStat
          icon={XCircle}
          label="مرفوضة"
          value={counts.refused}
          gradient="from-rose-500 to-pink-500"
        />
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="mb-4 flex-wrap">
          {Object.entries(STATUS_LABEL).map(([k, m]) => (
            <TabsTrigger key={k} value={k}>
              {m.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={statusFilter}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/60 overflow-hidden">
              {ordersLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <div className="p-10">
                  <EmptyState
                    icon={Package}
                    title="لا توجد طلبيات بهذه الحالة"
                    description="اختر حالة أخرى لعرض الطلبيات."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-right">الطلبية</TableHead>
                        <TableHead className="text-right">الزبون</TableHead>
                        <TableHead className="text-right">الولاية</TableHead>
                        <TableHead className="text-right">سعر البيع</TableHead>
                        <TableHead className="text-right">ربح الإدارة</TableHead>
                        <TableHead className="text-right">ربح الوكيل</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o) => {
                        const adminProfit = Number(o.platform_price) - Number(o.cost_price ?? 0);
                        return (
                          <TableRow key={o.id} className="hover:bg-muted/30">
                            <TableCell>
                              <code className="text-xs text-muted-foreground">
                                #{o.id.slice(0, 8)}
                              </code>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{o.client_name}</p>
                              <p className="text-xs text-muted-foreground" dir="ltr">
                                {o.client_phone}
                              </p>
                            </TableCell>
                            <TableCell className="text-sm">{o.client_wilaya}</TableCell>
                            <TableCell className="font-semibold" dir="ltr">
                              {formatPrice(Number(o.selling_price))}
                            </TableCell>
                            <TableCell
                              className="text-sm text-emerald-600 dark:text-emerald-400"
                              dir="ltr"
                            >
                              {formatPrice(adminProfit)}
                            </TableCell>
                            <TableCell className="text-sm" dir="ltr">
                              {formatPrice(Number(o.reseller_profit))}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDate(o.created_at)}
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={() => setSelected(o)}>
                                معالجة
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Order action dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>معالجة الطلبية #{selected?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>{selected && STATUS_LABEL[selected.status].label}</DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              {/* Order details */}
              <div className="grid grid-cols-2 gap-2 text-sm rounded-lg border border-border/60 p-3">
                <Field label="الزبون" value={selected.client_name} />
                <Field label="الهاتف" value={selected.client_phone} ltr />
                <Field label="الولاية" value={selected.client_wilaya} />
                <Field label="العنوان" value={selected.client_address} className="col-span-2" />
                <Field
                  label="سعر البيع"
                  value={formatPrice(Number(selected.selling_price))}
                  ltr
                  bold
                />
                <Field
                  label="تكلفة المنصة"
                  value={formatPrice(Number(selected.platform_price))}
                  ltr
                />
                <Field
                  label="ربح الوكيل"
                  value={formatPrice(Number(selected.reseller_profit))}
                  ltr
                />
                <Field
                  label="ربح الإدارة"
                  value={formatPrice(
                    Number(selected.platform_price) - Number(selected.cost_price ?? 0),
                  )}
                  ltr
                />
              </div>

              {selected.tracking_number && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5" />
                  رقم التتبع الحالي:{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded">{selected.tracking_number}</code>
                </div>
              )}

              {/* Status actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium">الإجراءات المتاحة</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {STATUS_FLOW.filter((f) => f.from === selected.status).map((f) => {
                    const isShip = f.to === "shipped";
                    return (
                      <div key={f.to} className="space-y-2">
                        {isShip && (
                          <div className="space-y-1.5 sm:col-span-2">
                            <Input
                              placeholder="رقم التتبع (tracking number)"
                              value={trackingInput}
                              onChange={(e) => setTrackingInput(e.target.value)}
                              dir="ltr"
                            />
                            <Input
                              placeholder="ZR Express ID (اختياري)"
                              value={zrIdInput}
                              onChange={(e) => setZrIdInput(e.target.value)}
                              dir="ltr"
                            />
                          </div>
                        )}
                        <Button
                          onClick={() => handleStatusChange(selected, f.to)}
                          disabled={updateStatus.isPending}
                          className="w-full"
                          variant={f.to === "refused" ? "destructive" : "default"}
                        >
                          {updateStatus.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin ms-2" />
                          ) : (
                            <f.icon className="h-4 w-4 ms-2" />
                          )}
                          {f.label}
                        </Button>
                        {f.to === "delivered" && (
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            <CheckCircle2 className="inline h-3 w-3 me-1" />
                            سيتم إضافة {formatPrice(Number(selected.selling_price))} لمحفظة الوكيل
                            تلقائياً.
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {STATUS_FLOW.filter((f) => f.from === selected.status).length === 0 && (
                    <p className="text-sm text-muted-foreground col-span-2">
                      لا توجد إجراءات إضافية لهذه الحالة.
                    </p>
                  )}
                </div>
              </div>

              {selected.tracking_number && (
                <a
                  href={`https://zi.express/track/${selected.tracking_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                >
                  تتبع على ZR Express <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function Field({
  label,
  value,
  ltr,
  bold,
  className,
}: {
  label: string;
  value: string;
  ltr?: boolean;
  bold?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={`${bold ? "font-bold" : ""} ${ltr ? "text-end" : ""}`}
        dir={ltr ? "ltr" : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function AdminStat({
  icon: Icon,
  label,
  value,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  gradient: string;
}) {
  return (
    <Card className="border-border/60 overflow-hidden">
      <div className="p-3 flex items-center gap-2.5">
        <div
          className={`h-9 w-9 rounded-lg bg-gradient-to-br ${gradient} text-white grid place-items-center shrink-0`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-bold font-display" dir="ltr">
            {value.toLocaleString("fr-DZ")}
          </p>
        </div>
      </div>
    </Card>
  );
}
