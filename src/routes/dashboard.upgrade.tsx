import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Check,
  Clock,
  CreditCard,
  Smartphone,
  Sparkles,
  Upload,
  XCircle,
  Zap,
  Rocket,
  Building,
  Crown,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/upgrade")({
  component: UpgradePage,
  head: () => ({ meta: [{ title: "Upgrade plan — Fennecly" }] }),
});

const CCP_NUMBER = "0012345678 91";
const CCP_NAME = "STORELY SARL";
const CCP_KEY = "12";

const PLANS = [
  {
    id: "trial" as const,
    name: "تجربة مجانية",
    price: 0,
    cadence: "/ 3 أيام",
    description: "20 رصيد مجاني لاكتشاف المنصة.",
    credits: 20,
    perks: [
      "20 رصيد",
      "متجر واحد",
      "بدون تطبيقات AI",
    ],
    style: "trial",
    highlight: false,
    icon: Sparkles,
    badge: null,
  },
  {
    id: "beginner" as const,
    name: "Beginner",
    price: 2500,
    cadence: "DA / شهر",
    description: "مثالي للمبتدئين وأصحاب المتاجر الصغيرة.",
    credits: 250,
    perks: [
      "250 رصيد / شهر",
      "متجر واحد",
      "300 طلب / شهر",
      "SEO Optimizer",
      "Abandoned Cart Recovery",
      "Chatbot",
      "Analytics Integration",
      "نطاق واحد",
      "جميع خدمات التوصيل",
      "10 قوالب مجانية",
      "دعم 24/7",
    ],
    style: "beginner",
    highlight: false,
    icon: Zap,
    badge: null,
  },
  {
    id: "pro" as const,
    name: "Pro",
    price: 4900,
    cadence: "DA / شهر",
    description: "للمتاجر المتنامية التي تريد أدوات AI.",
    credits: 600,
    perks: [
      "600 رصيد / شهر",
      "متجرين",
      "700 طلب / شهر",
      "AI Product Descriptions",
      "AI Image Enhancer",
      "AI Ad Generator",
      "SEO Optimizer",
      "Abandoned Cart Recovery",
      "Chatbot",
      "Analytics Integration",
      "Developer Access",
      "نطاقين",
      "جميع خدمات التوصيل",
      "جميع القوالب المميزة",
      "دعم 24/7",
    ],
    style: "pro",
    highlight: true,
    icon: Rocket,
    badge: "الأكثر طلباً",
  },
  {
    id: "business" as const,
    name: "Business",
    price: 9000,
    cadence: "DA / شهر",
    description: "للشركات الجادة التي تحتاج كل شيء.",
    credits: 1200,
    perks: [
      "1,200 رصيد / شهر",
      "10 متاجر",
      "3,000 طلب / شهر",
      "Email Marketing",
      "جميع تطبيقات AI",
      "جميع أدوات Pro",
      "Developer Access",
      "دعم 24/7",
    ],
    style: "business",
    highlight: false,
    icon: Building,
    badge: "الأفضل قيمة",
  },
  {
    id: "agency" as const,
    name: "Agency",
    price: 29990,
    cadence: "DA / شهر",
    description: "للوكالات والموزعين بلا حدود.",
    credits: 5000,
    perks: [
      "5,000 رصيد / شهر",
      "متاجر غير محدودة",
      "طلبات غير محدودة",
      "كل ما في Business",
      "100 صندوق مخصص",
      "100 حقيبة تغليف مخصصة",
      "Developer Access",
      "دعم 24/7",
    ],
    style: "agency",
    highlight: false,
    icon: Crown,
    badge: "حصري",
  },
];

type PlanId = typeof PLANS[number]["id"];

type Submission = {
  id: string;
  plan: string;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
};

const getCardClass = (style: string, active: boolean) => {
  const base = "relative text-left rounded-2xl border p-6 flex flex-col transition-all cursor-pointer";
  const activeRing = active ? "ring-2" : "";
  switch (style) {
    case "trial":
      return `${base} border-border/40 bg-muted/20 hover:border-border ${active ? "ring-2 ring-border" : ""}`;
    case "beginner":
      return `${base} border-blue-500/30 bg-gradient-to-b from-blue-500/5 to-card hover:border-blue-500/60 ${active ? "ring-2 ring-blue-500/50" : ""}`;
    case "pro":
      return `${base} border-violet-500/50 bg-gradient-to-b from-violet-500/10 to-card hover:border-violet-500/70 shadow-glow ${active ? "ring-2 ring-violet-500/60" : ""}`;
    case "business":
      return `${base} border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-card hover:border-amber-500/60 ${active ? "ring-2 ring-amber-500/50" : ""}`;
    case "agency":
      return `${base} border-transparent bg-gradient-to-b from-[#1a1a2e] to-[#0f0f1a] hover:border-pink-500/30 ${active ? "ring-2 ring-pink-500/50" : ""}`;
    default:
      return `${base} border-border/60 bg-card`;
  }
};

const getPriceClass = (style: string) => {
  switch (style) {
    case "trial": return "text-muted-foreground";
    case "beginner": return "text-blue-500";
    case "pro": return "text-violet-400";
    case "business": return "text-amber-400";
    case "agency": return "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 bg-clip-text text-transparent";
    default: return "text-foreground";
  }
};

const getCheckClass = (style: string) => {
  switch (style) {
    case "trial": return "text-muted-foreground";
    case "beginner": return "text-blue-500";
    case "pro": return "text-violet-500";
    case "business": return "text-amber-500";
    case "agency": return "text-pink-500";
    default: return "text-primary";
  }
};

const getIconClass = (style: string) => {
  switch (style) {
    case "trial": return "bg-muted text-muted-foreground";
    case "beginner": return "bg-blue-500/10 text-blue-500";
    case "pro": return "bg-violet-500/10 text-violet-500";
    case "business": return "bg-amber-500/10 text-amber-500";
    case "agency": return "bg-pink-500/10 text-pink-500";
    default: return "bg-primary/10 text-primary";
  }
};

const getBadgeClass = (style: string) => {
  switch (style) {
    case "pro": return "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0";
    case "business": return "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0";
    case "agency": return "bg-gradient-to-r from-pink-500 via-violet-500 to-blue-500 text-white border-0";
    default: return "";
  }
};

function UpgradePage() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [plan, setPlan] = useState<PlanId>("pro");
  const [method, setMethod] = useState<"ccp" | "baridimob">("baridimob");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const selectedPlan = PLANS.find((p) => p.id === plan)!;

  const loadSubmissions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("payment_submissions")
      .select("id, plan, amount, payment_method, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setSubmissions(data ?? []);
  };

  useEffect(() => { loadSubmissions(); }, [user]);

  const copy = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!file) { toast.error("الرجاء رفع صورة الدفع"); return; }
    if (!file.type.startsWith("image/")) { toast.error("يجب أن يكون الملف صورة"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("الصورة يجب أن تكون أقل من 5MB"); return; }

    setSubmitting(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${user.id}/${Date.now()}-${plan}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (upErr) { setSubmitting(false); toast.error(upErr.message); return; }

    const { error: insertErr } = await supabase
      .from("payment_submissions")
      .insert({
        user_id: user.id,
        plan,
        amount: selectedPlan.price,
        payment_method: method,
        proof_url: path,
      });

    setSubmitting(false);
    if (insertErr) { toast.error(insertErr.message); return; }

    toast.success("تم إرسال الدفع بنجاح. في انتظار موافقة الإدارة.");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    loadSubmissions();
  };

  const pendingSubmission = submissions.find((s) => s.status === "pending");

  return (
    <div className="max-w-6xl mx-auto space-y-8" dir="rtl">
      <PageHeader
        eyebrow="الاشتراكات"
        title="اختر خطتك"
        description="ادفع عبر CCP أو BaridiMob وارفع إثبات الدفع. سنفعّل اشتراكك خلال 24 ساعة."
        icon={Sparkles}
        gradient="from-violet-500 via-fuchsia-500 to-pink-500"
      />

      {pendingSubmission && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <Clock className="size-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-foreground">الدفع قيد المراجعة</p>
            <p className="text-muted-foreground mt-0.5">
              طلب {pendingSubmission.plan} بمبلغ {Number(pendingSubmission.amount).toLocaleString()} DA في انتظار موافقة الإدارة.
            </p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const active = plan === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPlan(p.id)}
              className={getCardClass(p.style, active)}
            >
              {p.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full text-xs font-medium px-3 py-1 whitespace-nowrap ${getBadgeClass(p.style)}`}>
                  {p.badge}
                </div>
              )}

              {/* Icon + active check */}
              <div className="flex items-center justify-between mb-4">
                <div className={`grid size-9 place-items-center rounded-lg ${getIconClass(p.style)}`}>
                  <Icon className="size-4" />
                </div>
                <div className={`grid size-5 place-items-center rounded-full border transition-colors ${active ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}>
                  {active && <Check className="size-3" />}
                </div>
              </div>

              <h3 className={`font-semibold ${p.style === "agency" ? "text-white" : ""}`}>
                {p.name}
              </h3>
              <p className={`text-xs mt-1 ${p.style === "agency" ? "text-white/50" : "text-muted-foreground"}`}>
                {p.description}
              </p>

              <div className="mt-4 flex items-baseline gap-1">
                {p.price === 0 ? (
                  <span className="text-2xl font-bold text-muted-foreground">مجاني</span>
                ) : (
                  <>
                    <span className={`text-2xl font-bold ${getPriceClass(p.style)}`}>
                      {p.price.toLocaleString()}
                    </span>
                    <span className={`text-xs ${p.style === "agency" ? "text-white/40" : "text-muted-foreground"}`}>
                      {p.cadence}
                    </span>
                  </>
                )}
              </div>

              <div className={`mt-2 text-xs font-medium ${getPriceClass(p.style)}`}>
                {p.credits.toLocaleString()} رصيد
              </div>

              <ul className="mt-4 space-y-1.5 flex-1">
                {p.perks.slice(0, 4).map((perk) => (
                  <li key={perk} className="flex items-center gap-1.5 text-xs">
                    <Check className={`size-3 shrink-0 ${getCheckClass(p.style)}`} />
                    <span className={p.style === "agency" ? "text-white/60" : "text-foreground/70"}>
                      {perk}
                    </span>
                  </li>
                ))}
                {p.perks.length > 4 && (
                  <li className={`text-xs ${p.style === "agency" ? "text-white/40" : "text-muted-foreground"}`}>
                    +{p.perks.length - 4} المزيد...
                  </li>
                )}
              </ul>
            </button>
          );
        })}
      </div>

      {/* Selected plan perks + payment */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Selected plan full details */}
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`grid size-10 place-items-center rounded-lg ${getIconClass(selectedPlan.style)}`}>
                <selectedPlan.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{selectedPlan.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
              </div>
            </div>
            <Separator />
            <ul className="space-y-2">
              {selectedPlan.perks.map((perk) => (
                <li key={perk} className="flex items-center gap-2 text-sm">
                  <Check className={`size-4 shrink-0 ${getCheckClass(selectedPlan.style)}`} />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Payment form */}
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">إرسال إثبات الدفع</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedPlan.price === 0
                      ? "هذه الخطة مجانية لمدة 3 أيام"
                      : `أرسل ${selectedPlan.price.toLocaleString()} DA عبر CCP أو BaridiMob`}
                  </p>
                </div>
              </div>

              {selectedPlan.price > 0 && (
                <>
                  {/* CCP info */}
                  <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">رقم CCP</span>
                      <button type="button" onClick={() => copy(CCP_NUMBER, "رقم CCP")} className="text-xs text-primary hover:underline">نسخ</button>
                    </div>
                    <p className="font-mono text-base font-semibold tracking-wider">
                      {CCP_NUMBER} <span className="text-muted-foreground">CLE {CCP_KEY}</span>
                    </p>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">اسم الحساب</span>
                      <button type="button" onClick={() => copy(CCP_NAME, "اسم الحساب")} className="text-xs text-primary hover:underline">نسخ</button>
                    </div>
                    <p className="font-medium">{CCP_NAME}</p>
                  </div>

                  {/* Method */}
                  <div className="space-y-2">
                    <Label>طريقة الدفع</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMethod("ccp")}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${method === "ccp" ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}
                      >
                        <CreditCard className="size-4" /> CCP
                      </button>
                      <button
                        type="button"
                        onClick={() => setMethod("baridimob")}
                        className={`flex items-center gap-2 rounded-lg border p-3 text-sm transition-colors ${method === "baridimob" ? "border-primary bg-primary/5" : "border-border/60 hover:border-border"}`}
                      >
                        <Smartphone className="size-4" /> BaridiMob
                      </button>
                    </div>
                  </div>

                  {/* Screenshot upload */}
                  <div className="space-y-2">
                    <Label>صورة إثبات الدفع</Label>
                    <label
                      htmlFor="proof"
                      className="flex items-center gap-3 rounded-md border border-dashed border-border/80 bg-muted/30 px-3 py-3 cursor-pointer hover:border-primary/60 transition-colors"
                    >
                      <div className="grid size-9 place-items-center rounded-md bg-background border border-border/60">
                        <Upload className="size-4" />
                      </div>
                      <div className="text-sm min-w-0">
                        {file ? (
                          <>
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(0)} KB</p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium">ارفع الصورة هنا</p>
                            <p className="text-xs text-muted-foreground">PNG أو JPG، حتى 5MB</p>
                          </>
                        )}
                      </div>
                    </label>
                    <input id="proof" ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={submitting || selectedPlan.price === 0}
              >
                {submitting ? "جاري الإرسال…" : selectedPlan.price === 0 ? "مجاني - سيتم التفعيل تلقائياً" : "إرسال للمراجعة"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Recent submissions */}
      {submissions.length > 0 && (
        <Card className="border-border/60 shadow-soft">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">الطلبات الأخيرة</h3>
            <div className="space-y-3">
              {submissions.map((s) => {
                const isPending = s.status === "pending";
                const isApproved = s.status === "approved";
                const Icon = isApproved ? Check : isPending ? Clock : XCircle;
                const color = isApproved
                  ? "text-emerald-600 bg-emerald-500/10"
                  : isPending
                    ? "text-amber-600 bg-amber-500/10"
                    : "text-destructive bg-destructive/10";
                return (
                  <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`grid size-9 place-items-center rounded-md ${color}`}>
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium capitalize">
                          {s.plan} · {Number(s.amount).toLocaleString()} DA
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(s.created_at).toLocaleString()} · {s.payment_method.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{s.status}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        تحتاج مساعدة؟{" "}
        <Link to="/dashboard/settings" className="underline hover:text-foreground">
          تواصل مع الدعم
        </Link>
      </p>
    </div>
  );
}
