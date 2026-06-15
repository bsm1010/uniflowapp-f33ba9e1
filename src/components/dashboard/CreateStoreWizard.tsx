import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Store as StoreIcon, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "fashion",
  "electronics",
  "beauty",
  "home",
  "food",
  "sports",
  "books",
  "toys",
  "general",
];

const CURRENCIES = ["DZD", "USD", "EUR", "MAD", "TND", "GBP", "SAR", "AED"];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (storeId: string) => void;
}

export function CreateStoreWizard({ open, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [currency, setCurrency] = useState("DZD");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => {
    setStep(1);
    setName("");
    setCategory("general");
    setCurrency("DZD");
    setDescription("");
    setLogoUrl(null);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const uploadLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/store-logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error("Failed to upload logo");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
  };

  const submit = async () => {
    if (!user) return;
    if (!name.trim()) {
      toast.error("Store name is required");
      return;
    }
    setSubmitting(true);
    const slug = `store-${Math.random().toString(36).slice(2, 10)}`;
    const { data, error } = await supabase
      .from("stores")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        slug,
        category,
        currency,
        description: description.trim(),
        logo_url: logoUrl,
        is_default: false,
      })
      .select("id")
      .single();
    setSubmitting(false);
    if (error || !data) {
      toast.error(error?.message ?? "Failed to create store");
      return;
    }
    toast.success("Store created!");
    onCreated(data.id);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? null : handleClose())}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="font-display text-xl">Create a new store</DialogTitle>
        <DialogDescription>Step {step} of 3</DialogDescription>

        <div className="flex gap-1 mt-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded ${n <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="store-name">Store name</Label>
              <Input
                id="store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Shop"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div>
              <Label>Store logo</Label>
              <div className="mt-1 flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <StoreIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  <span>Upload logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadLogo(f);
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <Label htmlFor="desc">Store description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Tell shoppers what your store is about."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-14 w-14 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <StoreIcon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-semibold">{name || "Untitled store"}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {category} • {currency}
                  </div>
                </div>
              </div>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <p className="text-sm text-muted-foreground">
              Confirm to create this store. You can change these details later from Store Settings.
            </p>
          </div>
        )}

        <div className="flex justify-between pt-2 border-t">
          <Button
            variant="ghost"
            onClick={step === 1 ? handleClose : () => setStep((s) => s - 1)}
            disabled={submitting}
          >
            {step === 1 ? (
              "Cancel"
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" /> Back
              </>
            )}
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={step === 1 && !name.trim()}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Create Store
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
