import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Search, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

import { RequireApp } from "@/components/dashboard/RequireApp";

export const Route = createFileRoute("/dashboard/apps/seo-optimizer")({
  component: () => (
    <RequireApp appKey="seo-optimizer">
      <SeoPage />
    </RequireApp>
  ),
  head: () => ({ meta: [{ title: "SEO Optimizer — Storely" }] }),
});

function SeoPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [og, setOg] = useState("");
  const [sitemap, setSitemap] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("seo_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setTitle(data.meta_title);
        setDescription(data.meta_description);
        setKeywords(data.keywords);
        setOg(data.og_image_url ?? "");
        setSitemap(data.sitemap_enabled);
      });
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("seo_settings").upsert(
      {
        user_id: user.id,
        meta_title: title,
        meta_description: description,
        keywords,
        og_image_url: og || null,
        sitemap_enabled: sitemap,
      },
      { onConflict: "user_id" },
    );
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("SEO saved");
  };

  const score = Math.min(
    100,
    (title.length >= 30 && title.length <= 60 ? 30 : 10) +
      (description.length >= 70 && description.length <= 160 ? 30 : 10) +
      (keywords ? 20 : 0) +
      (og ? 20 : 0),
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
          <Search className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">SEO Optimizer</h1>
          <p className="text-sm text-muted-foreground">
            Improve your storefront's discoverability on search engines.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SEO score: {score}/100</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Meta title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} />
            <p className="text-xs text-muted-foreground">{title.length}/60 ideal</p>
          </div>
          <div className="space-y-2">
            <Label>Meta description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{description.length}/160 ideal</p>
          </div>
          <div className="space-y-2">
            <Label>Keywords (comma-separated)</Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Social share image URL</Label>
            <Input
              value={og}
              onChange={(e) => setOg(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">Generate sitemap.xml</p>
              <p className="text-xs text-muted-foreground">
                Helps search engines crawl your products.
              </p>
            </div>
            <Switch checked={sitemap} onCheckedChange={setSitemap} />
          </div>
          <Button onClick={save} disabled={saving}>
            <Save className="h-4 w-4" /> Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
