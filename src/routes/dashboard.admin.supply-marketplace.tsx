import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Package,
  ShieldAlert,
  Loader2,
  Search,
  Plus,
  Pencil,
  Trash2,
  ImageIcon,
  Upload,
  X,
  Store,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Img } from "@/components/ui/Img";
import { Switch } from "@/components/ui/switch";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  useAdminSupplyProducts,
  useAdminCreateSupplyProduct,
  useAdminUpdateSupplyProduct,
  useAdminDeleteSupplyProduct,
  useAdminSupplyOrders,
  useAdminUpdateSupplyOrderStatus,
  type SupplyMarketplaceProduct,
  type SupplyOrder,
} from "@/hooks/useDropshipping";

export const Route = createFileRoute("/dashboard/admin/supply-marketplace")({
  component: AdminSupplyMarketplacePage,
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

const CATEGORIES = [
  "Apparel",
  "Accessories",
  "Home",
  "Beauty",
  "Electronics",
  "Food & Drink",
  "Other",
];

const ORDER_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending: {
    label: "بانتظار المعالجة",
    color: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  processing: {
    label: "قيد المعالجة",
    color: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
  },
  shipped: {
    label: "تم الشحن",
    color: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  delivered: {
    label: "تم التسليم",
    color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  cancelled: {
    label: "ملغي",
    color: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  },
};

function AdminSupplyMarketplacePage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Dialogs
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplyMarketplaceProduct | null>(null);
  const [deleting, setDeleting] = useState<SupplyMarketplaceProduct | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<
    | (SupplyOrder & {
        supply_product: {
          id: string;
          name: string;
          images: string[];
          category: string | null;
        } | null;
      })
    | null
  >(null);

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
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data && data.length > 0);
        }
      } catch {
        setIsAdmin(false);
      }
    })();
  }, [user]);

  const filters = useMemo(
    () => ({
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: search.trim() || undefined,
    }),
    [categoryFilter, statusFilter, search],
  );

  const { data: products = [], isLoading: productsLoading } = useAdminSupplyProducts(filters);
  const { data: orders = [], isLoading: ordersLoading } = useAdminSupplyOrders();
  const createProduct = useAdminCreateSupplyProduct();
  const updateProduct = useAdminUpdateSupplyProduct();
  const deleteProduct = useAdminDeleteSupplyProduct();
  const updateOrderStatus = useAdminUpdateSupplyOrderStatus();

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) if (p.category) s.add(p.category);
    return Array.from(s).sort();
  }, [products]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.status === "active").length,
      inactive: products.filter((p) => p.status === "inactive").length,
      totalStock: products.reduce((s, p) => s + (p.stock ?? 0), 0),
      pendingOrders: orders.filter((o) => o.status === "pending").length,
    }),
    [products, orders],
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p: SupplyMarketplaceProduct) => {
    setEditing(p);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduct.mutateAsync({ id: deleting.id });
      toast.success("تم حذف المنتج بنجاح");
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleOrderStatus = async (order: SupplyOrder, newStatus: string) => {
    try {
      await updateOrderStatus.mutateAsync({
        orderId: order.id,
        status: newStatus as "pending" | "processing" | "shipped" | "delivered" | "cancelled",
      });
      toast.success(`تم تحديث الحالة إلى "${ORDER_STATUS_LABEL[newStatus]?.label}"`);
      setSelectedOrder(null);
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
        title="سوق التوريد"
        description="إدارة منتجات سوق التوريد المتاحة ل أصحاب المتاجر"
        icon={Store}
        gradient="from-amber-500 via-orange-500 to-rose-500"
        actions={
          activeTab === "products" ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 ms-2" /> إضافة منتج
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
        <StatCard
          icon={Package}
          label="إجمالي المنتجات"
          value={stats.total}
          gradient="from-amber-500 to-orange-500"
        />
        <StatCard
          icon={Package}
          label="نشطة"
          value={stats.active}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={Package}
          label="غير نشطة"
          value={stats.inactive}
          gradient="from-zinc-500 to-slate-500"
        />
        <StatCard
          icon={Tag}
          label="إجمالي المخزون"
          value={stats.totalStock}
          gradient="from-violet-500 to-fuchsia-500"
        />
        <StatCard
          icon={Store}
          label="طلبيات بانتظار"
          value={stats.pendingOrders}
          gradient="from-rose-500 to-pink-500"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "products" | "orders")}>
        <TabsList className="mb-4">
          <TabsTrigger value="products">المنتجات</TabsTrigger>
          <TabsTrigger value="orders">الطلبيات</TabsTrigger>
        </TabsList>

        {/* PRODUCTS TAB */}
        <TabsContent value="products">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/60 shadow-soft overflow-hidden">
              {/* Filters */}
              <div className="p-4 border-b border-border/60 flex flex-col lg:flex-row gap-3 lg:items-center">
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم..."
                    className="pr-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="كل الفئات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الفئات</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="ms-auto text-sm text-muted-foreground whitespace-nowrap">
                    {products.length} منتج
                  </span>
                </div>
              </div>

              {/* Table */}
              {productsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : products.length === 0 ? (
                <div className="p-10">
                  <EmptyState
                    icon={Package}
                    title="لا توجد منتجات"
                    description="لم يُضف أي منتج إلى سوق التوريد بعد."
                    action={
                      <Button onClick={openCreate}>
                        <Plus className="h-4 w-4 ms-2" /> إضافة منتج
                      </Button>
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">السعر</TableHead>
                        <TableHead className="text-right">سعر البيع المقترح</TableHead>
                        <TableHead className="text-right">المخزون</TableHead>
                        <TableHead className="text-right">الفئة</TableHead>
                        <TableHead className="text-right">المورد</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="w-[120px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((p) => (
                        <TableRow key={p.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                                {p.images?.[0] ? (
                                  <Img
                                    src={p.images[0]}
                                    alt={p.name}
                                    width={80}
                                    quality={70}
                                    objectFit="contain"
                                    className="h-full w-full"
                                  />
                                ) : (
                                  <div className="h-full w-full grid place-items-center">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                                {p.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {p.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold" dir="ltr">
                            {formatPrice(Number(p.price))}
                          </TableCell>
                          <TableCell className="text-sm" dir="ltr">
                            {formatPrice(Number(p.suggested_price))}
                          </TableCell>
                          <TableCell>
                            <Badge variant={p.stock > 0 ? "default" : "destructive"}>
                              {p.stock}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{p.category ?? "—"}</TableCell>
                          <TableCell className="text-sm">{p.supplier_name ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === "active" ? "default" : "secondary"}>
                              {p.status === "active" ? "نشط" : "غير نشط"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(p)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => setDeleting(p)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

        {/* ORDERS TAB */}
        <TabsContent value="orders">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/60 shadow-soft overflow-hidden">
              {ordersLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : orders.length === 0 ? (
                <div className="p-10">
                  <EmptyState
                    icon={Store}
                    title="لا توجد طلبيات"
                    description="لم تُسجل أي طلبية من سوق التوريد بعد."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-right">رقم الطلبية</TableHead>
                        <TableHead className="text-right">المنتج</TableHead>
                        <TableHead className="text-right">الكمية</TableHead>
                        <TableHead className="text-right">السعر الإجمالي</TableHead>
                        <TableHead className="text-right">التاريخ</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((o) => (
                        <TableRow key={o.id} className="hover:bg-muted/30">
                          <TableCell>
                            <code className="text-xs text-muted-foreground">
                              #{o.id.slice(0, 8)}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded bg-muted overflow-hidden shrink-0">
                                {o.supply_product?.images?.[0] ? (
                                  <Img
                                    src={o.supply_product.images[0]}
                                    alt=""
                                    width={64}
                                    quality={60}
                                    objectFit="contain"
                                    className="h-full w-full"
                                  />
                                ) : (
                                  <div className="h-full w-full grid place-items-center">
                                    <ImageIcon className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <span className="text-sm font-medium">
                                {o.supply_product?.name ?? "—"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm" dir="ltr">
                            {o.quantity}
                          </TableCell>
                          <TableCell className="font-semibold" dir="ltr">
                            {formatPrice(Number(o.total_price))}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(o.created_at)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={ORDER_STATUS_LABEL[o.status]?.color ?? ""}
                            >
                              {ORDER_STATUS_LABEL[o.status]?.label ?? o.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => setSelectedOrder(o)}>
                              معالجة
                            </Button>
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

      {/* Create/Edit Product Dialog */}
      <SupplyProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        onCreate={async (data) => {
          try {
            await createProduct.mutateAsync(data);
            toast.success("تم إضافة المنتج بنجاح");
            setFormOpen(false);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
          }
        }}
        onUpdate={async (data) => {
          try {
            await updateProduct.mutateAsync(data);
            toast.success("تم تحديث المنتج بنجاح");
            setFormOpen(false);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
          }
        }}
        submitting={createProduct.isPending || updateProduct.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف "{deleting?.name}"؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا المنتج نهائياً من سوق التوريد. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <Trash2 className="h-4 w-4 ms-2" />
              )}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Status Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(o) => !o && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>معالجة الطلبية #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            <DialogDescription>
              {selectedOrder && ORDER_STATUS_LABEL[selectedOrder.status]?.label}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm rounded-lg border border-border/60 p-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">المنتج</p>
                  <p className="font-medium">{selectedOrder.supply_product?.name ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">الكمية</p>
                  <p dir="ltr" className="text-end">
                    {selectedOrder.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">سعر الوحدة</p>
                  <p dir="ltr" className="text-end font-semibold">
                    {formatPrice(Number(selectedOrder.unit_price))}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">الإجمالي</p>
                  <p dir="ltr" className="text-end font-bold">
                    {formatPrice(Number(selectedOrder.total_price))}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">تحديث الحالة</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedOrder.status === "pending" && (
                    <Button
                      onClick={() => handleOrderStatus(selectedOrder, "processing")}
                      className="w-full"
                    >
                      <Loader2 className="h-4 w-4 ms-2" /> بدء المعالجة
                    </Button>
                  )}
                  {selectedOrder.status === "processing" && (
                    <Button
                      onClick={() => handleOrderStatus(selectedOrder, "shipped")}
                      className="w-full"
                    >
                      <Package className="h-4 w-4 ms-2" /> تم الشحن
                    </Button>
                  )}
                  {selectedOrder.status === "shipped" && (
                    <Button
                      onClick={() => handleOrderStatus(selectedOrder, "delivered")}
                      className="w-full"
                    >
                      <Package className="h-4 w-4 ms-2" /> تم التسليم
                    </Button>
                  )}
                  {["pending", "processing"].includes(selectedOrder.status) && (
                    <Button
                      variant="destructive"
                      onClick={() => handleOrderStatus(selectedOrder, "cancelled")}
                      className="w-full"
                    >
                      <X className="h-4 w-4 ms-2" /> إلغاء
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Supply Product Form Dialog
// ============================================================
function SupplyProductFormDialog({
  open,
  onOpenChange,
  editing,
  onCreate,
  onUpdate,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: SupplyMarketplaceProduct | null;
  onCreate: (data: {
    name: string;
    description?: string;
    images?: string[];
    price: number;
    suggested_price: number;
    category?: string;
    stock?: number;
    supplier_name?: string;
    status?: "active" | "inactive";
  }) => Promise<void>;
  onUpdate: (data: {
    id: string;
    name?: string;
    description?: string | null;
    images?: string[];
    price?: number;
    suggested_price?: number;
    category?: string | null;
    stock?: number;
    supplier_name?: string | null;
    status?: "active" | "inactive";
  }) => Promise<void>;
  submitting: boolean;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setPrice(String(editing.price));
      setSuggestedPrice(String(editing.suggested_price));
      setCategory(editing.category ?? "");
      setStock(String(editing.stock));
      setSupplierName(editing.supplier_name ?? "");
      setStatus(editing.status as "active" | "inactive");
      setImages(editing.images ?? []);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setSuggestedPrice("");
      setCategory("");
      setStock("");
      setSupplierName("");
      setStatus("active");
      setImages([]);
    }
  }, [editing, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (images.length >= 10) break;
        const path = `admin/${Date.now()}-${file.name}`;
        const { error } = await supabase.storage
          .from("supply-product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("supply-product-images").getPublicUrl(path);
        if (data.publicUrl) setImages((prev) => [...prev, data.publicUrl]);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل رفع الصورة");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async () => {
    const n = name.trim();
    const p = Number(price);
    const sp = Number(suggestedPrice);
    const s = Number(stock) || 0;
    if (!n) {
      toast.error("اسم المنتج مطلوب");
      return;
    }
    if (!Number.isFinite(p) || p < 0) {
      toast.error("السعر غير صالح");
      return;
    }
    if (!Number.isFinite(sp) || sp < 0) {
      toast.error("سعر البيع المقترح غير صالح");
      return;
    }

    if (editing) {
      await onUpdate({
        id: editing.id,
        name: n,
        description: description.trim() || null,
        images,
        price: p,
        suggested_price: sp,
        category: category || null,
        stock: s,
        supplier_name: supplierName.trim() || null,
        status,
      });
    } else {
      await onCreate({
        name: n,
        description: description.trim() || undefined,
        images,
        price: p,
        suggested_price: sp,
        category: category || undefined,
        stock: s,
        supplier_name: supplierName.trim() || undefined,
        status,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "تعديل المنتج" : "إضافة منتج جديد"}</DialogTitle>
          <DialogDescription>
            {editing ? "عدّل بيانات المنتج في سوق التوريد" : "أضف منتجاً جديداً إلى سوق التوريد"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Images */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              صور المنتج ({images.length}/10)
            </label>
            <div className="flex flex-wrap gap-2">
              {images.map((src, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 rounded-lg overflow-hidden border border-border/60 group"
                >
                  <Img
                    src={src}
                    alt=""
                    width={160}
                    quality={80}
                    objectFit="contain"
                    className="h-full w-full"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 left-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="h-20 w-20 rounded-lg border-2 border-dashed border-border/60 grid place-items-center cursor-pointer hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">اسم المنتج *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم المنتج"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">الوصف</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف المنتج..."
              rows={3}
            />
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">التكلفة (السعر) *</label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pe-12"
                  dir="ltr"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DA
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">سعر البيع المقترح *</label>
              <div className="relative">
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={suggestedPrice}
                  onChange={(e) => setSuggestedPrice(e.target.value)}
                  className="pe-12"
                  dir="ltr"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  DA
                </span>
              </div>
            </div>
          </div>

          {/* Stock + Category + Supplier */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المخزون</label>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">الفئة</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">المورد</label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="اسم المورد"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">الحالة</label>
            <Switch
              checked={status === "active"}
              onCheckedChange={(v) => setStatus(v ? "active" : "inactive")}
            />
            <span className="text-sm text-muted-foreground">
              {status === "active" ? "نشط" : "غير نشط"}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin ms-2" /> : null}
            {editing ? "حفظ التعديلات" : "إضافة المنتج"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Stat Card
// ============================================================
function StatCard({
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
    <Card className="border-border/60 shadow-soft overflow-hidden">
      <div className="p-3 flex items-center gap-2.5">
        <div
          className={`h-9 w-9 rounded-lg bg-gradient-to-br ${gradient} text-white grid place-items-center shadow-sm shrink-0`}
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
