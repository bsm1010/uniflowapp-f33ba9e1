import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, Copy, CreditCard, Store, User, Globe, Upload, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { deleteAccount } from "@/lib/account/delete-account";
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

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Settings — Storely" }] }),
});

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Profile
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Store
  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [savingStore, setSavingStore] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);

  // Payments (UI-only preferences, persisted in localStorage for now)
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [payoutEmail, setPayoutEmail] = useState("");

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.name ?? "");
        setAvatarUrl(data?.avatar_url ?? null);
      });

    supabase
      .from("store_settings")
      .select("store_name, tagline, slug")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setStoreName(data?.store_name ?? "");
        setTagline(data?.tagline ?? "");
        setSlug(data?.slug ?? "");
        setOriginalSlug(data?.slug ?? "");
      });

    const raw = localStorage.getItem(`payments:${user.id}`);
    if (raw) {
      try {
        const p = JSON.parse(raw);
        setPaymentsEnabled(!!p.enabled);
        setCurrency(p.currency ?? "USD");
        setPayoutEmail(p.payoutEmail ?? "");
      } catch {
        // ignore
      }
    } else {
      setPayoutEmail(user.email ?? "");
    }
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Profile updated");
      window.dispatchEvent(new Event("profile:updated"));
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setUploadingAvatar(false);
      toast.error(uploadError.message);
      return;
    }
    const { data: pub } = supabase.storage.from("store-assets").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);
    setUploadingAvatar(false);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    setAvatarUrl(url);
    window.dispatchEvent(new Event("profile:updated"));
    toast.success("Avatar updated");
  };

  const removeAvatar = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setAvatarUrl(null);
    window.dispatchEvent(new Event("profile:updated"));
    toast.success("Avatar removed");
  };

  const saveStore = async () => {
    if (!user) return;
    setSavingStore(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ store_name: storeName, tagline })
      .eq("user_id", user.id);
    setSavingStore(false);
    if (error) toast.error(error.message);
    else toast.success("Store updated");
  };

  const saveDomain = async () => {
    if (!user) return;
    const cleaned = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!cleaned) {
      toast.error("Please enter a valid URL");
      return;
    }
    setSavingDomain(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ slug: cleaned })
      .eq("user_id", user.id);
    setSavingDomain(false);
    if (error) {
      if (error.code === "23505") toast.error("That URL is already taken");
      else toast.error(error.message);
      return;
    }
    setSlug(cleaned);
    setOriginalSlug(cleaned);
    toast.success("Store URL saved");
  };

  const savePayments = () => {
    if (!user) return;
    localStorage.setItem(
      `payments:${user.id}`,
      JSON.stringify({ enabled: paymentsEnabled, currency, payoutEmail }),
    );
    toast.success("Payment preferences saved");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const storeUrl =
    typeof window !== "undefined" && originalSlug
      ? `${window.location.origin}/s/${originalSlug}`
      : "";

  const copyUrl = async () => {
    if (!storeUrl) return;
    await navigator.clipboard.writeText(storeUrl);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your store, domain, payments, and profile."
        icon={User}
        gradient="from-slate-500 via-zinc-500 to-stone-500"
      />

      {/* Store */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Store className="size-4" />
            </div>
            <div>
              <CardTitle>Store</CardTitle>
              <CardDescription>
                Your store name and tagline shown across the storefront.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="storeName">Store name</Label>
              <Input
                id="storeName"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="My Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Beautiful things, thoughtfully made."
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveStore} disabled={savingStore}>
              {savingStore ? "Saving…" : "Save store"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain / URL */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <Globe className="size-4" />
            </div>
            <div>
              <CardTitle>Domain & URL</CardTitle>
              <CardDescription>
                Choose the public address customers use to find your store.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="slug">Store URL</Label>
            <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
              <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted/50 border-r border-input">
                /s/
              </span>
              <input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-shop"
                className="flex-1 bg-transparent px-3 py-1 text-sm outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and dashes. Must be unique.
            </p>
          </div>

          {originalSlug && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Badge variant="secondary">Live</Badge>
              <code className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                {storeUrl}
              </code>
              <Button size="sm" variant="ghost" onClick={copyUrl}>
                <Copy className="size-4 mr-1.5" /> Copy
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/s/$slug" params={{ slug: originalSlug }}>
                  <ExternalLink className="size-4 mr-1.5" /> View
                </Link>
              </Button>
            </div>
          )}

          <div className="rounded-lg border border-dashed border-border/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Custom domain</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect a domain you own (e.g. mystore.com). Coming soon.
                </p>
              </div>
              <Button size="sm" variant="outline" disabled>
                Connect
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveDomain}
              disabled={savingDomain || slug === originalSlug}
            >
              {savingDomain ? "Saving…" : "Save URL"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <CreditCard className="size-4" />
            </div>
            <div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>
                Configure how you accept payments from customers.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 p-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Accept online payments</p>
              <p className="text-xs text-muted-foreground">
                When off, checkout collects orders without charging customers.
              </p>
            </div>
            <Switch
              checked={paymentsEnabled}
              onCheckedChange={setPaymentsEnabled}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                placeholder="USD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payoutEmail">Payout email</Label>
              <Input
                id="payoutEmail"
                type="email"
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-border/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">Connect a payment provider</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Enable Stripe or Paddle to accept real payments at checkout.
                </p>
              </div>
              <Button size="sm" variant="outline" disabled>
                Connect
              </Button>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={savePayments}>Save payments</Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="border-border/60 shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <User className="size-4" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Personal information for your account.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-border/60">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || "Avatar"} /> : null}
              <AvatarFallback className="bg-gradient-brand text-brand-foreground text-lg font-semibold">
                {(name || user?.email || "U")
                  .split(/[\s@]/)[0]
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Profile photo</p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG or JPG, up to 5MB. Shown in the topbar.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleAvatarUpload(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Upload className="size-4 mr-1.5" />
                  {uploadingAvatar ? "Uploading…" : avatarUrl ? "Replace" : "Upload"}
                </Button>
                {avatarUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={removeAvatar}
                    disabled={uploadingAvatar}
                  >
                    <Trash2 className="size-4 mr-1.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ""} disabled />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-sm">Sign out</h3>
              <p className="text-sm text-muted-foreground">
                End your session on this device.
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
