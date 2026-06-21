import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  getCookieConsentSettings,
  saveCookieConsentSettings,
} from "@/lib/gdpr/cookie-consent.functions";

export function CookieConsentSettings() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [bannerTitle, setBannerTitle] = useState("Cookie Preferences");
  const [bannerText, setBannerText] = useState(
    "We use cookies to improve your experience. You can choose which cookies to allow.",
  );
  const [acceptAllText, setAcceptAllText] = useState("Accept All");
  const [rejectAllText, setRejectAllText] = useState("Reject All");
  const [saveText, setSaveText] = useState("Save Preferences");
  const [manageText, setManageText] = useState("Cookie Settings");
  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState("");
  const [position, setPosition] = useState("bottom");
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (!currentStore) return;
    getCookieConsentSettings({ data: { storeId: currentStore.id } }).then((s) => {
      if (s) {
        setEnabled(s.enabled);
        setBannerTitle(s.banner_title);
        setBannerText(s.banner_text);
        setAcceptAllText(s.accept_all_text);
        setRejectAllText(s.reject_all_text);
        setSaveText(s.save_text);
        setManageText(s.manage_text);
        setPrivacyPolicyUrl(s.privacy_policy_url ?? "");
        setPosition(s.position);
        setTheme(s.theme);
      }
      setLoading(false);
    });
  }, [currentStore]);

  const handleSave = async () => {
    if (!user || !currentStore) return;
    setSaving(true);
    try {
      await saveCookieConsentSettings({
        data: {
          storeId: currentStore.id,
          userId: user.id,
          enabled,
          bannerTitle,
          bannerText,
          acceptAllText,
          rejectAllText,
          saveText,
          manageText,
          privacyPolicyUrl: privacyPolicyUrl || null,
          position,
          theme,
        },
      });
      toast.success("Cookie consent settings saved");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardContent className="p-6">
          <div className="h-32 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Cookie Consent Banner</CardTitle>
            <CardDescription>
              Configure the cookie consent banner shown to visitors on your storefront
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Cookie Banner</Label>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Banner Title</Label>
            <Input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bottom">Bottom Center</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Banner Text</Label>
          <Input value={bannerText} onChange={(e) => setBannerText(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Accept All Button</Label>
            <Input value={acceptAllText} onChange={(e) => setAcceptAllText(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Reject All Button</Label>
            <Input value={rejectAllText} onChange={(e) => setRejectAllText(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Save Preferences</Label>
            <Input value={saveText} onChange={(e) => setSaveText(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Privacy Policy URL (optional)</Label>
            <Input
              value={privacyPolicyUrl}
              onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
              placeholder="/s/your-store/privacy"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
