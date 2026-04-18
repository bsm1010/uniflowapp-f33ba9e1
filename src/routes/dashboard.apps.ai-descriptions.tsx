import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Copy } from "lucide-react";
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
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { generateDescription } from "@/lib/ai/generate-description";

export const Route = createFileRoute("/dashboard/apps/ai-descriptions")({
  component: AiDescPage,
  head: () => ({ meta: [{ title: "AI Descriptions — Storely" }] }),
});

function AiDescPage() {
  const { user } = useAuth();
  const generate = useServerFn(generateDescription);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [productId, setProductId] = useState("");
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] =
    useState<"professional" | "playful" | "luxury" | "minimal">("professional");
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("products")
      .select("id,name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setProducts(data ?? []));
  }, [user]);

  const onPick = (id: string) => {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) setName(p.name);
  };

  const run = async () => {
    if (!name.trim()) return toast.error("Enter a product name");
    setBusy(true);
    try {
      const res = await generate({ data: { productName: name, keywords, tone } });
      setOutput(res.description);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const saveToProduct = async () => {
    if (!productId || !output) return;
    setSaving(true);
    const { error } = await supabase
      .from("products")
      .update({ description: output })
      .eq("id", productId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Description saved to product");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-pink-500/20 flex items-center justify-center">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold">AI Product Descriptions</h1>
          <p className="text-sm text-muted-foreground">
            Generate compelling product copy in one click.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generator</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {products.length > 0 && (
            <div className="space-y-2">
              <Label>Pick a product (optional)</Label>
              <Select value={productId} onValueChange={onPick}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Product name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Keywords / features</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="cotton, breathable, summer"
              />
            </div>
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="playful">Playful</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={run} disabled={busy}>
            <Sparkles className="h-4 w-4" /> {busy ? "Generating…" : "Generate"}
          </Button>
          {output && (
            <div className="space-y-2">
              <Label>Result</Label>
              <Textarea
                value={output}
                onChange={(e) => setOutput(e.target.value)}
                rows={8}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-4 w-4" /> Copy
                </Button>
                {productId && (
                  <Button onClick={saveToProduct} disabled={saving}>
                    Save to product
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
