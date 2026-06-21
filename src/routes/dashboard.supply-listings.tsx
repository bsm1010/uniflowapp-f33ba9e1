import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Store,
  Loader2,
  Search,
  Pencil,
  Trash2,
  ImageIcon,
  Package,
  Eye,
  EyeOff,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Img } from "@/components/ui/Img";
import { Switch } from "@/components/ui/switch";
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
  useMySupplyListings,
  useUpdateSupplyListing,
  useRemoveSupplyFromMyStore,
  type UserSupplyListing,
} from "@/hooks/useDropshipping";

export const Route = createFileRoute("/dashboard/supply-listings")({
  component: SupplyListingsPage,
  head: () => ({ meta: [{ title: "منتجات التوريد — Fennecly" }] }),
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

type ListingWithProduct = UserSupplyListing & {
  supply_product: {
    id: string;
    name: string;
    images: string[];
    price: number;
    suggested_price: number;
    category: string | null;
    stock: number;
  } | null;
};

function SupplyListingsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [editListing, setEditListing] = useState<ListingWithProduct | null>(null);
  const [deleteListing, setDeleteListing] = useState<ListingWithProduct | null>(null);

  const { data: listings = [], isLoading } = useMySupplyListings();
  const updateListing = useUpdateSupplyListing();
  const removeListing = useRemoveSupplyFromMyStore();

  const filtered = useMemo(() => {
    if (!search.trim()) return listings;
    const q = search.trim().toLowerCase();
    return listings.filter(
      (l) =>
        l.supply_product?.name?.toLowerCase().includes(q) ||
        l.supply_product?.category?.toLowerCase().includes(q),
    );
  }, [listings, search]);

  const stats = useMemo(
    () => ({
      total: listings.length,
      active: listings.filter((l) => l.is_active).length,
      inactive: listings.filter((l) => !l.is_active).length,
    }),
    [listings],
  );

  const handleToggleActive = async (listing: ListingWithProduct) => {
    try {
      await updateListing.mutateAsync({
        listingId: listing.id,
        is_active: !listing.is_active,
      });
      toast.success(listing.is_active ? "تم إخفاء المنتج" : "تم تفعيل المنتج");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleRemove = async () => {
    if (!deleteListing) return;
    try {
      await removeListing.mutateAsync({ listingId: deleteListing.id });
      toast.success("تم حذف المنتج من متجرك");
      setDeleteListing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <PageHeader
        eyebrow="Supply"
        title="منتجات التوريد في متجرك"
        description="إدارة منتجات سوق التوريد التي أضفتها إلى متجرك"
        icon={Store}
        gradient="from-amber-500 via-orange-500 to-rose-500"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <Card className="border-border/60 overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white grid place-items-center shrink-0">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">إجمالي</p>
              <p className="text-lg font-bold font-display" dir="ltr">
                {stats.total.toLocaleString("fr-DZ")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/60 overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white grid place-items-center shrink-0">
              <Eye className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">نشط</p>
              <p className="text-lg font-bold font-display" dir="ltr">
                {stats.active.toLocaleString("fr-DZ")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="border-border/60 overflow-hidden">
          <div className="p-3 flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-zinc-500 to-slate-500 text-white grid place-items-center shrink-0">
              <EyeOff className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground truncate">مخفي</p>
              <p className="text-lg font-bold font-display" dir="ltr">
                {stats.inactive.toLocaleString("fr-DZ")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-border/60 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-border/60 flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الفئة..."
              className="pr-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="ms-auto text-sm text-muted-foreground whitespace-nowrap">
            {filtered.length} من {listings.length} منتج
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10">
            <EmptyState
              icon={Store}
              title={search ? "لا توجد نتائج" : "لا توجد منتجات في متجرك"}
              description={
                search ? "جرّب تعديل كلمة البحث" : "أضف منتجات من سوق التوريد لتظهر هنا."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-right text-sm font-medium p-3">المنتج</th>
                  <th className="text-right text-sm font-medium p-3">ثمن التوريد</th>
                  <th className="text-right text-sm font-medium p-3">ثمن البيع</th>
                  <th className="text-right text-sm font-medium p-3">الفئة</th>
                  <th className="text-right text-sm font-medium p-3">المخزون</th>
                  <th className="text-right text-sm font-medium p-3">الحالة</th>
                  <th className="text-right text-sm font-medium p-3">أضيف</th>
                  <th className="w-[120px]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => {
                  const product = l.supply_product;
                  return (
                    <tr key={l.id} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                            {product?.images?.[0] ? (
                              <Img
                                src={product.images[0]}
                                alt={product.name}
                                objectFit="cover"
                                className="h-full w-full"
                              />
                            ) : (
                              <div className="h-full w-full grid place-items-center">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm line-clamp-1">
                              {product?.name ?? "—"}
                            </p>
                            {product?.category && (
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm" dir="ltr">
                        {formatPrice(Number(product?.price ?? 0))}
                      </td>
                      <td className="p-3 font-semibold" dir="ltr">
                        {formatPrice(Number(l.selling_price))}
                      </td>
                      <td className="p-3 text-sm">{product?.category ?? "—"}</td>
                      <td className="p-3">
                        <Badge variant={(product?.stock ?? 0) > 0 ? "default" : "destructive"}>
                          {product?.stock ?? 0}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={l.is_active ? "default" : "secondary"}>
                          {l.is_active ? "نشط" : "مخفي"}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {formatDate(l.created_at)}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title={l.is_active ? "إخفاء" : "إظهار"}
                            onClick={() => handleToggleActive(l)}
                            disabled={updateListing.isPending}
                          >
                            {l.is_active ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditListing(l)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteListing(l)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Price Dialog */}
      <EditPriceDialog
        listing={editListing}
        onClose={() => setEditListing(null)}
        onSave={async (newPrice) => {
          if (!editListing) return;
          try {
            await updateListing.mutateAsync({
              listingId: editListing.id,
              selling_price: newPrice,
            });
            toast.success("تم تحديث السعر بنجاح");
            setEditListing(null);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed");
          }
        }}
        saving={updateListing.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteListing} onOpenChange={(o) => !o && setDeleteListing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              حذف "{deleteListing?.supply_product?.name}" من متجرك؟
            </AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إزالة هذا المنتج من متجرك. يمكنك إعادة إضافته لاحقاً من سوق التوريد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeListing.isPending}
            >
              {removeListing.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <Trash2 className="h-4 w-4 ms-2" />
              )}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Edit Price Dialog
// ============================================================
function EditPriceDialog({
  listing,
  onClose,
  onSave,
  saving,
}: {
  listing: ListingWithProduct | null;
  onClose: () => void;
  onSave: (newPrice: number) => void;
  saving: boolean;
}) {
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (listing) {
      setPrice(String(listing.selling_price));
    }
  }, [listing]);

  const handleSubmit = () => {
    const p = Number(price);
    if (!Number.isFinite(p) || p < 0) {
      toast.error("السعر غير صالح");
      return;
    }
    onSave(p);
  };

  return (
    <Dialog open={!!listing} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تعديل سعر البيع</DialogTitle>
          <DialogDescription>{listing?.supply_product?.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border/60 p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ثمن التوريد</span>
              <span dir="ltr" className="font-semibold">
                {formatPrice(Number(listing?.supply_product?.price ?? 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">سعر البيع المقترح</span>
              <span dir="ltr">
                {formatPrice(Number(listing?.supply_product?.suggested_price ?? 0))}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">ثمن البيع (دج)</label>
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
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            إلغاء
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin ms-2" />}
            حفظ التعديلات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
