import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Wand2, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { enhanceImage } from "@/lib/ai/enhance-image";
import { RequireApp } from "@/components/dashboard/RequireApp";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/dashboard/apps/image-enhancer")({
  component: () => (
    <RequireApp appKey="image-enhancer">
      <ImageEnhancerPage />
    </RequireApp>
  ),
  head: () => ({ meta: [{ title: "AI Image Enhancer — Fennecly" }] }),
});

type Preset = "studio" | "lifestyle" | "white-bg" | "enhance";

function ImageEnhancerPage() {
  const enhance = useServerFn(enhanceImage);
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [preset, setPreset] = useState<Preset>("enhance");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) return toast.error("Max 8MB");
    const reader = new FileReader();
    reader.onload = () => {
      setOriginal(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(f);
  };

  const run = async () => {
    if (!original) return toast.error("Upload an image first");
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return toast.error("You must be signed in");
    setBusy(true);
    try {
      const res = await enhance({
        data: { imageBase64: original, prompt, preset, accessToken },
      });
      setResult(res.imageUrl);
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

  const download = () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result;
    a.download = `enhanced-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <PageHeader
        icon={Wand2}
        title="AI Image Enhancer"
        description="Turn ordinary product photos into studio-quality shots."
        gradient="from-cyan-500/20 to-blue-500/20"
      />

      <Card>
        <CardHeader>
          <CardTitle>Upload &amp; enhance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Product image (max 8MB)</Label>
            <Input type="file" accept="image/*" onChange={onFile} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Preset</Label>
              <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enhance">Enhance (lighting + sharpness)</SelectItem>
                  <SelectItem value="studio">Studio shot</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle scene</SelectItem>
                  <SelectItem value="white-bg">White background</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Extra instructions (optional)</Label>
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="warm lighting, marble surface"
              />
            </div>
          </div>
          <Button onClick={run} disabled={busy || !original}>
            <Upload className="h-4 w-4" /> {busy ? "Enhancing…" : "Enhance image"}
          </Button>
        </CardContent>
      </Card>

      {(original || result) && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Original</Label>
              <div className="aspect-square rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
                {original ? (
                  <img src={original} alt="Original" className="object-contain w-full h-full" />
                ) : (
                  <span className="text-xs text-muted-foreground">No image</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Enhanced</Label>
              <div className="aspect-square rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden">
                {result ? (
                  <img src={result} alt="Enhanced" className="object-contain w-full h-full" />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {busy ? "Working…" : "Result will appear here"}
                  </span>
                )}
              </div>
              {result && (
                <Button variant="outline" onClick={download}>
                  <Download className="h-4 w-4" /> Download
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
