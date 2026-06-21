import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Home,
  Building2,
  Camera,
  FileText,
  Search,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { ALGERIA_WILAYAS, getCitiesForWilaya, WILAYA_LIST } from "@/lib/algeriaWilayas";
import { scanOrderWithGemini, compressImage, type ScannedData } from "@/lib/scan-order";
import { OrderScanIllustration } from "@/components/dashboard/illustrations/OrderScanIllustration";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type LineItem = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  image_url: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const NO_EMAIL = "noemail@fennecly.local";

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function CreateOrderDialog({ open, onClose, onCreated }: Props) {
  const { t: tr } = useTranslation();
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();

  const [mode, setMode] = useState<"manual" | "scan">("manual");

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [noEmail, setNoEmail] = useState(true);
  const [customerEmail, setCustomerEmail] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryType, setDeliveryType] = useState<"domicile" | "stopdesk">("domicile");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Scan state
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannedConfidence, setScannedConfidence] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Product search
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);

  const cities = useMemo(() => (wilaya ? getCitiesForWilaya(wilaya) : []), [wilaya]);

  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  // Load products for search
  useEffect(() => {
    if (!user || !productDropdownOpen) return;
    let active = true;
    (async () => {
      setSearchingProducts(true);
      let q = supabase
        .from("products")
        .select("id, name, price, images, stock")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("name");
      if (productSearch.trim()) {
        q = q.ilike("name", `%${productSearch.trim()}%`);
      }
      q = q.limit(20);
      const { data } = await q;
      if (active) {
        setProducts((data as Product[]) ?? []);
        setSearchingProducts(false);
      }
    })();
    return () => { active = false; };
  }, [user, productSearch, productDropdownOpen]);

  const reset = () => {
    setMode("manual");
    setCustomerName("");
    setCustomerPhone("");
    setNoEmail(true);
    setCustomerEmail("");
    setWilaya("");
    setCity("");
    setAddress("");
    setPostalCode("");
    setDeliveryType("domicile");
    setNotes("");
    setItems([]);
    setErrors({});
    setScanFile(null);
    setScanPreview(null);
    setScannedConfidence(null);
    setProductSearch("");
    setProductDropdownOpen(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const addItem = (product?: Product) => {
    const newItem: LineItem = {
      id: makeId(),
      product_id: product?.id ?? null,
      product_name: product?.name ?? "",
      quantity: 1,
      unit_price: product?.price ?? 0,
      image_url: product?.images?.[0] ?? null,
    };
    setItems((prev) => [...prev, newItem]);
    setProductSearch("");
    setProductDropdownOpen(false);
  };

  const addCustomItem = () => {
    addItem();
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = "Required";
    if (!wilaya) errs.wilaya = "Required";
    if (!city) errs.city = "Required";
    if (!address.trim()) errs.address = "Required";
    if (items.length === 0) errs.items = "Add at least one item";
    items.forEach((item, idx) => {
      if (!item.product_name.trim()) errs[`item_${idx}_name`] = "Required";
      if (item.quantity < 1) errs[`item_${idx}_qty`] = "Min 1";
      if (item.unit_price < 0) errs[`item_${idx}_price`] = "Must be ≥ 0";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!user || !currentStore) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      const email = noEmail ? NO_EMAIL : customerEmail.trim() || NO_EMAIL;
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          store_owner_id: user.id,
          store_id: currentStore.id,
          store_slug: currentStore.slug ?? "",
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim() || null,
          customer_email: email,
          shipping_address: address.trim(),
          shipping_wilaya: wilaya,
          shipping_city: city,
          shipping_postal_code: postalCode.trim() || "",
          shipping_country: "Algeria",
          delivery_type: deliveryType,
          notes: notes.trim() || null,
          source: "manual",
          status: "pending",
          subtotal,
          total: subtotal,
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name.trim(),
        quantity: i.quantity,
        unit_price: i.unit_price,
        image_url: i.image_url,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      toast.success("Order created");
      reset();
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  // Scan handling
  const handleScanFile = (file: File | null) => {
    if (!file) return;
    setScanFile(file);
    const reader = new FileReader();
    reader.onload = () => setScanPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!scanFile) return;
    setScanning(true);
    try {
      const { base64, mediaType } = await compressImage(scanFile);
      console.log("[scan] Calling Gemini...", { mediaType, base64Length: base64.length });
      const data = await scanOrderWithGemini(base64, mediaType);
      console.log("[scan] Result:", data);
      setScannedConfidence(data.confidence);

      // Pre-fill form
      if (data.customer_name) setCustomerName(data.customer_name);
      if (data.customer_phone) setCustomerPhone(data.customer_phone);
      if (data.wilaya && WILAYA_LIST.includes(data.wilaya)) setWilaya(data.wilaya);
      if (data.city) setCity(data.city);
      if (data.address) setAddress(data.address);
      if (data.delivery_type) setDeliveryType(data.delivery_type);
      if (data.notes) setNotes(data.notes);
      if (data.items?.length) {
        setItems(
          data.items.map((i) => ({
            id: makeId(),
            product_id: null,
            product_name: i.product_name,
            quantity: Math.max(1, i.quantity),
            unit_price: i.unit_price ?? 0,
            image_url: null,
          })),
        );
      }

      setMode("manual");
      toast.success("Order scanned — please review");
    } catch (err) {
      console.error("[scan] Error:", err);
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 14,
    width: "100%",
    outline: "none",
  };

  const fieldError = (key: string) =>
    errors[key] ? (
      <p className="text-xs text-red-500 mt-1">{errors[key]}</p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Create order</DialogTitle>
          <DialogDescription>
            Manually create an order or scan a customer's note.
          </DialogDescription>
        </DialogHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 border-b pb-3">
          <button
            type="button"
            onClick={() => setMode("manual")}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors",
              mode === "manual"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Manual entry
          </button>
          <button
            type="button"
            onClick={() => setMode("scan")}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors",
              mode === "scan"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Scan order
          </button>
        </div>

        {/* Scan mode */}
        {mode === "scan" && (
          <div className="space-y-4 py-4">
            {!scanPreview ? (
              <div className="space-y-3">
                <OrderScanIllustration className="w-full max-w-[280px] mx-auto mb-4" />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const file = e.dataTransfer.files?.[0];
                    if (file?.type.startsWith("image/")) handleScanFile(file);
                  }}
                  className="border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Camera className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drop a screenshot or photo of the order note
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or tap to browse
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const camInput = document.createElement("input");
                    camInput.type = "file";
                    camInput.accept = "image/*";
                    camInput.capture = "environment";
                    camInput.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handleScanFile(file);
                    };
                    camInput.click();
                  }}
                  className="w-full gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Take photo with camera
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleScanFile(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={scanPreview}
                    alt="Order scan preview"
                    className="max-h-48 rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => { setScanFile(null); setScanPreview(null); }}
                    className="absolute -top-2 -right-2 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
                <Button
                  type="button"
                  onClick={handleScan}
                  disabled={scanning}
                  className="w-full"
                >
                  {scanning ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  {scanning ? "Reading order details..." : "Scan order"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Scan confidence banner */}
        {scannedConfidence && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">
              Scanned from image — please review before submitting
            </span>
            <span
              className={cn(
                "ml-auto px-2 py-0.5 text-xs font-semibold rounded-full",
                scannedConfidence === "high"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                  : scannedConfidence === "medium"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                    : "bg-red-500/15 text-red-700 dark:text-red-400",
              )}
            >
              {scannedConfidence} confidence
            </span>
            <button
              type="button"
              onClick={() => setScannedConfidence(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Form (both manual and after scan) */}
        <div className="space-y-6">
          {/* Customer section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Customer
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="cust-name">Name *</Label>
                <Input
                  id="cust-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ahmed Benali"
                  style={inputStyle}
                />
                {fieldError("customerName")}
              </div>
              <div>
                <Label htmlFor="cust-phone">Phone</Label>
                <Input
                  id="cust-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="0555 12 34 56"
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="no-email"
                checked={noEmail}
                onCheckedChange={(v) => setNoEmail(!!v)}
              />
              <Label htmlFor="no-email" className="text-sm text-muted-foreground">
                Customer has no email
              </Label>
            </div>
            {!noEmail && (
              <div>
                <Label htmlFor="cust-email">Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="ahmed@example.com"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          {/* Delivery section */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Delivery
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Wilaya *</Label>
                <Select value={wilaya} onValueChange={(v) => { setWilaya(v); setCity(""); }}>
                  <SelectTrigger style={inputStyle}>
                    <SelectValue placeholder="Select wilaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {WILAYA_LIST.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("wilaya")}
              </div>
              <div>
                <Label>City *</Label>
                <Select value={city} onValueChange={setCity} disabled={!wilaya}>
                  <SelectTrigger style={{ ...inputStyle, opacity: wilaya ? 1 : 0.5 }}>
                    <SelectValue placeholder={wilaya ? "Select city" : "Pick wilaya first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldError("city")}
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street and number"
                style={inputStyle}
              />
              {fieldError("address")}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="postal">Postal code</Label>
                <Input
                  id="postal"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="16000"
                  style={inputStyle}
                />
              </div>
              <div>
                <Label>Delivery type</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {(["domicile", "stopdesk"] as const).map((type) => {
                    const active = deliveryType === type;
                    const Icon = type === "domicile" ? Home : Building2;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDeliveryType(type)}
                        className="flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg border-2 transition-all"
                        style={{
                          borderColor: active ? "hsl(var(--primary))" : "hsl(var(--border))",
                          backgroundColor: active ? "hsl(var(--primary) / 0.1)" : "transparent",
                          color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                        }}
                      >
                        <Icon className="h-4 w-4" />
                        {type === "domicile" ? "Home" : "Stop desk"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Items section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Items
              </h4>
              <div className="flex gap-2">
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setProductDropdownOpen(!productDropdownOpen)}
                    className="gap-1.5"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Add product
                  </Button>
                  {productDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 w-72 bg-popover border rounded-lg shadow-lg z-50 overflow-hidden">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search products..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {searchingProducts ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" />
                            Searching...
                          </div>
                        ) : products.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No products found
                          </div>
                        ) : (
                          products.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => addItem(p)}
                              className="w-full flex items-center gap-3 p-2 hover:bg-accent text-left text-sm"
                            >
                              <div className="h-8 w-8 rounded bg-muted overflow-hidden shrink-0">
                                {p.images?.[0] && (
                                  <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.price} DA</div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="p-2 border-t">
                        <button
                          type="button"
                          onClick={() => { addCustomItem(); setProductDropdownOpen(false); }}
                          className="w-full text-left p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded"
                        >
                          + Add custom item
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCustomItem} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Custom
                </Button>
              </div>
            </div>
            {fieldError("items")}

            {items.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
                No items yet. Click "Add product" or "Custom" above.
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-lg bg-muted/30"
                  >
                    {/* Mobile: stacked layout */}
                    <div className="flex items-center gap-2 sm:hidden w-full">
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                        {item.image_url && (
                          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <Input
                        value={item.product_name}
                        onChange={(e) => updateItem(item.id, "product_name", e.target.value)}
                        placeholder="Product name"
                        className="h-8 text-sm flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 sm:hidden w-full">
                      <div className="flex items-center gap-1 flex-1">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Qty</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, "quantity", Math.max(1, Number(e.target.value)))}
                          className="h-8 text-sm w-16"
                        />
                      </div>
                      <div className="flex items-center gap-1 flex-1">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">Price</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.unit_price}
                          onChange={(e) => updateItem(item.id, "unit_price", Math.max(0, Number(e.target.value)))}
                          className="h-8 text-sm flex-1"
                        />
                      </div>
                      <span className="text-sm font-medium tabular-nums whitespace-nowrap">
                        {(item.unit_price * item.quantity).toFixed(0)} DA
                      </span>
                    </div>

                    {/* Desktop: inline layout */}
                    <div className="hidden sm:flex sm:items-center sm:gap-2 sm:flex-1 sm:min-w-0">
                      <div className="h-10 w-10 rounded bg-muted overflow-hidden shrink-0">
                        {item.image_url && (
                          <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <Input
                        value={item.product_name}
                        onChange={(e) => updateItem(item.id, "product_name", e.target.value)}
                        placeholder="Product name"
                        className="h-8 text-sm flex-1 min-w-0"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, "quantity", Math.max(1, Number(e.target.value)))}
                        className="h-8 text-sm w-16 shrink-0"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={item.unit_price}
                        onChange={(e) => updateItem(item.id, "unit_price", Math.max(0, Number(e.target.value)))}
                        className="h-8 text-sm w-20 shrink-0"
                      />
                      <span className="text-sm font-medium tabular-nums text-right whitespace-nowrap shrink-0">
                        {(item.unit_price * item.quantity).toFixed(2)} DA
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any special instructions..."
              className="resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t">
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="text-xl font-bold tabular-nums">{subtotal.toFixed(2)} DA</div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1 sm:flex-none">
                {submitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Create order
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
