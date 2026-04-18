import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Check, ArrowRight, ArrowLeft, Upload, Store, Link2, DollarSign, ImageIcon, Sparkles, Facebook, Instagram, Music2, Youtube, Users, Search, MoreHorizontal, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  initialName?: string;
  onComplete: () => void;
}

const CURRENCIES = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "DZD", label: "Algerian Dinar (DA)" },
  { code: "MAD", label: "Moroccan Dirham (DH)" },
  { code: "TND", label: "Tunisian Dinar (DT)" },
  { code: "EGP", label: "Egyptian Pound (E£)" },
  { code: "SAR", label: "Saudi Riyal (SR)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "CAD", label: "Canadian Dollar (C$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
];

const SOURCES = [
  { value: "facebook", label: "Facebook", Icon: Facebook },
  { value: "instagram", label: "Instagram", Icon: Instagram },
  { value: "tiktok", label: "TikTok", Icon: Music2 },
  { value: "youtube", label: "YouTube", Icon: Youtube },
  { value: "referral", label: "Friend / Referral", Icon: Users },
  { value: "google", label: "Google Search", Icon: Search },
  { value: "other", label: "Other", Icon: MoreHorizontal },
];

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar",
  "Blida","Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Algiers",
  "Djelfa","Jijel","Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma",
  "Constantine","Médéa","Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh",
  "Illizi","Bordj Bou Arréridj","Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued",
  "Khenchela","Souk Ahras","Tipaza","Mila","Aïn Defla","Naâma","Aïn Témouchent",
  "Ghardaïa","Relizane","Timimoun","Bordj Badji Mokhtar","Ouled Djellal","Béni Abbès",
  "In Salah","In Guezzam","Touggourt","Djanet","El M'Ghair","El Meniaa",
];

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 32);
}

export function OnboardingWizard({ userId, initialName, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [storeName, setStoreName] = useState(initialName ? `${initialName}'s Store` : "");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [source, setSource] = useState<string>("");
  const [wilaya, setWilaya] = useState<string>("");
  const [wilayaSearch, setWilayaSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredWilayas = useMemo(() => {
    const q = wilayaSearch.trim().toLowerCase();
    if (!q) return WILAYAS;
    return WILAYAS.filter((w) => w.toLowerCase().includes(q));
  }, [wilayaSearch]);

  // Auto-derive slug from store name until user edits it
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(storeName));
  }, [storeName, slugTouched]);

  // Debounced slug availability check
  useEffect(() => {
    if (!slug || slug.length < 3) {
      setSlugAvailable(null);
      return;
    }
    setSlugChecking(true);
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("user_id")
        .eq("slug", slug)
        .maybeSingle();
      setSlugAvailable(!data || data.user_id === userId);
      setSlugChecking(false);
    }, 400);
    return () => clearTimeout(handle);
  }, [slug, userId]);

  const handleLogoSelect = (file: File | null) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const steps = [
    {
      title: "Where did you hear about us?",
      subtitle: "Help us understand how you found Storely.",
      icon: Sparkles,
      valid: source.length > 0,
    },
    {
      title: "Where do you live?",
      subtitle: "Pick your wilaya so we can tailor your experience.",
      icon: MapPin,
      valid: wilaya.length > 0,
    },
    {
      title: "Name your store",
      subtitle: "This appears on your storefront and in browser tabs.",
      icon: Store,
      valid: storeName.trim().length >= 2,
    },
    {
      title: "Choose your URL",
      subtitle: "Your storefront will live at storely.app/s/your-slug.",
      icon: Link2,
      valid: slug.length >= 3 && slugAvailable === true,
    },
    {
      title: "Pick a currency",
      subtitle: "We'll use this for product prices across your store.",
      icon: DollarSign,
      valid: currency.length > 0,
    },
    {
      title: "Add a logo",
      subtitle: "Optional — you can upload one later from Settings.",
      icon: ImageIcon,
      valid: true,
    },
  ];

  const current = steps[step];
  const progress = ((step + 1) / steps.length) * 100;

  const next = () => {
    if (!current.valid) return;
    if (step < steps.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const back = () => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const finish = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      let logoUrl: string | null = null;
      if (logoFile) {
        const ext = logoFile.name.split(".").pop() || "png";
        const path = `${userId}/logo-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("store-assets")
          .upload(path, logoFile, { upsert: true });
        if (upErr) throw upErr;
        logoUrl = supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl;
      }

      // Upsert store settings
      const { error: storeErr } = await supabase
        .from("store_settings")
        .upsert(
          {
            user_id: userId,
            slug,
            store_name: storeName.trim(),
            currency,
            ...(logoUrl ? { logo_url: logoUrl } : {}),
          },
          { onConflict: "user_id" },
        );
      if (storeErr) throw storeErr;

      // Mark profile as onboarded and save discovery source + wilaya
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ onboarded: true, source_of_user: source || null, user_wilaya: wilaya || null })
        .eq("id", userId);
      if (profErr) throw profErr;

      toast.success("You're all set! Welcome to Storely 🎉");
      onComplete();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 sm:p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                Step {step + 1} of {steps.length}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i < step ? "w-1.5 bg-primary" : i === step ? "w-6 bg-primary" : "w-1.5 bg-muted",
                  )}
                />
              ))}
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight">{current.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{current.subtitle}</p>
          </div>

          {/* Step content with slide transition */}
          <div
            key={step}
            className={cn(
              "min-h-[140px]",
              direction === 1
                ? "animate-in slide-in-from-right-4 fade-in duration-300"
                : "animate-in slide-in-from-left-4 fade-in duration-300",
            )}
          >
            {step === 0 && (
              <div className="grid grid-cols-2 gap-2">
                {SOURCES.map(({ value, label, Icon: SrcIcon }) => {
                  const selected = source === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSource(value)}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-lg border p-3 text-left text-sm transition-all",
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/40",
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-colors",
                          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <SrcIcon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{label}</span>
                      {selected && <Check className="h-4 w-4 text-primary ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-2">
                <Label htmlFor="wilaya-search">Your wilaya</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="wilaya-search"
                    autoFocus
                    value={wilayaSearch}
                    onChange={(e) => setWilayaSearch(e.target.value)}
                    placeholder="Search wilayas…"
                    className="pl-9"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto rounded-md border border-input bg-background">
                  {filteredWilayas.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">No matches</div>
                  ) : (
                    filteredWilayas.map((w) => {
                      const selected = wilaya === w;
                      return (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWilaya(w)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors",
                            selected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/60",
                          )}
                        >
                          <span>{w}</span>
                          {selected && <Check className="h-4 w-4" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-2">
                <Label htmlFor="store-name">Store name</Label>
                <Input
                  id="store-name"
                  autoFocus
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Acme Goods"
                  maxLength={60}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-2">
                <Label htmlFor="store-slug">Store URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    storely.app/s/
                  </span>
                  <Input
                    id="store-slug"
                    autoFocus
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    placeholder="acme-goods"
                    maxLength={32}
                  />
                </div>
                <div className="text-xs h-4">
                  {slug.length > 0 && slug.length < 3 && (
                    <span className="text-muted-foreground">At least 3 characters</span>
                  )}
                  {slug.length >= 3 && slugChecking && (
                    <span className="text-muted-foreground inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Checking…
                    </span>
                  )}
                  {slug.length >= 3 && !slugChecking && slugAvailable === true && (
                    <span className="text-emerald-600 inline-flex items-center gap-1">
                      <Check className="h-3 w-3" /> Available
                    </span>
                  )}
                  {slug.length >= 3 && !slugChecking && slugAvailable === false && (
                    <span className="text-destructive">Already taken — try another</span>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-2">
                <Label htmlFor="currency-select">Default currency</Label>
                <select
                  id="currency-select"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-3">
                <Label>Logo (optional)</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleLogoSelect(e.target.files?.[0] ?? null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {logoFile ? "Change logo" : "Upload logo"}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      PNG, JPG, or SVG · up to 2MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer buttons */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={back}
              disabled={step === 0 || submitting}
              className={cn(step === 0 && "invisible")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={next} disabled={!current.valid}>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={finish} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Setting up…
                  </>
                ) : (
                  <>
                    Finish
                    <Check className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
