import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/dashboard/apps/analytics")({
  component: AnalyticsIntegrationPage,
  head: () => ({ meta: [{ title: "Analytics Integration — Storely" }] }),
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
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">Analytics Integration</h1>
          <p className="text-sm text-muted-foreground">
            Connect tracking pixels to measure storefront performance.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking IDs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Google Analytics 4 (Measurement ID)</Label>
            <Input value={ga} onChange={(e) => setGa(e.target.value)} placeholder="G-XXXXXXXX" />
          </div>
          <div className="space-y-2">
            <Label>Meta Pixel ID</Label>
            <Input
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              placeholder="1234567890"
            />
          </div>
          <div className="space-y-2">
            <Label>TikTok Pixel ID</Label>
            <Input
              value={tiktok}
              onChange={(e) => setTiktok(e.target.value)}
              placeholder="C4XXXXXXXXXXXXXXXXXX"
            />
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" /> Save
          </Button>
          <p className="text-xs text-muted-foreground">
            Pixels load automatically on your storefront once saved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
