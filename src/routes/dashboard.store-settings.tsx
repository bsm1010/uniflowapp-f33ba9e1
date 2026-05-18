import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Settings, Trash2, Upload, Store as StoreIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORIES = ["fashion","electronics","beauty","home","food","sports","books","toys","general"];
const CURRENCIES = ["DZD","USD","EUR","MAD","TND","GBP","SAR","AED"];

export const Route = createFileRoute("/dashboard/store-settings")({
  component: StoreSettingsPage,
  head: () => ({ meta: [{ title: "Store Settings — Fennecly" }] }),
});

function StoreSettingsPage() {
  const { user } = useAuth();
  const { currentStore, stores, refresh, setCurrent } = useCurrentStore();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("general");
  const [currency, setCurrency] = useState("DZD");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    setName(currentStore.name);
    setCategory(currentStore.category);
    setCurrency(currentStore.currency);
    setDescription(currentStore.description);
    setLogoUrl(currentStore.logo_url);
  }, [currentStore]);

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const uploadLogo = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() || "png";
    const path = `${user.id}/store-logos/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Failed to upload logo");
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
  };

  const save = async () => {
    if (!currentStore) return;
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        name: name.trim(),
        category,
        currency,
        description: description.trim(),
        logo_url: logoUrl,
      })
      .eq("id", currentStore.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Store updated");
    await refresh();
  };

  const remove = async () => {
    if (!currentStore) return;
    if (stores.length <= 1) {
      toast.error("You must have at least one store");
      return;
    }
    const { error } = await supabase.from("stores").delete().eq("id", currentStore.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Store deleted");
    const next = stores.find((s) => s.id !== currentStore.id);
    if (next) await setCurrent(next.id);
    await refresh();
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        eyebrow="Store"
        title="Store Settings"
        description="Edit your store details or delete this store."
        icon={Settings}
        gradient="from-violet-500 via-fuchsia-500 to-pink-500"
      />

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-6 space-y-5">
          <div>
            <Label>Logo</Label>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <StoreIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                <span>Upload</span>
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
            <Label htmlFor="name">Store name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>

          <div className="flex justify-between pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={stores.length <= 1}>
                  <Trash2 className="h-4 w-4" /> Delete store
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this store?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes <strong>{currentStore.name}</strong> and all its data
                    (products, orders, settings). This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
