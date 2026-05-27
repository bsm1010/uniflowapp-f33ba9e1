import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Copy, Gift, Users, Coins } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/referrals")({
  component: ReferralsPage,
  head: () => ({ meta: [{ title: "Referrals — Storely" }] }),
});

function ReferralsPage() {
  const { user } = useAuth();
  const { referralCode } = useCredits();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === "rtl";
  const [refs, setRefs] = useState<{ id: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("referrals").select("id, created_at").eq("referrer_id", user.id).then(({ data }) => setRefs(data ?? []));
  }, [user]);

  const link = referralCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${referralCode}` : "";

  const copy = async (val: string, label: string) => {
    await navigator.clipboard.writeText(val);
    toast.success(label);
  };

  return (
    <div dir={isRtl ? "rtl" : "ltr"} className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        eyebrow={t("dashboard.referrals.eyebrow")}
        title={t("dashboard.referrals.title")}
        description={t("dashboard.referrals.description")}
        icon={Gift}
        gradient="from-pink-500 via-rose-500 to-orange-500"
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-lg bg-primary/10 text-primary"><Users className="size-5" /></div>
          <div><div className="text-xs text-muted-foreground">{t("dashboard.referrals.successful")}</div><div className="text-2xl font-bold">{refs.length}</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-lg bg-primary/10 text-primary"><Coins className="size-5" /></div>
          <div><div className="text-xs text-muted-foreground">{t("dashboard.referrals.earned")}</div><div className="text-2xl font-bold">{refs.length * 20}</div></div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-lg bg-gradient-brand text-brand-foreground"><Gift className="size-5" /></div>
          <h3 className="font-semibold text-lg">{t("dashboard.referrals.yourLink")}</h3>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">{t("dashboard.referrals.code")}</div>
          <div className="flex gap-2">
            <Input value={referralCode ?? ""} readOnly className="font-mono text-lg" />
            <Button variant="outline" onClick={() => copy(referralCode ?? "", t("dashboard.referrals.copiedCode"))}><Copy className="size-4" /></Button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">{t("dashboard.referrals.directLink")}</div>
          <div className="flex gap-2">
            <Input value={link} readOnly className="text-xs" />
            <Button onClick={() => copy(link, t("dashboard.referrals.copiedLink"))}><Copy className="size-4" /></Button>
          </div>
        </div>
      </CardContent></Card>
    </div>
  );
}
