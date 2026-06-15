import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet,
  ShieldAlert,
  Loader2,
  Check,
  X,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAdminTopupRequests,
  useAdminApproveTopup,
  useAdminRejectTopup,
  type WalletTopupRequest,
} from "@/hooks/useDropshipping";

export const Route = createFileRoute("/dashboard/admin/wallet-topups")({
  component: AdminWalletTopupsPage,
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

function AdminWalletTopupsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [decideTarget, setDecideTarget] = useState<{
    req: WalletTopupRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [adminNote, setAdminNote] = useState("");

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
          console.error("[AdminWalletTopups] user_roles query error:", error.message);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data && data.length > 0);
        }
      } catch (e) {
        console.error(
          "[AdminWalletTopups] Admin check failed:",
          e instanceof Error ? e.message : e,
        );
        setIsAdmin(false);
      }
    })();
  }, [user]);

  const { data: requests = [], isLoading } = useAdminTopupRequests(filter);
  const approve = useAdminApproveTopup();
  const reject = useAdminRejectTopup();

  const getAccessToken = async (): Promise<string> => {
    const { data } = await supabase.auth.getSession();
    const t = data.session?.access_token;
    if (!t) throw new Error("Not signed in");
    return t;
  };

  const handleDecide = async () => {
    if (!decideTarget) return;
    try {
      const accessToken = await getAccessToken();
      if (decideTarget.action === "approve") {
        await approve.mutateAsync({
          requestId: decideTarget.req.id,
          adminNote: adminNote.trim() || undefined,
          accessToken,
        });
        toast.success("تمت الموافقة على التعبئة وإضافة الرصيد للمحفظة");
      } else {
        await reject.mutateAsync({
          requestId: decideTarget.req.id,
          adminNote: adminNote.trim() || undefined,
          accessToken,
        });
        toast.success("تم رفض طلب التعبئة");
      }
      setDecideTarget(null);
      setAdminNote("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const totalPending = requests
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + Number(r.amount), 0);

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
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <PageHeader
        eyebrow="Admin"
        title="طلبات تعبئة المحفظة"
        description="مراجعة طلبات تعبئة محافظ الوكلاء والموافقة عليها"
        icon={Wallet}
        gradient="from-violet-500 via-purple-500 to-fuchsia-500"
      />

      {filter === "pending" && totalPending > 0 && (
        <Card className="p-4 mb-4 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm">
              يوجد {requests.length} طلباً قيد المراجعة بإجمالي{" "}
              <strong className="font-bold">{formatPrice(totalPending)}</strong>
            </p>
          </div>
        </Card>
      )}

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            <Clock className="h-3.5 w-3.5 me-1" /> قيد المراجعة
          </TabsTrigger>
          <TabsTrigger value="approved">
            <CheckCircle2 className="h-3.5 w-3.5 me-1" /> موافق عليها
          </TabsTrigger>
          <TabsTrigger value="rejected">
            <XCircle className="h-3.5 w-3.5 me-1" /> مرفوضة
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/60 shadow-soft overflow-hidden">
              {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : requests.length === 0 ? (
                <div className="p-10">
                  <EmptyState
                    icon={Wallet}
                    title="لا توجد طلبات"
                    description="ستظهر طلبات تعبئة محافظ الوكلاء هنا."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-right">الوكيل</TableHead>
                        <TableHead className="text-right">المبلغ</TableHead>
                        <TableHead className="text-right">مرجع الدفع</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        {filter !== "pending" && (
                          <TableHead className="text-right">الملاحظة</TableHead>
                        )}
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requests.map((r) => (
                        <TableRow key={r.id} className="hover:bg-muted/30">
                          <TableCell>
                            <code className="text-xs text-muted-foreground">
                              {r.reseller_id.slice(0, 8)}
                            </code>
                          </TableCell>
                          <TableCell className="font-bold" dir="ltr">
                            {formatPrice(Number(r.amount))}
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {r.payment_reference}
                            </code>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(r.created_at)}
                          </TableCell>
                          <TableCell>
                            {r.status === "pending" && (
                              <Badge
                                variant="outline"
                                className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                              >
                                <Clock className="h-3 w-3 me-1" /> قيد المراجعة
                              </Badge>
                            )}
                            {r.status === "approved" && (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                              >
                                <CheckCircle2 className="h-3 w-3 me-1" /> موافق
                              </Badge>
                            )}
                            {r.status === "rejected" && (
                              <Badge
                                variant="outline"
                                className="border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400"
                              >
                                <XCircle className="h-3 w-3 me-1" /> مرفوض
                              </Badge>
                            )}
                          </TableCell>
                          {filter !== "pending" && (
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {r.admin_note ?? "—"}
                            </TableCell>
                          )}
                          <TableCell>
                            {r.status === "pending" ? (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  onClick={() => setDecideTarget({ req: r, action: "approve" })}
                                  disabled={approve.isPending}
                                >
                                  <Check className="h-3.5 w-3.5 ms-1" /> موافقة
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDecideTarget({ req: r, action: "reject" })}
                                  disabled={reject.isPending}
                                >
                                  <X className="h-3.5 w-3.5 ms-1" /> رفض
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {r.processed_at ? formatDate(r.processed_at) : "—"}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Approve / Reject dialog */}
      <Dialog open={!!decideTarget} onOpenChange={(o) => !o && setDecideTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decideTarget?.action === "approve"
                ? "الموافقة على تعبئة المحفظة"
                : "رفض طلب التعبئة"}
            </DialogTitle>
            <DialogDescription>
              {decideTarget && (
                <>
                  الوكيل:{" "}
                  <code className="text-xs">{decideTarget.req.reseller_id.slice(0, 8)}</code>
                  {" • "}
                  المبلغ:{" "}
                  <strong className="font-bold">
                    {formatPrice(Number(decideTarget.req.amount))}
                  </strong>
                  {" • "}
                  المرجع:{" "}
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    {decideTarget.req.payment_reference}
                  </code>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">ملاحظة (اختياري)</label>
            <Input
              placeholder={
                decideTarget?.action === "approve"
                  ? "مثال: تم التحقق من التحويل"
                  : "مثال: المبلغ غير مطابق، يرجى إعادة المحاولة"
              }
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDecideTarget(null)}
              disabled={approve.isPending || reject.isPending}
            >
              إلغاء
            </Button>
            {decideTarget?.action === "approve" ? (
              <Button onClick={handleDecide} disabled={approve.isPending}>
                {approve.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                ) : (
                  <Check className="h-4 w-4 ms-2" />
                )}
                تأكيد الموافقة
              </Button>
            ) : (
              <Button onClick={handleDecide} variant="destructive" disabled={reject.isPending}>
                {reject.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                ) : (
                  <X className="h-4 w-4 ms-2" />
                )}
                تأكيد الرفض
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
