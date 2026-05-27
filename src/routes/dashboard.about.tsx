import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, FileText, Image as ImageIcon, Loader2, Save, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { ExpiredOverlay } from "@/components/dashboard/ExpiredOverlay";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { StoreSettings } from "@/lib/storeTheme";
import { getStoreTokens } from "@/lib/storeTheme";

export const Route = createFileRoute("/dashboard/about")({
  component: AboutEditor,
  head: () => ({ meta: [{ title: "About Page — Storely" }] }),
});

const DEFAULT_TITLE = "About us";
const DEFAULT_CONTENT =
  "Welcome to our store. We are passionate about offering quality products and a delightful shopping experience. Thanks for stopping by!";

function AboutEditor() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) {
      setSettings(data as StoreSettings);
      setTitle(data.about_title || DEFAULT_TITLE);
      setContent(data.about_content || DEFAULT_CONTENT);
      setImageUrl(data.about_image_url ?? null);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const markDirty = () => setDirty(true);

  const handleUpload = async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Image must be smaller than 4 MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${user.id}/about-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("store-assets")
      .upload(path, file, { upsert: true });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("store-assets").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    markDirty();
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({
        about_title: title.trim() || DEFAULT_TITLE,
        about_content: content.trim() || DEFAULT_CONTENT,
        about_image_url: imageUrl,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("About page saved");
    setDirty(false);
  };

  const tokens = settings ? getStoreTokens(settings) : null;
  const slug = settings?.slug;

  return (
    <div className="max-w-[1400px] mx-auto">
      {isExpired && <ExpiredOverlay />}
      <PageHeader
        eyebrow="Storefront"
        title="About page"
        description="Tell your story. This page lives at /s/your-store/about."
        actions={
          <>
            {slug && (
              <Button variant="outline" asChild disabled={dirty}>
                <a href={`/s/${slug}/about`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> View live
                </a>
              </Button>
            )}
            <Button onClick={save} disabled={saving || !dirty || !settings}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {dirty ? "Save changes" : "Saved"}
            </Button>
          </>
        }
      />

      {!settings ? (
        <div className="flex items-center justify-center h-[40vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* EDITOR */}
          <Card className="border-border/60 shadow-soft h-fit">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="font-medium">Editor</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about-title">Title</Label>
                <Input
                  id="about-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    markDirty();
                  }}
                  placeholder="About us"
                  maxLength={120}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about-content">Description</Label>
                <Textarea
                  id="about-content"
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    markDirty();
                  }}
                  placeholder="Tell your customers about your brand, values, and story..."
                  rows={12}
                  className="resize-y leading-relaxed"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: leave a blank line between paragraphs.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Image (optional)</Label>
                {imageUrl ? (
                  <div className="relative rounded-lg border border-border overflow-hidden group">
                    <img src={imageUrl} alt="About" className="w-full h-48 object-cover" />
                    <button
                      onClick={() => {
                        setImageUrl(null);
                        markDirty();
                      }}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 h-32 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/40 transition-colors">
                    {uploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Click to upload an image</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PREVIEW */}
          <Card className="border-border/60 shadow-soft h-fit lg:sticky lg:top-20">
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <div className="px-4 py-2 border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                Live preview
              </div>
              <div
                className="p-8"
                style={{
                  background: tokens?.bg,
                  color: tokens?.fg,
                  fontFamily: tokens?.fontFamily,
                  minHeight: 480,
                }}
              >
                <div className="max-w-2xl mx-auto space-y-6">
                  <h1
                    className="text-3xl md:text-4xl font-semibold leading-tight"
                    style={{ fontFamily: tokens?.fontHeading }}
                  >
                    {title || DEFAULT_TITLE}
                  </h1>
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      className="w-full rounded-xl object-cover max-h-72"
                      style={{ borderRadius: tokens?.radius.lg }}
                    />
                  )}
                  <div className="space-y-4 text-base leading-relaxed">
                    {(content || DEFAULT_CONTENT).split(/\n\s*\n/).map((para, i) => (
                      <p key={i} style={{ color: tokens?.fg, opacity: 0.9 }}>
                        {para}
                      </p>
                    ))}
                  </div>
                  {!imageUrl && (
                    <div
                      className="flex items-center gap-2 text-xs"
                      style={{ color: tokens?.muted }}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      No image — upload one to feature it here.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
