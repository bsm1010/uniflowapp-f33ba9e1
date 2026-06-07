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
  Pause,
  Play,
  ImageIcon,
  AlertTriangle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Pencil,
  Check,
  X as XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore, type Store } from "@/hooks/use-current-store";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useMarketplaceProducts,
  useMyResellerListings,
  useAddToMyStore,
  useUpdateMyListing,
  useRemoveMyListing,
  useMyWallet,
  type MarketplaceProduct,
  type ResellerListingWithProduct,
} from "@/hooks/useDropshipping";

export const Route = createFileRoute("/dashboard/marketplace")({
  component: MarketplacePage,
  head: () => ({ meta: [{ title: "Marketplace — Fennecly" }] }),
});

function formatPrice(n: number) {
  return `${Math.round(n).toLocaleString("fr-DZ")} DA`;
}

type RiskFilter = "all" | "low" | "medium" | "high";
type Tab = "catalog" | "my-listings";

function inRiskBucket(rate: number, bucket: RiskFilter) {
  if (bucket === "low") return rate < 10;
  if (bucket === "medium") return rate >= 10 && rate <= 25;
  if (bucket === "high") return rate > 25;
  return true;
}

function returnRateBadge(rate: number) {
  if (rate < 10) {
    return {
      label: `${rate.toFixed(1)}%`,
      className:
        "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    };
  }
  if (rate <= 25) {
    return {
      label: `${rate.toFixed(1)}%`,
      className:
        "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    };
  }
  return {
    label: `${rate.toFixed(1)}%`,
    className:
      "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  };
}

function MarketplacePage() {
  const { user } = useAuth();
  const { stores, currentStore } = useCurrentStore();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [notAddedOnly, setNotAddedOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("catalog");

  // Add-to-store slide-over
  const [addTarget, setAddTarget] = useState<MarketplaceProduct | null>(null);
  const [addStoreId, setAddStoreId] = useState<string>("");
  const [addPriceInput, setAddPriceInput] = useState<string>("");
  const [addSellingPrice, setAddSellingPrice] = useState<number>(0);
  const [marginPercent, setMarginPercent] = useState<number>(50);

  // Remove dialog
  const [removing, setRemoving] = useState<ResellerListingWithProduct | null>(null);

  // Data
  const serverFilters = useMemo(() => {
    const f: { category?: string; maxReturnRate?: number } = {};
    if (categoryFilter !== "all") f.category = categoryFilter;
    if (riskFilter === "low") f.maxReturnRate = 9.99;
    return f;
  }, [categoryFilter, riskFilter]);

  const { data: products = [], isLoading: productsLoading } =
    useMarketplaceProducts(serverFilters);
  const { data: myListings = [], isLoading: listingsLoading } =
    useMyResellerListings();
  const { data: wallet } = useMyWallet();
  const addToStore = useAddToMyStore();
  const updateListing = useUpdateMyListing();
  const removeListing = useRemoveMyListing();

  const myListingIds = useMemo(
    () => new Set(myListings.map((l) => l.marketplace_product_id)),
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
      if (!inRiskBucket(Number(p.return_rate_percent ?? 0), riskFilter)) {
        return false;
      }
      if (notAddedOnly && myListingIds.has(p.id)) return false;
      return true;
    });
  }, [products, search, riskFilter, notAddedOnly, myListingIds]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const p of products) if (p.category) s.add(p.category);
    return Array.from(s).sort();
  }, [products]);

  // Open the slide-over and seed defaults
  const openAdd = (p: MarketplaceProduct) => {
    const platform = Number(p.platform_price);
    const defaultPrice = Math.round(platform * 1.5);
    setAddTarget(p);
    setAddStoreId(currentStore?.id ?? stores[0]?.id ?? "");
    setAddPriceInput(String(defaultPrice));
    setAddSellingPrice(defaultPrice);
    setMarginPercent(50);
  };

  // Keep the slider in sync with the input
  const handlePriceInput = (raw: string) => {
    setAddPriceInput(raw);
    const v = Number(raw);
    if (Number.isFinite(v) && addTarget) {
      const platform = Number(addTarget.platform_price);
      setAddSellingPrice(v);
      if (platform > 0) {
        const m = Math.round(((v - platform) / platform) * 100);
        setMarginPercent(Math.max(0, Math.min(300, m)));
      }
    }
  };

  const handleMarginChange = (v: number) => {
    if (!addTarget) return;
    setMarginPercent(v);
    const platform = Number(addTarget.platform_price);
    const next = Math.round(platform * (1 + v / 100));
    setAddSellingPrice(next);
    setAddPriceInput(String(next));
  };

  const confirmAdd = async () => {
    if (!addTarget) return;
    try {
      await addToStore.mutateAsync({
        marketplaceProductId: addTarget.id,
        sellingPrice: addSellingPrice,
        storeId: addStoreId || null,
      });
      toast.success(`تمت إضافة "${addTarget.name}" لمتجرك`);
      setAddTarget(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add product");
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const name = removing.marketplace_product?.name ?? "المنتج";
    try {
      await removeListing.mutateAsync({ listingId: removing.id });
      toast.success(`تمت إزالة "${name}" من متجرك`);
      setRemoving(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove product");
    }
  };

  const totalProducts = products.length;
  const totalMyListings = myListings.length;
  const totalEarnings = Number(wallet?.total_earned ?? 0);

  if (!user) return null;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="max-w-7xl mx-auto" dir="rtl">
        <PageHeader
          eyebrow="Sourcing"
          title="كتالوج التوريد"
          description="أضف منتجات لمتجرك بدون شراء مسبق"
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
            label="إجمالي أرباحي"
            value={formatPrice(totalEarnings)}
            gradient="from-violet-500 to-fuchsia-500"
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as Tab)}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="catalog">كتالوج التوريد</TabsTrigger>
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
              <Card className="border-border/60 shadow-soft">
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
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
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
                      value={riskFilter}
                      onValueChange={(v) => setRiskFilter(v as RiskFilter)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="مستوى المخاطرة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">كل المستويات</SelectItem>
                        <SelectItem value="low">منخفض (&lt;10%)</SelectItem>
                        <SelectItem value="medium">متوسط (10-25%)</SelectItem>
                        <SelectItem value="high">مرتفع (&gt;25%)</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="inline-flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                      <Switch
                        checked={notAddedOnly}
                        onCheckedChange={setNotAddedOnly}
                      />
                      <span>إظهار غير المضافة فقط</span>
                    </label>
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
                      title="لا توجد منتجات"
                      description="لا توجد منتجات تطابق الفلاتر الحالية. جرّب تغيير معايير البحث."
                    />
                  </div>
                ) : (
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((p) => (
                      <ProductCard
                        key={p.id}
                        product={p}
                        alreadyAdded={myListingIds.has(p.id)}
                        onAdd={() => openAdd(p)}
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
              onUpdatePrice={(listingId, price) =>
                updateListing.mutate(
                  { listingId, sellingPrice: price },
                  {
                    onSuccess: () => toast.success("تم تحديث سعر البيع"),
                    onError: (e) =>
                      toast.error(
                        e instanceof Error ? e.message : "Failed",
                      ),
                  },
                )
              }
              onToggleActive={(l) =>
                updateListing.mutate(
                  { listingId: l.id, isActive: !l.is_active },
                  {
                    onSuccess: () =>
                      toast.success(
                        l.is_active ? "تم إيقاف المنتج مؤقتاً" : "تم تفعيل المنتج",
                      ),
                    onError: (e) =>
                      toast.error(
                        e instanceof Error ? e.message : "Failed",
                      ),
                  },
                )
              }
              onRemove={(l) => setRemoving(l)}
              pendingListingId={
                updateListing.isPending
                  ? updateListing.variables?.listingId
                  : undefined
              }
            />
          </TabsContent>
        </Tabs>

        {/* Add-to-store slide-over */}
        <AddToStoreSheet
          product={addTarget}
          onClose={() => setAddTarget(null)}
          stores={stores}
          storeId={addStoreId}
          onStoreIdChange={setAddStoreId}
          priceInput={addPriceInput}
          onPriceInputChange={handlePriceInput}
          marginPercent={marginPercent}
          onMarginChange={handleMarginChange}
          onConfirm={confirmAdd}
          confirming={addToStore.isPending}
        />

        {/* Remove confirmation */}
        <AlertDialog
          open={!!removing}
          onOpenChange={(o) => !o && setRemoving(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                إزالة "{removing?.marketplace_product?.name ?? "المنتج"}"؟
              </AlertDialogTitle>
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
    </TooltipProvider>
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
      <div className="p-4 flex items-center gap-3">
        <div
          className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} text-white grid place-items-center shadow-sm shrink-0`}
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
}: {
  product: MarketplaceProduct;
  alreadyAdded: boolean;
  onAdd: () => void;
}) {
  const images = (product.images ?? []) as string[];
  const rate = Number(product.return_rate_percent ?? 0);
  const rateBadge = returnRateBadge(rate);
  const platform = Number(product.platform_price);

  return (
    <Card className="border-border/60 shadow-soft overflow-hidden flex flex-col">
      {/* Image carousel */}
      <div className="relative bg-muted/40">
        {images.length === 0 ? (
          <div className="aspect-square grid place-items-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
        ) : (
          <Carousel
            className="w-full"
            opts={{ loop: images.length > 1, direction: "rtl" }}
          >
            <CarouselContent>
              {images.map((src, i) => (
                <CarouselItem key={`${product.id}-${i}`}>
                  <div className="aspect-square">
                    <Img
                      src={src}
                      alt={product.name}
                      width={600}
                      quality={80}
                      objectFit="contain"
                      className="h-full w-full"
                    />
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
          <Badge className="absolute top-2 end-2 bg-emerald-500/95 text-white border-0 shadow-md">
            <Check className="h-3 w-3 me-1" /> مضاف لمتجري
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
              {formatPrice(platform)}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className={rateBadge.className}>
                رفض {rateBadge.label}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {`${rate.toFixed(1)}% من الطلبيات تُرفض من طرف الزبائن`}
            </TooltipContent>
          </Tooltip>
        </div>

        <Button
          onClick={onAdd}
          disabled={alreadyAdded}
          className="w-full mt-2"
          variant={alreadyAdded ? "outline" : "default"}
        >
          {alreadyAdded ? (
            <>
              <Check className="h-4 w-4 ms-2" /> مضاف لمتجري
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 ms-2" /> أضف لمتجري
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// Add-to-store sheet
// ============================================================
function AddToStoreSheet({
  product,
  onClose,
  stores,
  storeId,
  onStoreIdChange,
  priceInput,
  onPriceInputChange,
  marginPercent,
  onMarginChange,
  onConfirm,
  confirming,
}: {
  product: MarketplaceProduct | null;
  onClose: () => void;
  stores: Store[];
  storeId: string;
  onStoreIdChange: (v: string) => void;
  priceInput: string;
  onPriceInputChange: (v: string) => void;
  marginPercent: number;
  onMarginChange: (v: number) => void;
  onConfirm: () => void;
  confirming: boolean;
}) {
  const platform = product ? Number(product.platform_price) : 0;
  const numericPrice = Number(priceInput);
  const validPrice =
    Number.isFinite(numericPrice) && numericPrice >= platform && platform > 0;
  const profit = validPrice ? numericPrice - platform : 0;
  const rate = product ? Number(product.return_rate_percent ?? 0) : 0;
  const showHighRiskWarning = rate > 20;

  // Reset inputs whenever the target product changes
  useEffect(() => {
    if (product) {
      const p = Number(product.platform_price);
      const def = Math.round(p * 1.5);
      onPriceInputChange(String(def));
      onMarginChange(50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="left"
        className="w-full sm:max-w-md overflow-y-auto p-0"
      >
        {product && (
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-3 border-b border-border/60 text-right">
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                  {(product.images ?? []).length > 0 ? (
                    <Img
                      src={(product.images as string[])[0]}
                      alt={product.name}
                      width={128}
                      quality={80}
                      objectFit="cover"
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="h-full w-full grid place-items-center">
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-base leading-tight">
                    {product.name}
                  </SheetTitle>
                  {product.category && (
                    <SheetDescription className="text-xs mt-0.5">
                      {product.category}
                    </SheetDescription>
                  )}
                </div>
              </div>
            </SheetHeader>

            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Platform price (readonly) */}
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">تكلفتك</p>
                <p className="text-2xl font-bold font-display mt-1" dir="ltr">
                  {formatPrice(platform)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  هذا ما ستدفعه عند وصول طلبية من زبونك
                </p>
              </div>

              {/* Selling price input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">سعر البيع</label>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={platform}
                    step={50}
                    value={priceInput}
                    onChange={(e) => onPriceInputChange(e.target.value)}
                    className="text-lg font-bold pe-12"
                    dir="ltr"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    DA
                  </span>
                </div>
                {!validPrice && priceInput !== "" && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    السعر يجب أن يكون {formatPrice(platform)} أو أكثر
                  </p>
                )}
              </div>

              {/* Margin slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">هامش الربح</label>
                  <span className="text-sm font-semibold text-primary" dir="ltr">
                    {marginPercent}%
                  </span>
                </div>
                <Slider
                  value={[marginPercent]}
                  min={0}
                  max={300}
                  step={5}
                  onValueChange={(v) => onMarginChange(v[0] ?? 0)}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground" dir="ltr">
                  <span>0%</span>
                  <span>100%</span>
                  <span>200%</span>
                  <span>300%</span>
                </div>
              </div>

              {/* Live profit calculator */}
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    ربحك لكل طلبية
                  </p>
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p
                  className="text-2xl font-bold font-display text-emerald-700 dark:text-emerald-400 mt-1"
                  dir="ltr"
                >
                  {formatPrice(profit)}
                </p>
              </div>

              {/* High-risk warning */}
              {showHighRiskWarning && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    هذا المنتج لديه نسبة رفض مرتفعة ({rate.toFixed(1)}%).
                    تأكد من استهداف الزبائن المناسبين.
                  </p>
                </div>
              )}

              {/* Store selector (only if multiple stores) */}
              {stores.length > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">المتجر</label>
                  <Select value={storeId} onValueChange={onStoreIdChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر متجراً" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Legal note */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                أنت تدفع تكلفة المنتج فقط عند وصول طلبية من زبونك. هذه الخدمة
                تعمل بنظام الوكالة.
              </p>
            </div>

            <SheetFooter className="p-6 pt-3 border-t border-border/60 flex-row gap-2">
              <Button
                onClick={onConfirm}
                disabled={!validPrice || confirming}
                className="flex-1"
              >
                {confirming ? (
                  <Loader2 className="h-4 w-4 animate-spin ms-2" />
                ) : (
                  <Check className="h-4 w-4 ms-2" />
                )}
                تأكيد الإضافة
              </Button>
              <Button variant="outline" onClick={onClose} disabled={confirming}>
                <XIcon className="h-4 w-4 ms-2" /> إلغاء
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// My listings table
// ============================================================
function MyListingsTable({
  listings,
  loading,
  onUpdatePrice,
  onToggleActive,
  onRemove,
  pendingListingId,
}: {
  listings: ResellerListingWithProduct[];
  loading: boolean;
  onUpdatePrice: (listingId: string, price: number) => void;
  onToggleActive: (l: ResellerListingWithProduct) => void;
  onRemove: (l: ResellerListingWithProduct) => void;
  pendingListingId: string | undefined;
}) {
  if (loading) {
    return (
      <Card className="border-border/60 shadow-soft p-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </Card>
    );
  }

  if (listings.length === 0) {
    return (
      <Card className="border-border/60 shadow-soft">
        <EmptyState
          icon={StoreIcon}
          title="لا توجد منتجات مضافة"
          description="تصفّح كتالوج التوريد وأضف منتجات لمتجرك لتظهر هنا."
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
      <Card className="border-border/60 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-right">المنتج</TableHead>
                <TableHead className="text-right">سعر البيع</TableHead>
                <TableHead className="text-right">تكلفة المنصة</TableHead>
                <TableHead className="text-right">الربح</TableHead>
                <TableHead className="text-right">الطلبيات / المرفوضة</TableHead>
                <TableHead className="text-right">نسبة الرفض</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((l) => {
                const product = l.marketplace_product;
                const platform = Number(product?.platform_price ?? 0);
                const selling = Number(l.selling_price);
                const profit = selling - platform;
                const total = l.total_orders ?? 0;
                const returns = l.total_returns ?? 0;
                const returnRate = total > 0 ? (returns / total) * 100 : 0;
                const rateBadge = returnRateBadge(returnRate);
                const isPending = pendingListingId === l.id;

                return (
                  <TableRow key={l.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                          {product?.images?.[0] ? (
                            <Img
                              src={product.images[0]}
                              alt={product.name}
                              width={80}
                              quality={70}
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
                            <p className="text-xs text-muted-foreground">
                              {product.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <EditablePrice
                        value={selling}
                        min={platform}
                        onCommit={(v) => onUpdatePrice(l.id, v)}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell className="text-sm" dir="ltr">
                      {formatPrice(platform)}
                    </TableCell>
                    <TableCell
                      className={`text-sm font-semibold ${
                        profit > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }`}
                      dir="ltr"
                    >
                      {formatPrice(profit)}
                    </TableCell>
                    <TableCell className="text-sm" dir="ltr">
                      {total} / {returns}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={rateBadge.className}>
                        {returnRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2">
                        <Switch
                          checked={l.is_active}
                          onCheckedChange={() => onToggleActive(l)}
                          disabled={isPending}
                        />
                        <span className="text-xs text-muted-foreground">
                          {l.is_active ? (
                            <Play className="h-3.5 w-3.5 inline" />
                          ) : (
                            <Pause className="h-3.5 w-3.5 inline" />
                          )}
                        </span>
                      </div>
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

// ============================================================
// Inline-editable price cell
// ============================================================
function EditablePrice({
  value,
  min,
  onCommit,
  disabled,
}: {
  value: number;
  min: number;
  onCommit: (v: number) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  const commit = () => {
    setEditing(false);
    const n = Number(draft);
    if (!Number.isFinite(n) || n === value) {
      setDraft(String(value));
      return;
    }
    if (n < min) {
      toast.error(`السعر يجب أن يكون ${formatPrice(min)} أو أكثر`);
      setDraft(String(value));
      return;
    }
    onCommit(n);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 text-sm font-semibold hover:bg-muted/50 rounded px-1 py-0.5 -mx-1 transition-colors disabled:opacity-50"
        dir="ltr"
      >
        {formatPrice(value)}
        <Pencil className="h-3 w-3 text-muted-foreground" />
      </button>
    );
  }

  return (
    <Input
      autoFocus
      type="number"
      inputMode="decimal"
      min={min}
      step={50}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setDraft(String(value));
          setEditing(false);
        }
      }}
      className="h-8 w-28 text-sm font-semibold"
      dir="ltr"
    />
  );
}
