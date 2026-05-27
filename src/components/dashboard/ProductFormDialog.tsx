import { useEffect, useState } from "react";
import { Loader2, Upload, X, Mic, Plus } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { generateVoice } from "@/lib/ai/voice-generator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CATEGORIES = [
  "Apparel",
  "Accessories",
  "Home",
  "Beauty",
  "Electronics",
  "Food & Drink",
  "Other",
];

export type ProductVariant = {
  type: string;
  options: string[];
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock: number;
  category: string | null;
  images: string[];
  sku: string | null;
  weight: number | null;
  tags: string[];
  status: "draft" | "published";
  variants: ProductVariant[];
  sales_count: number;
};

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional(),
  price: z.number().min(0, "Price cannot be negative").max(1_000_000),
  sale_price: z.number().min(0).max(1_000_000).optional().nullable(),
  stock: z.number().int().min(0, "Stock cannot be negative").max(1_000_000),
  category: z.string().trim().max(60).optional(),
  sku: z.string().trim().max(100).optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
});

const MAX_IMAGES = 6;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  onSaved: () => void;
}

export function ProductFormDialog({ open, onOpenChange, product, onSaved }: Props) {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState<string>("");
  const [sku, setSku] = useState("");
  const [weight, setWeight] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingVoice, setGeneratingVoice] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const generateVoiceFn = useServerFn(generateVoice);

  useEffect(() => {
    if (open) {
      setName(product?.name ?? "");
      setDescription(product?.description ?? "");
      setPrice(product ? String(product.price) : "0");
      setSalePrice(product?.sale_price != null ? String(product.sale_price) : "");
      setStock(product ? String(product.stock) : "0");
      setCategory(product?.category ?? "");
      setSku(product?.sku ?? "");
      setWeight(product?.weight != null ? String(product.weight) : "");
      setTags(product?.tags ?? []);
      setStatus(product?.status ?? "draft");
      setVariants(product?.variants ?? []);
      setImages(product?.images ?? []);
      setVoiceUrl(null);
      setTagInput("");
    }
  }, [open, product]);

  // Tags
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags((prev) => prev.filter((x) => x !== t));

  // Variants
  const addVariant = () => setVariants((prev) => [...prev, { type: "", options: [] }]);
  const updateVariantType = (i: number, val: string) =>
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, type: val } : v)));
  const updateVariantOptions = (i: number, val: string) =>
    setVariants((prev) =>
      prev.map((v, idx) =>
        idx === i ? { ...v, options: val.split(",").map((s) => s.trim()).filter(Boolean) } : v
      )
    );
  const removeVariant = (i: number) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const handleGenerateVoice = async () => {
    if (!name.trim()) { toast.error("Please add a product name first"); return; }
    const script = description.trim() ? `${name.trim()}. ${description.trim()}` : name.trim();
    setGeneratingVoice(true);
    setVoiceUrl(null);
    try {
      const { data: sessionData } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) { toast.error("Please sign in first"); return; }
      const res = await generateVoiceFn({ data: { text: script, accessToken } });
      if (res.error || !res.audio) { toast.error(res.error || "Failed to generate voice"); return; }
      setVoiceUrl(`data:audio/mpeg;base64,${res.audio}`);
      toast.success("Product voice generated!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while generating audio");
    } finally {
      setGeneratingVoice(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const list = Array.from(files);
    if (images.length + list.length > MAX_IMAGES) {
      toast.error(`You can upload at most ${MAX_IMAGES} images.`);
      return;
    }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of list) {
        if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image.`); continue; }
        if (file.size > MAX_IMAGE_SIZE) { toast.error(`${file.name} exceeds 5 MB.`); continue; }
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) { toast.error(`Upload failed: ${error.message}`); continue; }
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        uploaded.push(pub.publicUrl);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => setImages((prev) => prev.filter((u) => u !== url));

  const save = async () => {
    if (!user) return;
    const parsed = schema.safeParse({
      name,
      description: description || undefined,
      price: Number(price),
      sale_price: salePrice !== "" ? Number(salePrice) : null,
      stock: Number(stock),
      category: category || undefined,
      sku: sku || null,
      weight: weight !== "" ? Number(weight) : null,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setSaving(true);
    const payload = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      sale_price: parsed.data.sale_price ?? null,
      stock: parsed.data.stock,
      category: parsed.data.category ?? null,
      sku: parsed.data.sku ?? null,
      weight: parsed.data.weight ?? null,
      tags,
      status,
      variants,
      images,
    };
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert({ ...payload, user_id: user.id, store_id: currentStore?.id ?? null });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(product ? "Product updated" : "Product created");
    onOpenChange(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {product ? "Update the details of this product." : "Fill in the details to add a new product to your store."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Name & SKU */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Classic White Tee" maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="e.g. CWT-001" maxLength={100} />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell customers what makes this product special…" rows={4} maxLength={2000} />
          </div>

          {/* Price, Sale Price, Stock */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">Sale Price (USD)</Label>
              <Input id="sale_price" type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="Optional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input id="stock" type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          {/* Category & Weight */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category"><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input id="weight" type="number" step="0.01" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Type a tag and press Enter"
              />
              <Button type="button" variant="secondary" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 pr-1">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Variants</Label>
              <Button type="button" variant="secondary" size="sm" onClick={addVariant}>
                <Plus className="h-3.5 w-3.5" /> Add variant
              </Button>
            </div>
            {variants.map((v, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto] items-end rounded-lg border border-border p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Type</Label>
                  <Input value={v.type} onChange={(e) => updateVariantType(i, e.target.value)} placeholder="e.g. Color" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Options (comma separated)</Label>
                  <Input value={v.options.join(", ")} onChange={(e) => updateVariantOptions(i, e.target.value)} placeholder="e.g. Red, Blue, Green" />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariant(i)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Status toggle */}
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <Label className="text-sm font-medium">Published</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status === "published" ? "Visible in your store" : "Hidden from your store (draft)"}
              </p>
            </div>
            <Switch
              checked={status === "published"}
              onCheckedChange={(v) => setStatus(v ? "published" : "draft")}
            />
          </div>

          {/* Voice */}
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <Label className="text-sm font-medium">Product audio narration</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Generate an AI voice-over from the product title and description.</p>
              </div>
              <Button type="button" variant="secondary" size="sm" onClick={handleGenerateVoice} disabled={generatingVoice || !name.trim()}>
                {generatingVoice ? (<><Loader2 className="h-4 w-4 animate-spin" />Generating…</>) : (<><Mic className="h-4 w-4" />Generate Product Voice</>)}
              </Button>
            </div>
            {voiceUrl && <audio key={voiceUrl} src={voiceUrl} controls className="w-full mt-2" />}
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Images</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((url) => (
                <div key={url} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted group">
                  <img src={url} alt="Product" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeImage(url)} className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/90 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-soft" aria-label="Remove image">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className={`aspect-square rounded-lg border border-dashed border-border flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary hover:bg-accent/40 transition-colors text-muted-foreground text-xs ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                  <span>{uploading ? "Uploading…" : "Add image"}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Up to {MAX_IMAGES} images, max 5 MB each. PNG, JPG, or WEBP.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || uploading}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? "Save changes" : "Create product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
