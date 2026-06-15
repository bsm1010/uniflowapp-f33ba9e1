import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Megaphone, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { generateAd } from "@/lib/ai/generate-ad";
import { RequireApp } from "@/components/dashboard/RequireApp";

export const Route = createFileRoute("/dashboard/apps/ad-generator")({
  component: () => (
    <RequireApp appKey="ad-generator">
      <AdGenPage />
    </RequireApp>
  ),
  head: () => ({ meta: [{ title: "AI Ad Generator — Fennecly" }] }),
});

type Ad = {
  headline: string;
  primary_text: string;
  description: string;
  cta: string;
  hashtags: string[];
};

function AdGenPage() {
  const generate = useServerFn(generateAd);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<"facebook" | "instagram" | "tiktok" | "google">(
    "facebook",
  );
  const [tone, setTone] = useState<"urgent" | "playful" | "luxury" | "professional">("urgent");
  const [ad, setAd] = useState<Ad | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!name.trim()) return toast.error("Enter a product name");
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return toast.error("You must be signed in");
    setBusy(true);
    try {
      const res = await generate({
        data: {
          productName: name,
          productDescription: desc,
          audience,
          platform,
          tone,
          accessToken,
        },
      });
      setAd(res.ad);
    } catch (e: any) {
      const msg = e?.message ?? "Failed";
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        toast.error("Out of credits. Top up to continue.");
        window.location.href = "/dashboard/credits";
      } else {
        toast.error(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex items-center justify-center">
          <Megaphone className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">AI Ad Generator</h1>
          <p className="text-sm text-muted-foreground">
            Generate ready-to-publish ads for Facebook, Instagram, TikTok, and Google.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ad brief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="space-y-2">
            <Label>Product name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Short description / key features</Label>
            <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Target audience</Label>
            <Input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="women 25-40 interested in fitness"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="google">Google Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={run} disabled={busy}>
            <Megaphone className="h-4 w-4" /> {busy ? "Generating…" : "Generate ad"}
          </Button>
        </CardContent>
      </Card>

      {ad && (
        <Card>
          <CardHeader>
            <CardTitle>Generated ad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Headline" value={ad.headline} onCopy={copy} />
            <Field label="Primary text" value={ad.primary_text} onCopy={copy} multiline />
            <Field label="Description" value={ad.description} onCopy={copy} />
            <Field label="Call to action" value={ad.cta} onCopy={copy} />
            {ad.hashtags?.length > 0 && (
              <Field
                label="Hashtags"
                value={ad.hashtags.map((h) => `#${h}`).join(" ")}
                onCopy={copy}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
  multiline,
}: {
  label: string;
  value: string;
  onCopy: (s: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button variant="ghost" size="sm" onClick={() => onCopy(value)}>
          <Copy className="h-3.5 w-3.5" /> Copy
        </Button>
      </div>
      {multiline ? <Textarea value={value} readOnly rows={4} /> : <Input value={value} readOnly />}
    </div>
  );
}
