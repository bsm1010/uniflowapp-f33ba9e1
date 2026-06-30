import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Save, ShieldCheck, HelpCircle, TrendingUp, Target, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import { RequireApp } from "@/components/dashboard/RequireApp";

export const Route = createFileRoute("/dashboard/apps/analytics")({
  component: () => (
    <RequireApp appKey="analytics">
      <AnalyticsIntegrationPage />
    </RequireApp>
  ),
  head: () => ({ meta: [{ title: "Analytics Integration — Fennecly" }] }),
});

function AnalyticsIntegrationPage() {
  const { user } = useAuth();
  const [ga, setGa] = useState("");
  const [meta, setMeta] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("analytics_integrations")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setGa(data.ga4_id);
        setMeta(data.meta_pixel_id);
        setTiktok(data.tiktok_pixel_id);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("analytics_integrations").upsert(
      {
        user_id: user.id,
        ga4_id: ga,
        meta_pixel_id: meta,
        tiktok_pixel_id: tiktok,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center">
            <BarChart3 className="h-7 w-7 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Analytics Integration</h1>
            <p className="text-sm text-muted-foreground">
              Connect tracking pixels to measure storefront performance.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl shrink-0">
          <HelpCircle className="h-4 w-4 mr-1.5" />
          Integration guide
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main content */}
        <div className="space-y-5">
          <Card className="border-border/60">
            <CardContent className="p-6">
              <div className="space-y-1 mb-6">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  Tracking IDs
                </h2>
                <p className="text-sm text-muted-foreground">
                  Add your tracking IDs below. Your pixels will load automatically once saved.
                </p>
              </div>

              <div className="space-y-0 divide-y divide-border/60">
                {/* Google Analytics */}
                <div className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
                  <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="14" width="4" height="8" rx="1" fill="#F59E0B" />
                      <rect x="10" y="8" width="4" height="14" rx="1" fill="#F59E0B" />
                      <rect x="17" y="3" width="4" height="19" rx="1" fill="#F59E0B" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Label className="font-medium text-sm">Google Analytics 4</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Measurement ID</p>
                    <Input
                      value={ga}
                      onChange={(e) => setGa(e.target.value)}
                      placeholder="G-XXXXXXXXXX"
                      className="mt-2 max-w-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Example: G-1A2B3C4D5E</p>
                  </div>
                  {ga && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Connected
                    </Badge>
                  )}
                </div>

                {/* Meta Pixel */}
                <div className="flex items-center gap-4 py-5">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.99 4.388 10.954 10.125 11.854V15.47H7.078V12h3.047V9.356c0-3.007 1.792-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385C19.612 22.954 24 17.99 24 12z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Label className="font-medium text-sm">Meta Pixel ID</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Pixel ID</p>
                    <Input
                      value={meta}
                      onChange={(e) => setMeta(e.target.value)}
                      placeholder="1234567890"
                      className="mt-2 max-w-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Example: 1234567890</p>
                  </div>
                  {meta && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Connected
                    </Badge>
                  )}
                </div>

                {/* TikTok Pixel */}
                <div className="flex items-center gap-4 py-5 last:pb-0">
                  <div className="h-10 w-10 rounded-xl bg-gray-900/10 flex items-center justify-center shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.51a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.27 8.27 0 005.58 2.17v-3.45a4.85 4.85 0 01-3.77-1.56V6.69h3.77z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Label className="font-medium text-sm">TikTok Pixel ID</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">Pixel ID</p>
                    <Input
                      value={tiktok}
                      onChange={(e) => setTiktok(e.target.value)}
                      placeholder="C4XXXXXXXXXXXXXXXXXX"
                      className="mt-2 max-w-md"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Example: C4A1B2C3D4E5F6G7H</p>
                  </div>
                  {tiktok && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
                      Connected
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security notice */}
          <Card className="border-border/60 bg-gradient-to-r from-violet-500/5 to-transparent">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Your data is secure</p>
                <p className="text-xs text-muted-foreground">
                  We use industry-standard encryption to keep your tracking data safe.
                </p>
              </div>
              <div className="shrink-0">
                <Button onClick={save} disabled={saving} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white rounded-xl px-6">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-1.5">
                  Changes are saved automatically
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <Card className="border-border/60">
            <CardContent className="p-5">
              <h3 className="font-semibold text-sm mb-1">About Integration</h3>
              <p className="text-xs text-muted-foreground mb-5">
                Track user behavior, measure conversions, and optimize your marketing campaigns.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-4 w-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Accurate Tracking</p>
                    <p className="text-xs text-muted-foreground">Get reliable data from your storefront</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Target className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Better Insights</p>
                    <p className="text-xs text-muted-foreground">Understand customer behavior and performance</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Rocket className="h-4 w-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Improve Results</p>
                    <p className="text-xs text-muted-foreground">Optimize campaigns and increase conversions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
