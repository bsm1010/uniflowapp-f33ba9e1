import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Copy,
  Gift,
  Users,
  Coins,
  Share2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useCredits } from "@/hooks/use-credits";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/referrals")({
  component: ReferralsPage,
  head: () => ({ meta: [{ title: "ادعُ أصدقاءك — Fennecly" }] }),
});

function ReferralIllustration() {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md mx-auto"
    >
      {/* Background circle */}
      <circle cx="200" cy="140" r="100" fill="url(#bgGrad)" opacity="0.1" />

      {/* Person 1 - center */}
      <g transform="translate(160, 60)">
        <circle cx="40" cy="20" r="18" fill="url(#personGrad1)" />
        <circle cx="40" cy="14" r="5" fill="white" opacity="0.9" />
        <path d="M30 38 C30 55 50 55 50 38" fill="url(#personGrad1)" />
        <rect x="25" y="55" width="30" height="25" rx="8" fill="url(#personGrad1)" />
      </g>

      {/* Person 2 - left */}
      <g transform="translate(60, 100)">
        <circle cx="35" cy="18" r="15" fill="url(#personGrad2)" />
        <circle cx="35" cy="13" r="4" fill="white" opacity="0.9" />
        <path d="M26 33 C26 48 44 48 44 33" fill="url(#personGrad2)" />
        <rect x="22" y="48" width="26" height="22" rx="7" fill="url(#personGrad2)" />
      </g>

      {/* Person 3 - right */}
      <g transform="translate(280, 100)">
        <circle cx="35" cy="18" r="15" fill="url(#personGrad3)" />
        <circle cx="35" cy="13" r="4" fill="white" opacity="0.9" />
        <path d="M26 33 C26 48 44 48 44 33" fill="url(#personGrad3)" />
        <rect x="22" y="48" width="26" height="22" rx="7" fill="url(#personGrad3)" />
      </g>

      {/* Connection lines */}
      <line x1="120" y1="130" x2="160" y2="100" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />
      <line x1="280" y1="130" x2="240" y2="100" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="6 4" opacity="0.5" />

      {/* Gift box - center top */}
      <g transform="translate(180, 20)">
        <rect x="0" y="10" width="40" height="30" rx="4" fill="url(#giftGrad)" />
        <rect x="0" y="10" width="40" height="8" rx="4" fill="url(#giftGrad2)" />
        <rect x="17" y="10" width="6" height="30" fill="url(#giftGrad2)" />
        <path d="M20 10 C15 0 10 5 15 8" stroke="url(#giftGrad2)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M20 10 C25 0 30 5 25 8" stroke="url(#giftGrad2)" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>

      {/* Coins */}
      <g transform="translate(310, 170)">
        <circle cx="0" cy="0" r="12" fill="url(#coinGrad)" />
        <circle cx="0" cy="0" r="8" fill="url(#coinGrad2)" />
        <text x="0" y="4" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">D</text>
      </g>
      <g transform="translate(330, 185)">
        <circle cx="0" cy="0" r="10" fill="url(#coinGrad)" />
        <circle cx="0" cy="0" r="6" fill="url(#coinGrad2)" />
      </g>

      {/* Sparkles */}
      <circle cx="80" cy="60" r="3" fill="#fbbf24" opacity="0.8" />
      <circle cx="320" cy="50" r="2" fill="#f472b6" opacity="0.7" />
      <circle cx="50" cy="180" r="2.5" fill="#a78bfa" opacity="0.6" />
      <circle cx="350" cy="120" r="3" fill="#34d399" opacity="0.7" />

      {/* Floating stars */}
      <path d="M70 40 l3 7 7 3 -7 3 -3 7 -3-7 -7-3 7-3z" fill="#fbbf24" opacity="0.6" />
      <path d="M340 80 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z" fill="#f472b6" opacity="0.5" />
      <path d="M360 200 l2 5 5 2 -5 2 -2 5 -2-5 -5-2 5-2z" fill="#34d399" opacity="0.5" />

      <defs>
        <linearGradient id="bgGrad" x1="0" y1="0" x2="400" y2="280">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="personGrad1" x1="0" y1="0" x2="80" y2="80">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="personGrad2" x1="0" y1="0" x2="70" y2="70">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="personGrad3" x1="0" y1="0" x2="70" y2="70">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="giftGrad" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="giftGrad2" x1="0" y1="0" x2="40" y2="0">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="coinGrad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="coinGrad2" x1="0" y1="0" x2="16" y2="16">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ReferralsPage() {
  const { user } = useAuth();
  const { referralCode } = useCredits();
  const { t } = useTranslation();
  const [refs, setRefs] = useState<{ id: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("referrals")
          .select("id, created_at")
          .eq("referrer_id", user.id)
          .order("created_at", { ascending: false });
        if (!cancelled) setRefs(data ?? []);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const link = referralCode
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${referralCode}`
    : "";

  const copy = useCallback(async (val: string, label: string, key: string) => {
    if (!val) return;
    setCopying(key);
    try {
      await navigator.clipboard.writeText(val);
      toast.success(label);
    } catch {
      toast.error("فشل النسخ");
    } finally {
      setTimeout(() => setCopying(null), 500);
    }
  }, []);

  const earned = refs.length * 20;

  return (
    <div className="relative max-w-5xl mx-auto space-y-10 pb-12">
      {/* Decorative background orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -left-24 size-96 rounded-full bg-gradient-to-br from-pink-500/30 via-rose-500/20 to-transparent blur-3xl" />
        <div className="absolute top-40 -right-32 size-[28rem] rounded-full bg-gradient-to-br from-amber-400/25 via-orange-500/15 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-80 rounded-full bg-gradient-to-tr from-violet-400/20 via-fuchsia-400/15 to-transparent blur-3xl" />
      </div>

      {/* Hero section */}
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-pink-600 via-rose-600 to-orange-500 p-8 sm:p-12 text-white shadow-[0_20px_70px_-20px_rgba(236,72,153,0.5)]">
        <div aria-hidden className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)", backgroundSize: "40px 40px, 60px 60px" }} />
        <div aria-hidden className="absolute -top-20 -right-20 size-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -left-10 size-72 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
          <div className="flex-1 space-y-4 max-w-xl">
            <Badge className="bg-white/20 hover:bg-white/20 backdrop-blur border-white/30 text-white w-fit">
              <Sparkles className="size-3 mr-1" /> {t("dashboard.referrals.eyebrow")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold font-display tracking-tight leading-tight">
              {t("dashboard.referrals.title")}
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              {t("dashboard.referrals.description")}
            </p>
          </div>
          <div className="lg:w-80 shrink-0">
            <ReferralIllustration />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="relative overflow-hidden border-border/60 hover:shadow-lg transition-shadow">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="size-12 grid place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30">
              <Users className="size-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.referrals.successful")}</div>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <div className="text-2xl font-bold">{refs.length}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 hover:shadow-lg transition-shadow">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="size-12 grid place-items-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30">
              <Coins className="size-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.referrals.earned")}</div>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <div className="text-2xl font-bold">{earned}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/60 hover:shadow-lg transition-shadow">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="size-12 grid place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30">
              <Gift className="size-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">رصيد صديقك</div>
              {loading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <div className="text-2xl font-bold">+10</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral link section */}
      <Card className="relative overflow-hidden border-border/60 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)]">
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-orange-500/5" />
        <div aria-hidden className="absolute -top-24 -right-24 size-64 rounded-full bg-pink-500/10 blur-3xl" />

        <CardContent className="relative p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <div className="size-12 grid place-items-center rounded-2xl bg-gradient-to-br from-pink-600 to-orange-500 text-white shadow-lg shadow-pink-500/30 shrink-0">
              <Share2 className="size-6" />
            </div>
            <div>
              <h3 className="font-semibold text-xl font-display">{t("dashboard.referrals.yourLink")}</h3>
              <p className="text-sm text-muted-foreground mt-1">شارك الرابط مع أصدقائك واحصل على رصيد مجاناً</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">{t("dashboard.referrals.code")}</div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={referralCode ?? ""}
                  readOnly
                  className="font-mono text-lg h-12 bg-muted/50"
                />
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => copy(referralCode ?? "", t("dashboard.referrals.copiedCode"), "code")}
                disabled={!referralCode || copying === "code"}
                className="px-6"
              >
                {copying === "code" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">{t("dashboard.referrals.directLink")}</div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  value={link}
                  readOnly
                  className="text-sm h-12 bg-muted/50"
                />
              </div>
              <Button
                size="lg"
                onClick={() => copy(link, t("dashboard.referrals.copiedLink"), "link")}
                disabled={!link || copying === "link"}
                className="px-6 bg-gradient-to-r from-pink-600 to-orange-500 hover:from-pink-700 hover:to-orange-600 text-white border-0 shadow-lg shadow-pink-500/30"
              >
                {copying === "link" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How it works */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold font-display">كيف يعمل؟</h2>
          <p className="text-muted-foreground">ثلاث خطوات بسيطة للحصول على رصيد مجاني</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              step: "1",
              title: "شارك الرابط",
              description: "أرسل رابط الإحالة الخاص بك لأصدقائك عبر وسائل التواصل",
              icon: Share2,
              gradient: "from-pink-500 to-rose-500",
            },
            {
              step: "2",
              title: " Friend يسجل",
              description: "صديقك ينشئ حساباً جديداً باستخدام رابط الإحالة الخاص بك",
              icon: Users,
              gradient: "from-violet-500 to-fuchsia-500",
            },
            {
              step: "3",
              title: "احصل على رصيد",
              description: "تلقائياً تحصل على 20 رصيد وصديقك على 10 رصيد",
              icon: Coins,
              gradient: "from-amber-500 to-orange-500",
            },
          ].map((item, i) => (
            <div key={i} className="relative group">
              <Card className="relative overflow-hidden border-border/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                <div aria-hidden className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                <CardContent className="relative p-6 text-center space-y-4">
                  <div className="relative mx-auto">
                    <div className={`size-16 grid place-items-center rounded-2xl bg-gradient-to-br ${item.gradient} text-white shadow-lg mx-auto`}>
                      <item.icon className="size-7" />
                    </div>
                    <div className="absolute -top-2 -right-2 size-7 grid place-items-center rounded-full bg-foreground text-background text-xs font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
              {i < 2 && (
                <div className="hidden sm:flex absolute top-1/2 -right-3 z-10 -translate-y-1/2">
                  <ArrowRight className="size-5 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Referral history */}
      {refs.length > 0 && (
        <Card className="relative overflow-hidden border-border/60">
          <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent" />
          <CardContent className="relative p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 grid place-items-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg">
                <Clock className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">سجل الإحالات</h3>
                <p className="text-sm text-muted-foreground">{refs.length} إحالة ناجحة</p>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {refs.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 grid place-items-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">صديق جديد انضم</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(ref.created_at).toLocaleDateString("ar-DZ", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-0">+20 رصيد</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
