import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Loader2, Save, Upload, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { APPS, type AppDef } from "@/lib/apps";
import { useBuiltinAppEdits, type BuiltinAppEdit } from "@/hooks/use-builtin-app-edits";

export const Route = createFileRoute("/dashboard/admin/apps")({
  component: AdminAppsPage,
});

function AdminAppsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  if (isAdmin === null) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center max-w-md mx-auto">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
          <h2 className="text-lg font-semibold mb-1">Admin access required</h2>
          <p className="text-sm text-muted-foreground">
            You need the admin role to manage built-in apps.
          </p>
        </Card>
      </div>
    );
  }

  return <AdminAppsShell />;
}

function AdminAppsShell() {
  const { edits, loading, save, remove } = useBuiltinAppEdits();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Built-in Apps"
        description="Edit names, descriptions, and screenshots of built-in apps. Changes apply immediately across the app store."
      />
      <div className="grid gap-6">
        {APPS.map((app) => (
          <AppEditor
            key={app.key}
            app={app}
            edit={edits[app.key] ?? null}
            onSave={save}
            onRemove={remove}
          />
        ))}
      </div>
    </div>
  );
}

function AppEditor({
  app,
  edit,
  onSave,
  onRemove,
}: {
  app: AppDef;
  edit: BuiltinAppEdit | null;
  onSave: (e: BuiltinAppEdit) => Promise<void>;
  onRemove: (appKey: string) => Promise<void>;
}) {
  const [name, setName] = useState(edit?.name ?? app.name);
  const [description, setDescription] = useState(edit?.description ?? app.description);
  const [longDescription, setLongDescription] = useState(
    edit?.long_description ?? app.longDescription ?? "",
  );
  const [screenshots, setScreenshots] = useState<string[]>(edit?.screenshots ?? []);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { user } = useAuth();

  // Always enabled as long as there's a name
  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        app_key: app.key,
        name: name.trim() || app.name,
        description: description.trim() || app.description,
        long_description: longDescription.trim() || app.longDescription || app.description,
        screenshots: screenshots.filter((s) => s.trim() !== ""),
      });
      toast.success(`"${name}" saved`);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to save: " + (err?.message ?? "unknown error"));
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(app.key);
      setName(app.name);
      setDescription(app.description);
      setLongDescription(app.longDescription ?? "");
      setScreenshots([]);
      toast.success(`"${app.name}" reset to default`);
    } catch {
      toast.error("Failed to reset");
    }
    setRemoving(false);
  };

  const uploadScreenshot = async (file: File, idx: number) => {
    if (!user) return;
    setUploadingIdx(idx);
    const ext = file.name.split(".").pop() ?? "png";
    const path = `builtin-apps/${user.id}/${app.key}-ss-${idx}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("marketplace-assets")
      .upload(path, file, { upsert: false });
    if (error) {
      toast.error("Upload failed: " + error.message);
      setUploadingIdx(null);
      return;
    }
    const { data: urlData } = supabase.storage.from("marketplace-assets").getPublicUrl(path);
    const url = urlData.publicUrl;
    setScreenshots((prev) => {
      const next = [...prev];
      next[idx] = url;
      return next;
    });
    setUploadingIdx(null);
  };

  const addScreenshot = () => setScreenshots((prev) => [...prev, ""]);
  const removeScreenshot = (idx: number) =>
    setScreenshots((prev) => prev.filter((_, i) => i !== idx));
  const updateScreenshotUrl = (idx: number, url: string) =>
    setScreenshots((prev) => {
      const next = [...prev];
      next[idx] = url;
      return next;
    });

  const Icon = app.icon;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center border border-border shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate">{app.name}</h3>
          <p className="text-xs text-muted-foreground">
            Key: <code className="text-xs bg-muted px-1 rounded">{app.key}</code> ·{" "}
            {app.category}
          </p>
          {edit && (
            <Badge variant="secondary" className="mt-1 text-xs">
              Has overrides
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>App Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Short Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label>Long Description</Label>
          <Textarea
            value={longDescription}
            onChange={(e) => setLongDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Screenshots</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {screenshots.map((url, idx) => (
              <div key={idx} className="relative group">
                {url ? (
                  <div className="aspect-video rounded-md border bg-muted overflow-hidden">
                    <img
                      src={url}
                      alt={`Screenshot ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video rounded-md border border-dashed bg-muted/50 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/60" />
                  </div>
                )}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => fileRefs.current[idx]?.click()}
                    disabled={uploadingIdx === idx}
                  >
                    {uploadingIdx === idx ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-6 w-6"
                    onClick={() => removeScreenshot(idx)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <input
                  ref={(el) => {
                    fileRefs.current[idx] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadScreenshot(file, idx);
                  }}
                />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateScreenshotUrl(idx, e.target.value)}
                  placeholder="Or paste image URL..."
                  className="w-full mt-1 text-xs px-2 py-1 rounded border bg-background"
                />
              </div>
            ))}
            <button
              onClick={addScreenshot}
              className="aspect-video rounded-md border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-muted-foreground/60 transition text-muted-foreground/60 hover:text-muted-foreground"
            >
              <Upload className="h-5 w-5" />
              <span className="text-xs">Add</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} disabled={!canSave} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
          {edit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Reset to default
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
