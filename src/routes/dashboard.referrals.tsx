import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  head: () => ({ meta: [{ title: "نظام الإحالة — Storely" }] }),
});

function ReferralsPage() {
  const { user } = useAuth();
  const { referralCode } = useCredits();
  const [refs, setRefs] = useState<{ id: string; created_at: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("referrals").select("id, created_at").eq("referrer_id", user.id).then(({ data }) => setRefs(data ?? []));
  }, [user]);

  const link = referralCode ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${referralCode}` : "";

  const copy = async (val: string, label: string) => {
    await navigator.clipboard.writeText(val);
    toast.success(`تم نسخ ${label}`);
  };

  return (
    <div dir="rtl" className="max-w-4xl mx-auto space-y-6">
      <PageHeader eyebrow="الإحالة" title="ادعُ أصدقاءك واربح رصيد" description="احصل على 20 رصيد عن كل صديق ينضم، ويحصل صديقك على 10 رصيد إضافي." />

      <div className="grid sm:grid-cols-2 gap-4">
        <Card><CardContent className="p-5 flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-lg bg-primary/10 text-primary"><Users className="size-5" /></div>
          <div><div className="text-xs text-muted-foreground">إحالات ناجحة</div><div className="text-2xl font-bold">{refs.length}</div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3">
          <div className="size-10 grid place-items-center rounded-lg bg-primary/10 text-primary"><Coins className="size-5" /></div>
          <div><div className="text-xs text-muted-foreground">رصيد مكتسب</div><div className="text-2xl font-bold">{refs.length * 20}</div></div>
        </CardContent></Card>
      </div>

      <Card><CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3"><div className="size-10 grid place-items-center rounded-lg bg-gradient-brand text-brand-foreground"><Gift className="size-5" /></div><h3 className="font-semibold text-lg">رابط الإحالة الخاص بك</h3></div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">كود الإحالة</div>
          <div className="flex gap-2"><Input value={referralCode ?? ""} readOnly className="font-mono text-lg" /><Button variant="outline" onClick={() => copy(referralCode ?? "", "الكود")}><Copy className="size-4" /></Button></div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">رابط مباشر</div>
          <div className="flex gap-2"><Input value={link} readOnly className="text-xs" /><Button onClick={() => copy(link, "الرابط")}><Copy className="size-4" /></Button></div>
        </div>
      </CardContent></Card>
    </div>
  );
}
