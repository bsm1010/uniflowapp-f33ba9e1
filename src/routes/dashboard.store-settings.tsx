import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Loader2, Settings, Trash2, Upload, Store as StoreIcon, Info, MessageSquare } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AboutTab = lazy(() =>
  import("./-dashboard.about").then((m) => ({ default: m.AboutEditor }))
);
const ContactTab = lazy(() =>
  import("./-dashboard.contact").then((m) => ({ default: m.ContactEditor }))
);

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
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentStore) return;
    setName(currentStore.name);
    setCategory(currentStore.category);
    setDescription(currentStore.description);
    setLogoUrl(currentStore.logo_url);
    setTiktokPixelId((currentStore as any).tiktok_pixel_id ?? "");
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

  const save = async () => {
    if (!currentStore) return;
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        name: name.trim(),
        category,
        currency: "DZD",
        description: description.trim(),
        logo_url: logoUrl,
        tiktok_pixel_id: tiktokPixelId.trim() || null,
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

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="general" className="gap-1.5">
            <Settings className="h-4 w-4" /> Store
          </TabsTrigger>
          <TabsTrigger value="about" className="gap-1.5">
            <Info className="h-4 w-4" /> About
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> Contact
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          {/* ── General Settings ── */}
          <Card className="border-border/60">
            <CardContent className="p-6 space-y-5">
              <div>
                <Label>Logo</Label>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex items-center justify-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Store logo preview" className="h-full w-full object-cover" />
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
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
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

          {/* ── TikTok Pixel ── */}
          <Card className="border-border/60 mt-6">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-black flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-white"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">TikTok Pixel</h3>
                  <p className="text-xs text-muted-foreground">
                    Track visitors and conversions from your TikTok ads
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tiktok-pixel">Pixel ID</Label>
                <Input
                  id="tiktok-pixel"
                  placeholder="e.g. C3ABC1234567890"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Find your Pixel ID in{" "}
                  <a
                    href="https://ads.tiktok.com/i18n/events_manager"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    TikTok Ads Manager → Events Manager
                  </a>
                </p>
              </div>

              {tiktokPixelId && (
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                  ✅ Pixel <span className="font-mono font-semibold">{tiktokPixelId}</span> will be
                  injected into your storefront automatically.
                </div>
              )}

              <div className="flex justify-end pt-2 border-t">
                <Button onClick={save} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <AboutTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="contact">
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[300px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <ContactTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
