import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Coins,
  Check,
  Sparkles,
  Upload,
  Infinity as InfinityIcon,
  Gift,
  Zap,
  Crown,
  Rocket,
  Star,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useCredits, PLAN_LABELS } from "@/hooks/use-credits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/credits")({
  component: CreditsPage,
  head: () => ({ meta: [{ title: "Credits — Storely" }] }),
});

const PACK_DEFS = [
  { id: "pack_50", credits: 50, price: 500, badge: null as null | "popular" | "bestValue", icon: Zap, gradient: "from-sky-500 via-blue-500 to-indigo-500" },
  { id: "pack_150", credits: 150, price: 1200, badge: "popular" as const, icon: Sparkles, gradient: "from-violet-500 via-fuchsia-500 to-pink-500" },
  { id: "pack_500", credits: 500, price: 3500, badge: "bestValue" as const, icon: Rocket, gradient: "from-amber-500 via-orange-500 to-rose-500" },
];

const PLAN_DEFS = [
  { id: "basic", credits: 100, price: 1500, perks: ["basic1", "basic2", "basic3"] as const, highlight: false, icon: Star, gradient: "from-emerald-500 via-teal-500 to-cyan-500" },
  { id: "pro", credits: 300, price: 3500, perks: ["pro1", "pro2", "pro3"] as const, highlight: true, icon: TrendingUp, gradient: "from-violet-500 via-fuchsia-500 to-pink-500" },
  { id: "business", credits: 2000, price: 9000, perks: ["biz1", "biz2", "biz3"] as const, highlight: false, icon: Crown, gradient: "from-amber-400 via-yellow-500 to-orange-500" },
];

const CCP = "0012345678 91 — STORELY SARL";

function CreditsPage() {
  const { user } = useAuth();
  const { credits, plan, refresh } = useCredits();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"packs" | "plans">("packs");
  const [selected, setSelected] = useState<string>("pack_150");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allOptions = [...PACK_DEFS, ...PLAN_DEFS];
  const choice = allOptions.find((x) => x.id === selected) ?? PACK_DEFS[1];

  useEffect(() => {
    setSelected(tab === "packs" ? "pack_150" : "pro");
  }, [tab]);

  const submit = async () => {
    if (!user) return;
    if (!file) return toast.error(t("dashboard.credits.errors.needScreenshot"));
    if (!file.type.startsWith("image/")) return toast.error(t("dashboard.credits.errors.mustBeImage"));
    if (file.size > 5 * 1024 * 1024) return toast.error(t("dashboard.credits.errors.tooLarge"));

    setSubmitting(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/${Date.now()}-${choice.id}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) {
      setSubmitting(false);
      return toast.error(upErr.message);
    }
    const { error } = await supabase.from("payment_submissions").insert({
      user_id: user.id,
      plan: choice.id,
      amount: choice.price,
      payment_method: "ccp",
      proof_url: path,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success(t("dashboard.credits.submitted"));
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    refresh();
  };

  const planName = (id: string) => {
    if (id === "basic") return t("dashboard.credits.planBasic");
    if (id === "pro") return t("dashboard.credits.planPro");
    if (id === "business") return t("dashboard.credits.planBusiness");
    return id;
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="relative max-w-6xl mx-auto space-y-10 pb-12">
      {/* Decorative background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/20 to-transparent blur-3xl" />
        <div className="absolute top-40 -right-32 size-[28rem] rounded-full bg-gradient-to-br from-cyan-400/25 via-blue-500/15 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-gradient-to-tr from-amber-400/20 via-pink-400/15 to-transparent blur-3xl" />
      </div>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 p-8 sm:p-12 text-white shadow-[0_20px_70px_-20px_rgba(139,92,246,0.5)]">
        <div aria-hidden className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px, 60px 60px" }} />
        <div aria-hidden className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-10 size-72 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <Badge className="bg-white/20 hover:bg-white/20 backdrop-blur border-white/30 text-white">
              <Sparkles className="size-3 mr-1" /> {t("dashboard.credits.eyebrow")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight">{t("dashboard.credits.title")}</h1>
            <p className="text-white/80 text-lg">{t("dashboard.credits.description")}</p>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-4">
            <div className="size-14 grid place-items-center rounded-xl bg-gradient-to-br from-white/30 to-white/10 border border-white/30">
              <Coins className="size-7" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/70">{t("dashboard.credits.yourCredits")}</div>
              <div className="text-3xl font-bold leading-tight">{plan === "business" ? "∞" : credits}</div>
              <div className="text-xs text-white/70 mt-0.5">{PLAN_LABELS[plan]}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-border/60 hover:shadow-lg transition-shadow">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="size-12 grid place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
              <Coins className="size-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.credits.yourCredits")}</div>
              <div className="text-2xl font-bold">{plan === "business" ? "∞" : credits}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-border/60 hover:shadow-lg transition-shadow">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="size-12 grid place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30">
              <Sparkles className="size-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.credits.yourPlan")}</div>
              <div className="text-2xl font-bold">{PLAN_LABELS[plan]}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-border/60 hover:shadow-lg transition-shadow group">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="size-12 grid place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
              <Gift className="size-6" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.credits.inviteFriends")}</div>
              <Link to="/dashboard/referrals" className="text-base font-semibold text-foreground hover:text-primary transition-colors">
                {t("dashboard.credits.earnPerFriend")} →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex items-center p-1 rounded-full border border-border/60 bg-card shadow-soft">
          <button
            onClick={() => setTab("packs")}
            className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${
              tab === "packs" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("dashboard.credits.tabPacks")}
          </button>
          <button
            onClick={() => setTab("plans")}
            className={`px-6 py-2.5 text-sm font-semibold rounded-full transition-all ${
              tab === "plans" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("dashboard.credits.tabPlans")}
          </button>
        </div>
      </div>

      {/* Cards grid */}
      {tab === "packs" ? (
        <div className="grid md:grid-cols-3 gap-5">
          {PACK_DEFS.map((p) => {
            const active = selected === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`group relative overflow-hidden ${isRtl ? "text-right" : "text-left"} rounded-3xl border p-6 transition-all duration-300 ${
                  active
                    ? "border-transparent ring-2 ring-primary shadow-[0_20px_50px_-15px_rgba(139,92,246,0.4)] scale-[1.02]"
                    : "border-border/60 bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
                }`}
              >
                <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${p.gradient} ${active ? "opacity-10" : "opacity-0 group-hover:opacity-[0.06]"} transition-opacity`} />
                <div aria-hidden className={`absolute -top-12 -right-12 size-40 rounded-full bg-gradient-to-br ${p.gradient} opacity-20 blur-2xl`} />

                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`size-12 grid place-items-center rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-lg`}>
                      <Icon className="size-6" />
                    </div>
                    {p.badge && (
                      <Badge className={`bg-gradient-to-r ${p.gradient} text-white border-0 shadow-md`}>
                        {t(`dashboard.credits.${p.badge}`)}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-muted-foreground">{t("dashboard.credits.packName", { count: p.credits })}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-4xl font-bold font-display bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {p.price.toLocaleString()}
                    </div>
                    <span className="text-sm text-muted-foreground">{t("dashboard.credits.currency")}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Coins className="size-4 text-primary" />
                    <span className="font-semibold">{p.credits}</span>
                    <span className="text-muted-foreground">{t("dashboard.credits.creditsLabel")}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{t("dashboard.credits.addedAfterReview")}</div>
                  {active && (
                    <div className="mt-4 flex items-center gap-1.5 text-primary text-sm font-medium">
                      <div className="size-5 grid place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </div>
                      {t("dashboard.credits.selected")}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {PLAN_DEFS.map((p) => {
            const active = selected === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={`group relative overflow-hidden ${isRtl ? "text-right" : "text-left"} rounded-3xl border p-6 transition-all duration-300 ${
                  active
                    ? "border-transparent ring-2 ring-primary shadow-[0_20px_50px_-15px_rgba(139,92,246,0.4)] scale-[1.02]"
                    : p.highlight
                      ? "border-primary/40 bg-card hover:shadow-xl hover:-translate-y-1"
                      : "border-border/60 bg-card hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
                }`}
              >
                <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${p.gradient} ${active ? "opacity-10" : "opacity-0 group-hover:opacity-[0.06]"} transition-opacity`} />
                <div aria-hidden className={`absolute -top-12 -right-12 size-40 rounded-full bg-gradient-to-br ${p.gradient} opacity-20 blur-2xl`} />

                <div className="relative">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`size-12 grid place-items-center rounded-2xl bg-gradient-to-br ${p.gradient} text-white shadow-lg`}>
                      <Icon className="size-6" />
                    </div>
                    {p.highlight && (
                      <Badge className={`bg-gradient-to-r ${p.gradient} text-white border-0 shadow-md`}>
                        {t("dashboard.credits.best")}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold">{planName(p.id)}</h3>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-4xl font-bold font-display bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      {p.price.toLocaleString()}
                    </div>
                    <span className="text-sm text-muted-foreground">{t("dashboard.credits.perMonth")}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    {p.id === "business" ? (
                      <>
                        <InfinityIcon className="size-4 text-primary" />
                        <span className="font-semibold">{t("dashboard.credits.trulyUnlimited")}</span>
                      </>
                    ) : (
                      <>
                        <Coins className="size-4 text-primary" />
                        <span className="font-semibold">{p.credits}</span>
                        <span className="text-muted-foreground">{t("dashboard.credits.monthlyCredits")}</span>
                      </>
                    )}
                  </div>
                  <div className="mt-5 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  <ul className="mt-4 space-y-2 text-sm">
                    {p.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2">
                        <div className={`mt-0.5 size-4 grid place-items-center rounded-full bg-gradient-to-br ${p.gradient} text-white shrink-0`}>
                          <Check className="size-2.5" />
                        </div>
                        <span>{t(`dashboard.credits.perks.${perk}`)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Payment proof card */}
      <Card className="relative overflow-hidden border-border/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)]">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5" />
        <div aria-hidden className="absolute -top-24 -right-24 size-64 rounded-full bg-violet-500/10 blur-3xl" />

        <CardContent className="relative p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="size-12 grid place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 shrink-0">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h3 className="font-semibold text-xl font-display">{t("dashboard.credits.proofTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t("dashboard.credits.transferVia")}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-muted/60 to-muted/30 border border-border/60 p-5 font-mono text-base tracking-wide">
            {CCP}
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-fuchsia-500/10 border-2 border-primary/20 p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.credits.amountDue")}</div>
              <div className="text-3xl font-bold font-display mt-1 bg-gradient-to-br from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                {choice.price.toLocaleString()} <span className="text-base text-muted-foreground font-normal">{t("dashboard.credits.currency")}</span>
              </div>
            </div>
            <div className={isRtl ? "sm:text-left" : "sm:text-right"}>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.credits.youGet")}</div>
              <div className="text-3xl font-bold font-display mt-1 flex items-baseline gap-2 sm:justify-end">
                <Coins className="size-6 text-primary" />
                {choice.credits} <span className="text-base text-muted-foreground font-normal">{t("dashboard.credits.creditsLabel")}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("dashboard.credits.screenshotLabel")}</Label>
            <label
              htmlFor="proof"
              className={`flex items-center gap-4 rounded-2xl border-2 border-dashed px-5 py-5 cursor-pointer transition-all ${
                file ? "border-primary/60 bg-primary/5" : "border-border hover:border-primary/60 hover:bg-muted/30"
              }`}
            >
              <div className={`grid size-12 place-items-center rounded-xl shrink-0 transition-all ${
                file ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg" : "bg-muted border border-border"
              }`}>
                <Upload className="size-5" />
              </div>
              <div className="text-sm flex-1 min-w-0">
                {file ? (
                  <>
                    <p className="font-semibold truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold">{t("dashboard.credits.uploadCta")}</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.credits.uploadHint")}</p>
                  </>
                )}
              </div>
            </label>
            <input id="proof" ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>

          <Button
            onClick={submit}
            disabled={submitting}
            size="lg"
            className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 hover:from-violet-700 hover:via-fuchsia-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all h-12 text-base font-semibold"
          >
            {submitting ? (
              <>{t("dashboard.credits.submitting")}</>
            ) : (
              <>
                <Sparkles className="size-5" />
                {t("dashboard.credits.submit")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
