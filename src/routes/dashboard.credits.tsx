import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Coins, Check, Sparkles, Upload, Infinity as InfinityIcon, Gift } from "lucide-react";
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
  { id: "pack_50", credits: 50, price: 500, badge: null as null | "popular" | "bestValue" },
  { id: "pack_150", credits: 150, price: 1200, badge: "popular" as const },
  { id: "pack_500", credits: 500, price: 3500, badge: "bestValue" as const },
];

const PLAN_DEFS = [
  { id: "basic", credits: 100, price: 1500, perks: ["basic1", "basic2", "basic3"] as const, highlight: false },
  { id: "pro", credits: 300, price: 3500, perks: ["pro1", "pro2", "pro3"] as const, highlight: true },
  { id: "business", credits: 2000, price: 9000, perks: ["biz1", "biz2", "biz3"] as const, highlight: false },
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
    <div dir={isRtl ? "rtl" : "ltr"} className="max-w-6xl mx-auto space-y-8">
      <PageHeader
        eyebrow={t("dashboard.credits.eyebrow")}
        title={t("dashboard.credits.title")}
        description={t("dashboard.credits.description")}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-lg bg-primary/10 text-primary"><Coins className="size-5" /></div>
          <div><div className="text-xs text-muted-foreground">{t("dashboard.credits.yourCredits")}</div><div className="text-2xl font-bold">{plan === "business" ? "∞" : credits}</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-5" /></div>
          <div><div className="text-xs text-muted-foreground">{t("dashboard.credits.yourPlan")}</div><div className="text-2xl font-bold">{PLAN_LABELS[plan]}</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-lg bg-primary/10 text-primary"><Gift className="size-5" /></div>
          <div className="flex-1">
            <div className="text-xs text-muted-foreground">{t("dashboard.credits.inviteFriends")}</div>
            <Link to="/dashboard/referrals" className="text-sm font-semibold text-primary hover:underline">{t("dashboard.credits.earnPerFriend")}</Link>
          </div>
        </CardContent></Card>
      </div>

      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("packs")} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "packs" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>{t("dashboard.credits.tabPacks")}</button>
        <button onClick={() => setTab("plans")} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === "plans" ? "border-primary text-foreground" : "border-transparent text-muted-foreground"}`}>{t("dashboard.credits.tabPlans")}</button>
      </div>

      {tab === "packs" ? (
        <div className="grid md:grid-cols-3 gap-4">
          {PACK_DEFS.map((p) => {
            const active = selected === p.id;
            return (
              <button key={p.id} onClick={() => setSelected(p.id)} className={`${isRtl ? "text-right" : "text-left"} rounded-2xl border p-6 transition-all ${active ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-soft" : "border-border/60 bg-card hover:border-border"}`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{t("dashboard.credits.packName", { count: p.credits })}</h3>
                  {p.badge && <Badge className="bg-gradient-brand text-brand-foreground border-0">{t(`dashboard.credits.${p.badge}`)}</Badge>}
                </div>
                <div className="mt-4 text-3xl font-bold">{p.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t("dashboard.credits.currency")}</span></div>
                <div className="mt-1 text-sm text-muted-foreground">{p.credits} {t("dashboard.credits.creditsLabel")} · {t("dashboard.credits.addedAfterReview")}</div>
                {active && <div className="mt-3 text-primary text-sm flex items-center gap-1"><Check className="size-4" /> {t("dashboard.credits.selected")}</div>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {PLAN_DEFS.map((p) => {
            const active = selected === p.id;
            return (
              <button key={p.id} onClick={() => setSelected(p.id)} className={`${isRtl ? "text-right" : "text-left"} rounded-2xl border p-6 transition-all ${active ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-soft" : p.highlight ? "border-primary/40 bg-card" : "border-border/60 bg-card hover:border-border"}`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{planName(p.id)}</h3>
                  {p.highlight && <Badge className="bg-gradient-brand text-brand-foreground border-0">{t("dashboard.credits.best")}</Badge>}
                </div>
                <div className="mt-4 text-3xl font-bold">{p.price.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{t("dashboard.credits.perMonth")}</span></div>
                <div className="mt-1 text-sm text-muted-foreground flex items-center gap-1">
                  {p.id === "business" ? (<><InfinityIcon className="size-4" /> {t("dashboard.credits.trulyUnlimited")}</>) : (<>{p.credits} {t("dashboard.credits.monthlyCredits")}</>)}
                </div>
                <ul className="mt-4 space-y-1.5 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex items-center gap-2"><Check className="size-3.5 text-primary" /> {t(`dashboard.credits.perks.${perk}`)}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      )}

      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-lg">{t("dashboard.credits.proofTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t("dashboard.credits.transferVia")}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4 font-mono text-sm">{CCP}</div>
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-4 flex justify-between">
            <div>
              <div className="text-xs text-muted-foreground">{t("dashboard.credits.amountDue")}</div>
              <div className="text-2xl font-bold">{choice.price.toLocaleString()} {t("dashboard.credits.currency")}</div>
            </div>
            <div className={isRtl ? "text-left" : "text-right"}>
              <div className="text-xs text-muted-foreground">{t("dashboard.credits.youGet")}</div>
              <div className="text-2xl font-bold">{choice.credits} {t("dashboard.credits.creditsLabel")}</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("dashboard.credits.screenshotLabel")}</Label>
            <label htmlFor="proof" className="flex items-center gap-3 rounded-md border border-dashed px-3 py-3 cursor-pointer hover:border-primary/60">
              <div className="grid size-9 place-items-center rounded-md bg-background border"><Upload className="size-4" /></div>
              <div className="text-sm flex-1">
                {file ? (
                  <><p className="font-medium truncate">{file.name}</p><p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p></>
                ) : (
                  <><p className="font-medium">{t("dashboard.credits.uploadCta")}</p><p className="text-xs text-muted-foreground">{t("dashboard.credits.uploadHint")}</p></>
                )}
              </div>
            </label>
            <input id="proof" ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <Button onClick={submit} disabled={submitting} size="lg" className="w-full">
            {submitting ? t("dashboard.credits.submitting") : t("dashboard.credits.submit")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
