import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Store as StoreIcon,
  Wallet,
  Plus,
  Trash2,
  Loader2,
  ShoppingCart,
  Check,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Img } from "@/components/ui/Img";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  useSupplyProducts,
  useMySupplyListings,
  useAddSupplyToMyStore,
  useRemoveSupplyFromMyStore,
  useBuySupplyProduct,
  useMyWallet,
  type SupplyMarketplaceProduct,
} from "@/hooks/useDropshipping";

export const Route = createFileRoute("/dashboard/marketplace")({
  component: MarketplacePage,
  head: () => ({ meta: [{ title: "سوق التوريد — Fennecly" }] }),
});

function formatPrice(n: number) {
  return `${Math.round(n).toLocaleString("fr-DZ")} DA`;
}

type Tab = "catalog" | "my-listings";

function MarketplacePage() {
  const { user } = useAuth();
  const { stores, currentStore } = useCurrentStore();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<Tab>("catalog");

  // Buy dialog
  const [buyTarget, setBuyTarget] = useState<SupplyMarketplaceProduct | null>(null);
  const [buyQty, setBuyQty] = useState(1);

  // Remove dialog
  const [removing, setRemoving] = useState<{ id: string; name: string } | null>(null);

  // Data
  const { data: products = [], isLoading: productsLoading } = useSupplyProducts(
    categoryFilter !== "all" ? { category: categoryFilter } : undefined,
  );
  const { data: myListings = [], isLoading: listingsLoading } = useMySupplyListings();
  const { data: wallet } = useMyWallet();
  const addToStore = useAddSupplyToMyStore();
  const removeListing = useRemoveSupplyFromMyStore();
  const buyProduct = useBuySupplyProduct();

  const myListingIds = useMemo(
    () => new Set(myListings.map((l) => l.supply_product_id)),
    [myListings],
  );

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (q) {
        const inName = p.name.toLowerCase().includes(q);
        const inDesc = (p.description ?? "").toLowerCase().includes(q);
        if (!inName && !inDesc) return false;
      }
      return true;
    });
  }, [products, search]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) if (p.category) s.add(p.category);
    return Array.from(s).sort();
  }, [products]);

  const totalProducts = products.length;
  const totalMyListings = myListings.length;
  const totalEarnings = Number(wallet?.total_earned ?? 0);
  const walletBalance = Number(wallet?.balance ?? 0);

  const handleAddToStore = async (p: SupplyMarketplaceProduct) => {
    if (myListingIds.has(p.id)) {
      toast.info("المنتج موجود بالفعل في متجرك");
      return;
    }
    try {
      await addToStore.mutateAsync({
        supplyProductId: p.id,
        sellingPrice: Number(p.suggested_price),
        storeId: currentStore?.id ?? null,
      });
      toast.success("تمت إضافة المنتج إلى متجرك");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleBuy = async () => {
    if (!buyTarget) return;
    try {
      await buyProduct.mutateAsync({
        supplyProductId: buyTarget.id,
        quantity: buyQty,
        storeId: currentStore?.id ?? null,
      });
      toast.success("تم الشراء بنجاح! سيتم معالجة طلبتك قريباً");
      setBuyTarget(null);
      setBuyQty(1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await removeListing.mutateAsync({ listingId: removing.id });
      toast.success("تمت إزالة المنتج من متجرك");
      setRemoving(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto" dir="rtl">
      <PageHeader
        eyebrow="Sourcing"
        title="سوق التوريد"
        description="تصفح منتجات التوريد وأضفها لمتجرك أو اشترها مباشرة"
        icon={StoreIcon}
        gradient="from-amber-500 via-orange-500 to-rose-500"
      />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <StatCard
          icon={Package}
          label="إجمالي المنتجات"
          value={totalProducts.toLocaleString("fr-DZ")}
          gradient="from-amber-500 to-orange-500"
        />
        <StatCard
          icon={Plus}
          label="منتجاتي المضافة"
          value={totalMyListings.toLocaleString("fr-DZ")}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={Wallet}
          label="رصيد المحفظة"
          value={formatPrice(walletBalance)}
          gradient="from-violet-500 to-fuchsia-500"
        />
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
        <TabsList className="mb-4">
          <TabsTrigger value="catalog">سوق التوريد</TabsTrigger>
          <TabsTrigger value="my-listings">
            منتجاتي المضافة
            {totalMyListings > 0 && (
              <Badge variant="secondary" className="ms-2">
                {totalMyListings}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* CATALOG TAB */}
        <TabsContent value="catalog">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/60">
              {/* Filter bar */}
              <div className="p-4 border-b border-border/60 flex flex-col lg:flex-row gap-3 lg:items-center">
                <div className="relative w-full lg:max-w-xs">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ابحث بالاسم أو الوصف..."
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
                  <span className="ms-auto text-sm text-muted-foreground whitespace-nowrap">
                    {filteredProducts.length} من {products.length} منتج
                  </span>
                </div>
              </div>

              {/* Grid */}
              {productsLoading ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-10">
                  <EmptyState
                    icon={Package}
                    title="لا توجد منتجات متاحة حالياً"
                    description="لم يُضف أي منتج إلى سوق التوريد بعد. تحقق لاحقاً."
                  />
                </div>
              ) : (
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      alreadyAdded={myListingIds.has(p.id)}
                      onAdd={() => handleAddToStore(p)}
                      onBuy={() => {
                        setBuyTarget(p);
                        setBuyQty(1);
                      }}
                    />
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </TabsContent>

        {/* MY LISTINGS TAB */}
        <TabsContent value="my-listings">
          <MyListingsTable
            listings={myListings}
            loading={listingsLoading}
            onRemove={(l) => setRemoving({ id: l.id, name: l.supply_product?.name ?? "المنتج" })}
          />
        </TabsContent>
      </Tabs>

      {/* Buy Dialog */}
      <Dialog
        open={!!buyTarget}
        onOpenChange={(o) => {
          if (!o) {
            setBuyTarget(null);
            setBuyQty(1);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>شراء من سوق التوريد</DialogTitle>
            <DialogDescription>تأكيد شراء المنتج من سوق التوريد</DialogDescription>
          </DialogHeader>
          {buyTarget && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-muted/30">
                <div className="h-14 w-14 rounded-lg bg-muted overflow-hidden shrink-0">
                  {buyTarget.images?.[0] ? (
                    <Img
                      src={buyTarget.images[0]}
                      alt={buyTarget.name}
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
                  <p className="font-medium text-sm line-clamp-1">{buyTarget.name}</p>
                  {buyTarget.category && (
                    <p className="text-xs text-muted-foreground">{buyTarget.category}</p>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">الكمية</label>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={buyTarget.stock}
                  value={buyQty}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (v > 0 && v <= buyTarget.stock) setBuyQty(v);
                  }}
                  dir="ltr"
                />
                <p className="text-xs text-muted-foreground">المتوفر: {buyTarget.stock}</p>
              </div>

              {/* Price */}
              <div className="rounded-lg border border-border/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">سعر الوحدة</span>
                  <span className="font-semibold" dir="ltr">
                    {formatPrice(Number(buyTarget.price))}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-border/60 pt-2">
                  <span className="text-sm font-medium">الإجمالي</span>
                  <span className="text-lg font-bold" dir="ltr">
                    {formatPrice(Number(buyTarget.price) * buyQty)}
                  </span>
                </div>
              </div>

              {/* Wallet balance */}
              <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">رصيد المحفظة</span>
                </div>
                <span
                  className={`font-semibold ${walletBalance >= Number(buyTarget.price) * buyQty ? "text-emerald-600" : "text-destructive"}`}
                  dir="ltr"
                >
                  {formatPrice(walletBalance)}
                </span>
              </div>

              {walletBalance < Number(buyTarget.price) * buyQty && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  رصيدك غير كافٍ، يرجى شحن المحفظة
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBuyTarget(null);
                setBuyQty(1);
              }}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleBuy}
              disabled={
                !buyTarget ||
                buyProduct.isPending ||
                (buyTarget ? walletBalance < Number(buyTarget.price) * buyQty : true)
              }
            >
              {buyProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <ShoppingCart className="h-4 w-4 ms-2" />
              )}
              شراء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>إزالة "{removing?.name}"؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا المنتج من متجرك. لن تتأثر طلباتك السابقة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeListing.isPending}
            >
              {removeListing.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin ms-2" />
              ) : (
                <Trash2 className="h-4 w-4 ms-2" />
              )}
              تأكيد الإزالة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
    <Card className="border-border/60 overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <div
          className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} text-white grid place-items-center shrink-0`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold font-display truncate" dir="ltr">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// Product card (catalog grid)
// ============================================================
function ProductCard({
  product,
  alreadyAdded,
  onAdd,
  onBuy,
}: {
  product: SupplyMarketplaceProduct;
  alreadyAdded: boolean;
  onAdd: () => void;
  onBuy: () => void;
}) {
  const images = (product.images ?? []) as string[];
  const price = Number(product.price);
  const suggestedPrice = Number(product.suggested_price);
  const margin = price > 0 ? ((suggestedPrice - price) / price) * 100 : 0;

  return (
    <Card className="border-border/60 overflow-hidden flex flex-col">
      {/* Image carousel */}
      <div className="relative bg-muted/40">
        {images.length === 0 ? (
          <div className="aspect-square grid place-items-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
        ) : (
          <Carousel className="w-full" opts={{ loop: images.length > 1, direction: "rtl" }}>
            <CarouselContent>
              {images.map((src, i) => (
                <CarouselItem key={`${product.id}-${i}`}>
                  <div className="aspect-square">
                    <Img src={src} alt={product.name} objectFit="cover" className="h-full w-full" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="top-1/2 -translate-y-1/2 start-2" />
                <CarouselNext className="top-1/2 -translate-y-1/2 end-2" />
              </>
            )}
          </Carousel>
        )}
        {alreadyAdded && (
          <Badge className="absolute top-2 end-2 bg-emerald-500/95 text-white border-0">
            <Check className="h-3 w-3 me-1" /> مضاف لمتجري
          </Badge>
        )}
        {product.stock <= 0 && (
          <Badge className="absolute top-2 start-2 bg-rose-500/95 text-white border-0">
            نفد المخزون
          </Badge>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1 min-w-0">
            {product.name}
          </h3>
        </div>
        {product.category && (
          <Badge variant="outline" className="self-start font-normal text-xs">
            {product.category}
          </Badge>
        )}

        <div className="flex items-end justify-between mt-1">
          <div>
            <p className="text-[11px] text-muted-foreground">تكلفتك</p>
            <p className="text-lg font-bold font-display" dir="ltr">
              {formatPrice(price)}
            </p>
          </div>
          <div className="text-end">
            <p className="text-[11px] text-muted-foreground">السعر المقترح</p>
            <p className="text-sm font-semibold text-primary" dir="ltr">
              {formatPrice(suggestedPrice)}
            </p>
          </div>
        </div>

        {product.supplier_name && (
          <p className="text-xs text-muted-foreground">المورد: {product.supplier_name}</p>
        )}

        <div className="flex gap-2 mt-2">
          <Button
            onClick={onAdd}
            disabled={alreadyAdded || product.stock <= 0}
            className="flex-1"
            variant={alreadyAdded ? "outline" : "default"}
          >
            {alreadyAdded ? (
              <>
                <Check className="h-4 w-4 ms-2" /> مضاف
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 ms-2" /> إضافة للمتجر
              </>
            )}
          </Button>
          <Button onClick={onBuy} disabled={product.stock <= 0} variant="outline" className="px-3">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// My listings table
// ============================================================
function MyListingsTable({
  listings,
  loading,
  onRemove,
}: {
  listings: {
    id: string;
    selling_price: number;
    is_active: boolean;
    created_at: string;
    supply_product: {
      id: string;
      name: string;
      images: string[];
      price: number;
      suggested_price: number;
      category: string | null;
      stock: number;
    } | null;
  }[];
  loading: boolean;
  onRemove: (l: { id: string; supply_product: { name: string } | null }) => void;
}) {
  if (loading) {
    return (
      <Card className="border-border/60 p-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="border-border/60">
        <EmptyState
          icon={StoreIcon}
          title="لا توجد منتجات مضافة"
          description="تصفح سوق التوريد وأضف منتجات لمتجرك لتظهر هنا."
        />
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">المنتج</TableHead>
                <TableHead className="text-right">سعر شرائك</TableHead>
                <TableHead className="text-right">سعر البيع</TableHead>
                <TableHead className="text-right">الربح المحتمل</TableHead>
                <TableHead className="text-right">المخزون</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => {
                const p = l.supply_product;
                const cost = Number(p?.price ?? 0);
                const selling = Number(l.selling_price);
                const profit = selling - cost;

                return (
                  <TableRow key={l.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                          {p?.images?.[0] ? (
                            <Img
                              src={p.images[0]}
                              alt={p.name}
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
                          <p className="font-medium text-sm line-clamp-1">{p?.name ?? "—"}</p>
                          {p?.category && (
                            <p className="text-xs text-muted-foreground">{p.category}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" dir="ltr">
                      {formatPrice(cost)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold" dir="ltr">
                      {formatPrice(selling)}
                    </TableCell>
                    <TableCell
                      className={`text-sm font-semibold ${profit > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                      dir="ltr"
                    >
                      {formatPrice(profit)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p && p.stock > 0 ? "default" : "destructive"}>
                        {p?.stock ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.is_active ? "default" : "secondary"}>
                        {l.is_active ? "نشط" : "متوقف"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => onRemove(l)}
                        title="إزالة من المتجر"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    </motion.div>
  );
}
