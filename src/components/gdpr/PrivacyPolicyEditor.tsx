import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  getPrivacyPolicySettings,
  savePrivacyPolicySettings,
  type PrivacyPolicySection,
} from "@/lib/gdpr/privacy-policy.functions";

export function PrivacyPolicyEditor() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [sections, setSections] = useState<PrivacyPolicySection[]>([]);
  const [customHtml, setCustomHtml] = useState("");

  useEffect(() => {
    if (!currentStore) return;
    getPrivacyPolicySettings({ data: { storeId: currentStore.id } }).then((s) => {
      if (s) {
        setEnabled(s.enabled);
        setSections(s.sections ?? []);
        setCustomHtml(s.custom_html ?? "");
      }
      setLoading(false);
    });
  }, [currentStore]);

  const addSection = () => {
    setSections([...sections, { title: "New Section", content: "" }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: keyof PrivacyPolicySection, value: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const handleSave = async () => {
    if (!user || !currentStore) return;
    setSaving(true);
    try {
      await savePrivacyPolicySettings({
        data: {
          storeId: currentStore.id,
          userId: user.id,
          enabled,
          sections,
          customHtml: customHtml || null,
        },
      });
      toast.success("Privacy policy saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/60 shadow-soft">
        <CardContent className="p-6">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Privacy Policy</CardTitle>
            <CardDescription>
              Configure the privacy policy page at /s/{currentStore?.slug}/privacy
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Privacy Policy Page</Label>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(index, "title", e.target.value)}
                  placeholder="Section title"
                  className="font-medium"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSection(index)}
                  className="ml-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={section.content}
                onChange={(e) => updateSection(index, "content", e.target.value)}
                placeholder="Section content"
                rows={3}
              />
              {index < sections.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        <Button variant="outline" onClick={addSection} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Section
        </Button>

        <div className="space-y-1.5">
          <Label>Custom HTML Override (optional)</Label>
          <Textarea
            value={customHtml}
            onChange={(e) => setCustomHtml(e.target.value)}
            placeholder="<p>Your custom privacy policy HTML...</p>"
            rows={4}
          />
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Privacy Policy"}
        </Button>
      </CardContent>
    </Card>
  );
}
