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
import { InlineEditable } from "@/components/ui/inline-editable";
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
  head: () => ({ meta: [{ title: "Settings — Fennecly" }] }),
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

  // Payments preferences (persisted in Supabase `payment_settings`)
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [payoutEmail, setPayoutEmail] = useState("");
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [savingPayments, setSavingPayments] = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

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
    let localFallback: { enabled?: boolean; currency?: string; payoutEmail?: string } | null = null;
    if (raw) {
      try {
        localFallback = JSON.parse(raw);
      } catch {
        // ignore corrupt localStorage value
      }
    }

    (async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("enabled, currency, payout_email")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPaymentsEnabled(!!data.enabled);
        setPayoutEmail(data.payout_email || user.email || "");
      } else {
        if (error && error.code !== "PGRST116") {
          toast.error(error.message);
        }
        if (localFallback) {
          setPaymentsEnabled(!!localFallback.enabled);
          setPayoutEmail(localFallback.payoutEmail ?? user.email ?? "");
        } else {
          setPayoutEmail(user.email ?? "");
        }
      }

      if (localFallback) {
        const { error: migrateErr } = await supabase.from("payment_settings").upsert(
          {
            user_id: user.id,
            enabled: !!localFallback.enabled,
            currency: "DZD",
            payout_email: localFallback.payoutEmail ?? user.email ?? "",
          },
          { onConflict: "user_id" },
        );
        if (!migrateErr) {
          localStorage.removeItem(`payments:${user.id}`);
        }
      }

      setPaymentsLoaded(true);
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
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

  const savePayments = async () => {
    if (!user) return;
    setSavingPayments(true);
    const cleanedEmail = payoutEmail.trim();
    const { error } = await supabase.from("payment_settings").upsert(
      {
        user_id: user.id,
        enabled: paymentsEnabled,
        currency: "DZD",
        payout_email: cleanedEmail,
      },
      { onConflict: "user_id" },
    );
    setSavingPayments(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPayoutEmail(cleanedEmail);
    localStorage.removeItem(`payments:${user.id}`);
    toast.success("Payment preferences saved");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      toast.error("Session expired. Please sign in again.");
      return;
    }
    setDeleting(true);
    try {
      await deleteAccount({ data: { accessToken: token } });
      toast.success("Your account has been deleted.");
      await supabase.auth.signOut();
      navigate({ to: "/" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete account";
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
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
      <Card className="border-border/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
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
              <InlineEditable
                value={storeName}
                onSave={async (val) => {
                  if (!user) return;
                  setSavingStore(true);
                  const { error } = await supabase
                    .from("store_settings")
                    .update({ store_name: val })
                    .eq("user_id", user.id);
                  setSavingStore(false);
                  if (error) {
                    toast.error(error.message);
                  } else {
                    setStoreName(val);
                    toast.success("Store name updated");
                  }
                }}
                placeholder="My Store"
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <InlineEditable
                value={tagline}
                onSave={async (val) => {
                  if (!user) return;
                  setSavingStore(true);
                  const { error } = await supabase
                    .from("store_settings")
                    .update({ tagline: val })
                    .eq("user_id", user.id);
                  setSavingStore(false);
                  if (error) {
                    toast.error(error.message);
                  } else {
                    setTagline(val);
                    toast.success("Tagline updated");
                  }
                }}
                placeholder="Beautiful things, thoughtfully made."
                maxLength={120}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Domain / URL */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white">
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
            <Button onClick={saveDomain} disabled={savingDomain || slug === originalSlug}>
              {savingDomain ? "Saving…" : "Save URL"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <CreditCard className="size-4" />
            </div>
            <div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Configure how you accept payments from customers.</CardDescription>
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
            <Switch checked={paymentsEnabled} onCheckedChange={setPaymentsEnabled} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <div className="flex h-10 w-full rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                DZD
              </div>
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
            <Button onClick={savePayments} disabled={savingPayments || !paymentsLoaded}>
              {savingPayments ? "Saving…" : "Save payments"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile */}
      <Card className="border-border/50 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <User className="size-4" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Personal information for your account.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border border-border/60">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || "Avatar"} /> : null}
              <AvatarFallback className="bg-gradient-brand text-brand-foreground text-lg font-semibold">
                {(name || user?.email || "U").split(/[\s@]/)[0].slice(0, 2).toUpperCase()}
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
              <p className="text-sm text-muted-foreground">End your session on this device.</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <Trash2 className="size-4" />
            </div>
            <div>
              <CardTitle className="text-destructive">Delete account</CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="text-sm">
              <p className="font-medium">This will remove:</p>
              <ul className="mt-1 list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                <li>Your profile, store, products, orders, and customers</li>
                <li>All settings, integrations, and credits</li>
              </ul>
            </div>
            <AlertDialog
              onOpenChange={(o) => {
                if (!o) setDeleteConfirm("");
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="size-4 mr-1.5" />
                  Delete account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account, store, products, orders, and all
                    related data. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="confirmDelete" className="text-sm">
                    Type <span className="font-mono font-semibold">DELETE</span> to confirm
                  </Label>
                  <Input
                    id="confirmDelete"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteAccount();
                    }}
                    disabled={deleting || deleteConfirm !== "DELETE"}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting…" : "Delete forever"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
