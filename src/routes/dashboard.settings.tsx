import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Copy,
  CreditCard,
  Store,
  User,
  Globe,
  Upload,
  Trash2,
  LogOut,
  Settings,
  Shield,
  Palette,
  Building2,
  Phone,
  Share2,
  Receipt,
  Crown,
  Instagram,
  Facebook,
  Globe as TiktokIcon,
  MessageCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

interface StoreSettingsRow {
  store_name: string;
  tagline: string;
  slug: string;
  logo_url: string | null;
  store_favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  contact_address: string;
  footer_socials: unknown;
  rc_number: string;
  nif_number: string;
  ai_number: string;
  whatsapp_number: string;
  tva_rate: number;
}

interface ContactInfoRow {
  contact_email: string;
  contact_phone: string;
}

interface ProfileRow {
  name: string;
  avatar_url: string | null;
  plan: string;
  credits: number;
  plan_renews_at: string | null;
}

function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeName, setStoreName] = useState("");
  const [tagline, setTagline] = useState("");
  const [slug, setSlug] = useState("");
  const [originalSlug, setOriginalSlug] = useState("");
  const [savingStore, setSavingStore] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [secondaryColor, setSecondaryColor] = useState("#ec4899");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [rcNumber, setRcNumber] = useState("");
  const [nifNumber, setNifNumber] = useState("");
  const [aiNumber, setAiNumber] = useState("");
  const [savingBusiness, setSavingBusiness] = useState(false);

  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactAddress, setContactAddress] = useState("");
  const [savingContact, setSavingContact] = useState(false);

  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [savingSocials, setSavingSocials] = useState(false);

  const [paymentsEnabled, setPaymentsEnabled] = useState(false);
  const [payoutEmail, setPayoutEmail] = useState("");
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [savingPayments, setSavingPayments] = useState(false);

  const [tvaRate, setTvaRate] = useState("19");
  const [savingTax, setSavingTax] = useState(false);

  const [plan, setPlan] = useState("free");
  const [credits, setCredits] = useState(0);
  const [planRenewsAt, setPlanRenewsAt] = useState<string | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("profiles")
      .select("name, avatar_url, plan, credits, plan_renews_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.name ?? "");
        setAvatarUrl(data?.avatar_url ?? null);
        setPlan(data?.plan ?? "free");
        setCredits(data?.credits ?? 0);
        setPlanRenewsAt(data?.plan_renews_at ?? null);
      });

    (supabase as any)
      .from("store_settings")
      .select(
        "store_name, tagline, slug, logo_url, store_favicon_url, primary_color, secondary_color, accent_color, contact_address, footer_socials, rc_number, nif_number, ai_number, whatsapp_number, tva_rate",
      )
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: any }) => {
        if (!data) return;
        setStoreName(data.store_name ?? "");
        setTagline(data.tagline ?? "");
        setSlug(data.slug ?? "");
        setOriginalSlug(data.slug ?? "");
        setLogoUrl(data.logo_url ?? null);
        setFaviconUrl(data.store_favicon_url ?? "");
        setPrimaryColor(data.primary_color ?? "#7c3aed");
        setSecondaryColor(data.secondary_color ?? "#ec4899");
        setAccentColor(data.accent_color ?? "#f59e0b");
        setContactAddress(data.contact_address ?? "");
        setRcNumber(data.rc_number ?? "");
        setNifNumber(data.nif_number ?? "");
        setAiNumber(data.ai_number ?? "");
        setWhatsapp(data.whatsapp_number ?? "");
        setTvaRate(String(data.tva_rate ?? 19));
        const socials = (data.footer_socials as Record<string, string>) ?? {};
        setInstagram(socials.instagram ?? "");
        setFacebook(socials.facebook ?? "");
        setTiktok(socials.tiktok ?? "");
      });

    supabase
      .from("store_contact_info")
      .select("contact_email, contact_phone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setContactEmail(data?.contact_email ?? user?.email ?? "");
        setContactPhone(data?.contact_phone ?? "");
      });

    const raw = localStorage.getItem(`payments:${user.id}`);
    let localFallback: { enabled?: boolean; currency?: string; payoutEmail?: string } | null =
      null;
    if (raw) {
      try {
        localFallback = JSON.parse(raw);
      } catch {}
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
        if (error && error.code !== "PGRST116") toast.error(error.message);
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
        if (!migrateErr) localStorage.removeItem(`payments:${user.id}`);
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
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be smaller than 5MB");
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setUploadingAvatar(false);
      return toast.error(uploadError.message);
    }
    const { data: pub } = supabase.storage.from("store-assets").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", user.id);
    setUploadingAvatar(false);
    if (updateError) return toast.error(updateError.message);
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
    if (error) return toast.error(error.message);
    setAvatarUrl(null);
    window.dispatchEvent(new Event("profile:updated"));
    toast.success("Avatar removed");
  };

  const uploadImage = async (
    file: File,
    folder: string,
    maxSizeMB: number,
  ): Promise<string | null> => {
    if (!user) return null;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return null;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${maxSizeMB}MB`);
      return null;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/${folder}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data: pub } = supabase.storage.from("store-assets").getPublicUrl(path);
    return pub.publicUrl;
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
    if (!cleaned) return toast.error("Please enter a valid URL");
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

  const saveBranding = async () => {
    if (!user) return;
    setSavingBranding(true);
    const { error } = await supabase
      .from("store_settings")
      .update({
        logo_url: logoUrl,
        store_favicon_url: faviconUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
      })
      .eq("user_id", user.id);
    setSavingBranding(false);
    if (error) toast.error(error.message);
    else toast.success("Branding saved");
  };

  const saveBusiness = async () => {
    if (!user) return;
    setSavingBusiness(true);
    const { error } = await supabase
      .from("store_settings")
      .update({
        rc_number: rcNumber,
        nif_number: nifNumber,
        ai_number: aiNumber,
      })
      .eq("user_id", user.id);
    setSavingBusiness(false);
    if (error) toast.error(error.message);
    else toast.success("Business info saved");
  };

  const saveContact = async () => {
    if (!user) return;
    setSavingContact(true);
    const [err1, err2] = await Promise.all([
      supabase
        .from("store_settings")
        .update({ contact_address: contactAddress })
        .eq("user_id", user.id),
      supabase.from("store_contact_info").upsert(
        {
          user_id: user.id,
          contact_email: contactEmail,
          contact_phone: contactPhone,
        },
        { onConflict: "user_id" },
      ),
    ]);
    setSavingContact(false);
    if (err1.error) return toast.error(err1.error.message);
    if (err2.error) return toast.error(err2.error.message);
    toast.success("Contact info saved");
  };

  const saveSocials = async () => {
    if (!user) return;
    setSavingSocials(true);
    const [err1, err2] = await Promise.all([
      supabase
        .from("store_settings")
        .update({
          whatsapp_number: whatsapp,
          footer_socials: { instagram, facebook, tiktok },
        })
        .eq("user_id", user.id),
      supabase.from("store_contact_info").upsert(
        {
          user_id: user.id,
          contact_phone: contactPhone || whatsapp,
        },
        { onConflict: "user_id" },
      ),
    ]);
    setSavingSocials(false);
    if (err1.error) return toast.error(err1.error.message);
    if (err2.error) return toast.error(err2.error.message);
    toast.success("Social links saved");
  };

  const savePayments = async () => {
    if (!user) return;
    setSavingPayments(true);
    const { error } = await supabase.from("payment_settings").upsert(
      {
        user_id: user.id,
        enabled: paymentsEnabled,
        currency: "DZD",
        payout_email: payoutEmail.trim(),
      },
      { onConflict: "user_id" },
    );
    setSavingPayments(false);
    if (error) return toast.error(error.message);
    localStorage.removeItem(`payments:${user.id}`);
    toast.success("Payment preferences saved");
  };

  const saveTax = async () => {
    if (!user) return;
    const rate = parseFloat(tvaRate);
    if (isNaN(rate) || rate < 0 || rate > 100) return toast.error("Invalid TVA rate");
    setSavingTax(true);
    const { error } = await supabase
      .from("store_settings")
      .update({ tva_rate: rate })
      .eq("user_id", user.id);
    setSavingTax(false);
    if (error) toast.error(error.message);
    else toast.success("Tax settings saved");
  };

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return toast.error("Session expired. Please sign in again.");
    setDeleting(true);
    try {
      await deleteAccount({ data: { accessToken: token } });
      toast.success("Your account has been deleted.");
      await supabase.auth.signOut();
      navigate({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete account");
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

  const planLabels: Record<string, { label: string; color: string }> = {
    free: { label: "Free", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    trial: { label: "Trial", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    basic: { label: "Basic", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
    pro: { label: "Pro", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" },
    business: { label: "Business", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
  };

  const currentPlan = planLabels[plan] ?? planLabels.free;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, store, and account preferences."
        icon={Settings}
        gradient="from-slate-500 via-zinc-500 to-stone-500"
      />

      {/* Profile */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Profile</h2>
              <p className="text-sm text-muted-foreground">
                Personal information for your account.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 border-2 border-border/60">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={name || "Avatar"} /> : null}
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-lg font-semibold">
                {(name || user?.email || "U")
                  .split(/[\s@]/)[0]
                  .slice(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Profile photo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
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
                  className="rounded-lg"
                >
                  <Upload className="size-3.5 mr-1.5" />
                  {uploadingAvatar ? "Uploading…" : avatarUrl ? "Replace" : "Upload"}
                </Button>
                {avatarUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={removeAvatar}
                    disabled={uploadingAvatar}
                    className="rounded-lg"
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Full name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input value={user?.email ?? ""} disabled className="rounded-xl bg-muted/50" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveProfile} disabled={savingProfile} className="rounded-xl">
              {savingProfile ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </div>
      </section>

      {/* Store */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <Store className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Store</h2>
              <p className="text-sm text-muted-foreground">
                Your store name and tagline shown across the storefront.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Store name</Label>
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
                  if (error) toast.error(error.message);
                  else {
                    setStoreName(val);
                    toast.success("Store name updated");
                  }
                }}
                placeholder="My Store"
                maxLength={60}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tagline</Label>
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
                  if (error) toast.error(error.message);
                  else {
                    setTagline(val);
                    toast.success("Tagline updated");
                  }
                }}
                placeholder="Beautiful things, thoughtfully made."
                maxLength={120}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Store Branding */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white">
              <Palette className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Branding</h2>
              <p className="text-sm text-muted-foreground">
                Store logo, favicon, and brand colors.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border/60 flex items-center justify-center overflow-hidden bg-muted/30">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Store className="size-6 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Store logo</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Shown in the storefront header. Recommended: 200×200px.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setUploadingLogo(true);
                    const url = await uploadImage(f, "logo", 5);
                    if (url) {
                      setLogoUrl(url);
                      if (user) {
                        await supabase
                          .from("store_settings")
                          .update({ logo_url: url })
                          .eq("user_id", user.id);
                      }
                      toast.success("Logo uploaded");
                    }
                    setUploadingLogo(false);
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="rounded-lg"
                >
                  <Upload className="size-3.5 mr-1.5" />
                  {uploadingLogo ? "Uploading…" : logoUrl ? "Replace" : "Upload"}
                </Button>
                {logoUrl && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (!user) return;
                      setLogoUrl(null);
                      await supabase
                        .from("store_settings")
                        .update({ logo_url: null })
                        .eq("user_id", user.id);
                      toast.success("Logo removed");
                    }}
                    disabled={uploadingLogo}
                    className="rounded-lg"
                  >
                    <Trash2 className="size-3.5 mr-1.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Favicon */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Favicon URL</Label>
            <Input
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://example.com/favicon.ico"
              className="rounded-xl"
            />
            <p className="text-xs text-muted-foreground">
              Small icon shown in browser tabs. Leave empty for default.
            </p>
          </div>

          <div className="h-px bg-border/50" />

          {/* Brand Colors */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Brand colors</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="size-5 rounded-md border border-border/60"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Label className="text-xs text-muted-foreground">Primary</Label>
                </div>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-input focus-within:ring-1 focus-within:ring-ring">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="size-10 cursor-pointer border-none bg-transparent"
                  />
                  <input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-transparent px-3 text-sm font-mono outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="size-5 rounded-md border border-border/60"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <Label className="text-xs text-muted-foreground">Secondary</Label>
                </div>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-input focus-within:ring-1 focus-within:ring-ring">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="size-10 cursor-pointer border-none bg-transparent"
                  />
                  <input
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-transparent px-3 text-sm font-mono outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="size-5 rounded-md border border-border/60"
                    style={{ backgroundColor: accentColor }}
                  />
                  <Label className="text-xs text-muted-foreground">Accent</Label>
                </div>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-input focus-within:ring-1 focus-within:ring-ring">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="size-10 cursor-pointer border-none bg-transparent"
                  />
                  <input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 bg-transparent px-3 text-sm font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveBranding} disabled={savingBranding} className="rounded-xl">
              {savingBranding ? "Saving…" : "Save branding"}
            </Button>
          </div>
        </div>
      </section>

      {/* Domain & URL */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-500 text-white">
              <Globe className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Domain & URL</h2>
              <p className="text-sm text-muted-foreground">
                Choose the public address customers use to find your store.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Store URL</Label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
              <span className="flex items-center px-3.5 text-sm text-muted-foreground bg-muted/50 border-r border-input">
                /s/
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-shop"
                className="flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and dashes. Must be unique.
            </p>
          </div>

          {originalSlug && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-muted/30 p-3.5">
              <Badge variant="secondary" className="rounded-full text-xs">
                Live
              </Badge>
              <code className="text-sm text-muted-foreground truncate flex-1 min-w-0">
                {storeUrl}
              </code>
              <Button size="sm" variant="ghost" onClick={copyUrl} className="rounded-lg">
                <Copy className="size-3.5 mr-1" /> Copy
              </Button>
              <Button size="sm" variant="outline" asChild className="rounded-lg">
                <Link to="/s/$slug" params={{ slug: originalSlug }}>
                  <ExternalLink className="size-3.5 mr-1" /> View
                </Link>
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-dashed border-border/60 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Custom domain</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect a domain you own (e.g. mystore.com). Coming soon.
              </p>
            </div>
            <Button size="sm" variant="outline" disabled className="rounded-lg shrink-0">
              Connect
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={saveDomain}
              disabled={savingDomain || slug === originalSlug}
              className="rounded-xl"
            >
              {savingDomain ? "Saving…" : "Save URL"}
            </Button>
          </div>
        </div>
      </section>

      {/* Business Info */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Business Info</h2>
              <p className="text-sm text-muted-foreground">
                Legal registration numbers for invoices and bordereau.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">RC Number</Label>
              <Input
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                placeholder="12345/A/00"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Registre de Commerce</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">NIF Number</Label>
              <Input
                value={nifNumber}
                onChange={(e) => setNifNumber(e.target.value)}
                placeholder="1234567890"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Numéro d'Identification Fiscale</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">AI Number</Label>
              <Input
                value={aiNumber}
                onChange={(e) => setAiNumber(e.target.value)}
                placeholder="1234567890"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Identifiant d'Activité</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveBusiness} disabled={savingBusiness} className="rounded-xl">
              {savingBusiness ? "Saving…" : "Save business info"}
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Info */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
              <Phone className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Contact Info</h2>
              <p className="text-sm text-muted-foreground">
                Phone, email, and address shown on your contact page.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone number</Label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+213 555 00 00 00"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Contact email</Label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@mystore.com"
                className="rounded-xl"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Address</Label>
            <Input
              value={contactAddress}
              onChange={(e) => setContactAddress(e.target.value)}
              placeholder="123 Rue Didouche Mourad, Algiers"
              className="rounded-xl"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={saveContact} disabled={savingContact} className="rounded-xl">
              {savingContact ? "Saving…" : "Save contact info"}
            </Button>
          </div>
        </div>
      </section>

      {/* Social Links */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-purple-500 text-white">
              <Share2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Social Links</h2>
              <p className="text-sm text-muted-foreground">
                Connect your social media accounts and WhatsApp.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">WhatsApp number</Label>
            <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
              <span className="flex items-center px-3 text-muted-foreground bg-muted/50 border-r border-input">
                <MessageCircle className="size-4" />
              </span>
              <input
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+213 555 00 00 00"
                className="flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              With country code. Customers can message you directly.
            </p>
          </div>

          <div className="h-px bg-border/50" />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Instagram</Label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                <span className="flex items-center px-3 text-muted-foreground bg-muted/50 border-r border-input">
                  <Instagram className="size-4" />
                </span>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="username"
                  className="flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Facebook</Label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                <span className="flex items-center px-3 text-muted-foreground bg-muted/50 border-r border-input">
                  <Facebook className="size-4" />
                </span>
                <input
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="page-name"
                  className="flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">TikTok</Label>
              <div className="flex items-stretch overflow-hidden rounded-xl border border-input bg-background focus-within:ring-1 focus-within:ring-ring">
                <span className="flex items-center px-3 text-muted-foreground bg-muted/50 border-r border-input">
                  <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.27 8.27 0 005.58 2.17v-3.45a4.85 4.85 0 01-3.77-1.56V6.69h3.77z" />
                  </svg>
                </span>
                <input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="username"
                  className="flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={saveSocials} disabled={savingSocials} className="rounded-xl">
              {savingSocials ? "Saving…" : "Save social links"}
            </Button>
          </div>
        </div>
      </section>

      {/* Payments */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
              <CreditCard className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Payments</h2>
              <p className="text-sm text-muted-foreground">
                Configure how you accept payments from customers.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4">
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
              <Label className="text-sm font-medium">Currency</Label>
              <div className="flex h-10 w-full rounded-xl border bg-muted/50 px-3.5 py-2 text-sm text-muted-foreground">
                DZD
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payout email</Label>
              <Input
                type="email"
                value={payoutEmail}
                onChange={(e) => setPayoutEmail(e.target.value)}
                placeholder="you@example.com"
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-border/60 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Connect a payment provider</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Enable Chargily to accept CIB or EDAHABIA payments.
              </p>
            </div>
            <Button size="sm" variant="outline" disabled className="rounded-lg shrink-0">
              Connect
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={savePayments}
              disabled={savingPayments || !paymentsLoaded}
              className="rounded-xl"
            >
              {savingPayments ? "Saving…" : "Save payments"}
            </Button>
          </div>
        </div>
      </section>

      {/* Tax / TVA */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <Receipt className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Tax / TVA</h2>
              <p className="text-sm text-muted-foreground">
                Configure the VAT rate applied to your products.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">TVA rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={tvaRate}
                onChange={(e) => setTvaRate(e.target.value)}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Standard rate in Algeria is 19%. Set to 0 for exempt products.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div className="flex h-10 w-full items-center rounded-xl border bg-muted/50 px-3.5 text-sm text-muted-foreground">
                {tvaRate}% TVA included in prices
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveTax} disabled={savingTax} className="rounded-xl">
              {savingTax ? "Saving…" : "Save tax settings"}
            </Button>
          </div>
        </div>
      </section>

      {/* Current Plan */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white">
              <Crown className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Current Plan</h2>
              <p className="text-sm text-muted-foreground">
                Your subscription plan and credit balance.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Plan</p>
              <div className="flex items-center gap-2">
                <Badge className={`rounded-full text-xs ${currentPlan.color}`}>
                  {currentPlan.label}
                </Badge>
                {plan === "trial" && planRenewsAt && (
                  <span className="text-xs text-muted-foreground">
                    renews {new Date(planRenewsAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border/60 p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Credits</p>
              <p className="text-2xl font-bold">{credits.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border/60 p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
              <Badge
                variant={plan !== "free" ? "default" : "secondary"}
                className="rounded-full text-xs"
              >
                {plan !== "free" ? "Active" : "No plan"}
              </Badge>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" asChild className="rounded-xl">
              <Link to="/dashboard/upgrade">
                {plan === "free" ? "Upgrade plan" : "Manage plan"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white">
              <Shield className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Security</h2>
              <p className="text-sm text-muted-foreground">
                Manage your session and account access.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Sign out</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                End your session on this device.
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="rounded-xl">
              <LogOut className="size-4 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-destructive/30 bg-card overflow-hidden">
        <div className="px-6 py-5 border-b border-destructive/20">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-destructive">Danger Zone</h2>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data.
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between gap-4">
            <div className="text-sm">
              <p className="font-medium">This will remove:</p>
              <ul className="mt-1 list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                <li>Your profile, store, products, orders, and customers</li>
                <li>All settings, integrations, and credits</li>
              </ul>
            </div>
            <AlertDialog onOpenChange={(o) => { if (!o) setDeleteConfirm(""); }}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-xl shrink-0">
                  <Trash2 className="size-3.5 mr-1.5" />
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
                  <Label className="text-sm">
                    Type <span className="font-mono font-semibold">DELETE</span> to confirm
                  </Label>
                  <Input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder="DELETE"
                    autoComplete="off"
                    className="rounded-xl"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
                    disabled={deleting || deleteConfirm !== "DELETE"}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deleting…" : "Delete forever"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </section>
    </div>
  );
}
