import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
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
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/apps/submit")({
  component: SubmitAppPage,
  head: () => ({ meta: [{ title: "Submit App — Fennecly" }] }),
});

const CATEGORIES = ["Marketing", "Sales", "Analytics", "AI", "Productivity", "Design", "Other"];

const schema = z.object({
  title: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and dashes only"),
  short_description: z.string().trim().min(10).max(160),
  long_description: z.string().trim().max(4000).optional().default(""),
  category: z.string().min(1),
  app_url: z.string().trim().url(),
  price: z.number().min(0).max(10000),
  is_free: z.boolean(),
});

function SubmitAppPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    short_description: "",
    long_description: "",
    category: "Other",
    app_url: "",
    price: 0,
    is_free: true,
  });
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const upload = async (file: File, prefix: string) => {
    if (!user) return null;
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/${prefix}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("marketplace-assets")
      .upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from("marketplace-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const onIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const url = await upload(f, "icon");
    setUploading(false);
    if (url) setIconUrl(url);
  };

  const onScreenshotsChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const urls: string[] = [];
    for (const f of files) {
      const u = await upload(f, "ss");
      if (u) urls.push(u);
    }
    setUploading(false);
    setScreenshots((s) => [...s, ...urls].slice(0, 8));
  };

  const removeScreenshot = (idx: number) =>
    setScreenshots((s) => s.filter((_, i) => i !== idx));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in");
      return;
    }
    const parsed = schema.safeParse({
      ...form,
      price: form.is_free ? 0 : Number(form.price),
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("apps").insert({
      developer_id: user.id,
      title: parsed.data.title,
      slug: parsed.data.slug,
      short_description: parsed.data.short_description,
      long_description: parsed.data.long_description,
      category: parsed.data.category,
      app_url: parsed.data.app_url,
      price: parsed.data.price,
      is_free: parsed.data.is_free,
      icon_url: iconUrl,
      screenshots,
      status: "pending",
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("App submitted for review!");
    navigate({ to: "/dashboard/developer" });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link to="/dashboard/apps/marketplace">
          <ArrowLeft className="h-4 w-4" />
          Back to Marketplace
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold">Submit your app</h1>
        <p className="text-muted-foreground mt-1">
          Apps are reviewed before they appear in the marketplace.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">App name</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="My Awesome App"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                placeholder="my-awesome-app"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="short">Short description</Label>
            <Input
              id="short"
              required
              maxLength={160}
              value={form.short_description}
              onChange={(e) => setForm({ ...form, short_description: e.target.value })}
              placeholder="One-line pitch (max 160 chars)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="long">Long description</Label>
            <Textarea
              id="long"
              rows={6}
              value={form.long_description}
              onChange={(e) => setForm({ ...form, long_description: e.target.value })}
              placeholder="Tell merchants what your app does, key features, and how to use it."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">App URL</Label>
              <Input
                id="url"
                type="url"
                required
                value={form.app_url}
                onChange={(e) => setForm({ ...form, app_url: e.target.value })}
                placeholder="https://your-app.com"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label>Free app</Label>
              <p className="text-sm text-muted-foreground">Toggle off to set a price</p>
            </div>
            <Switch
              checked={form.is_free}
              onCheckedChange={(v) => setForm({ ...form, is_free: v })}
            />
          </div>

          {!form.is_free && (
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
              />
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold">Assets</h3>
            <p className="text-sm text-muted-foreground">Upload an icon and up to 8 screenshots.</p>
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex items-center gap-4">
              {iconUrl ? (
                <img src={iconUrl} alt="" className="h-16 w-16 rounded-xl object-cover border" />
              ) : (
                <div className="h-16 w-16 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground">
                  <Upload className="h-5 w-5" />
                </div>
              )}
              <Input type="file" accept="image/*" onChange={onIconChange} className="max-w-xs" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Screenshots ({screenshots.length}/8)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={onScreenshotsChange}
              disabled={screenshots.length >= 8}
            />
            {screenshots.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                {screenshots.map((url, i) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="" className="w-full aspect-video rounded-lg object-cover border" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(i)}
                      className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" asChild>
            <Link to="/dashboard/apps/marketplace">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting || uploading}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit for review
          </Button>
        </div>
      </form>
    </div>
  );
}
