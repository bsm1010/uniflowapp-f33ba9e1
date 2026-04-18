import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Save,
  Map as MapIcon,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { getStoreTokens, type StoreSettings } from "@/lib/storeTheme";

export const Route = createFileRoute("/dashboard/contact")({
  component: ContactEditor,
  head: () => ({ meta: [{ title: "Contact Page — Storely" }] }),
});

function ContactEditor() {
  const { user } = useAuth();
  const { isExpired } = useSubscription();
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [intro, setIntro] = useState("Have a question? We'd love to hear from you.");
  const [formEnabled, setFormEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const s = data as unknown as StoreSettings;
      setSettings(s);
      setEmail(s.contact_email ?? "");
      setPhone(s.contact_phone ?? "");
      setAddress(s.contact_address ?? "");
      setMapUrl(s.contact_map_url ?? "");
      setIntro(s.contact_intro ?? "Have a question? We'd love to hear from you.");
      setFormEnabled(s.contact_form_enabled ?? true);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const markDirty = () => setDirty(true);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("store_settings")
      .update({
        contact_email: email.trim(),
        contact_phone: phone.trim(),
        contact_address: address.trim(),
        contact_map_url: mapUrl.trim(),
        contact_intro: intro.trim() || "Have a question? We'd love to hear from you.",
        contact_form_enabled: formEnabled,
      })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Contact page saved");
    setDirty(false);
  };

  const tokens = settings ? getStoreTokens(settings) : null;
  const slug = settings?.slug;

  return (
    <div className="max-w-[1400px] mx-auto">
      {isExpired && <ExpiredOverlay />}
      <PageHeader
        eyebrow="Storefront"
        title="Contact page"
        description="Show shoppers how to reach you. Lives at /s/your-store/contact."
        actions={
          <>
            {slug && (
              <Button variant="outline" asChild disabled={dirty}>
                <a href={`/s/${slug}/contact`} target="_blank" rel="noopener noreferrer">
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
                <MessageSquare className="h-4 w-4 text-primary" />
                <h2 className="font-medium">Contact details</h2>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intro">Page intro</Label>
                <Textarea
                  id="intro"
                  value={intro}
                  onChange={(e) => {
                    setIntro(e.target.value);
                    markDirty();
                  }}
                  rows={2}
                  maxLength={240}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" /> Store email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    markDirty();
                  }}
                  placeholder="hello@yourstore.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" /> Phone number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    markDirty();
                  }}
                  placeholder="+1 555 123 4567"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5" /> Address
                </Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    markDirty();
                  }}
                  rows={3}
                  placeholder="123 Main Street, Suite 100&#10;City, State ZIP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="map" className="flex items-center gap-2">
                  <MapIcon className="h-3.5 w-3.5" /> Google Maps link
                </Label>
                <Input
                  id="map"
                  type="url"
                  value={mapUrl}
                  onChange={(e) => {
                    setMapUrl(e.target.value);
                    markDirty();
                  }}
                  placeholder="https://maps.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Paste a share link from Google Maps. Customers will get a "Get directions" button.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                <div>
                  <div className="text-sm font-medium">Enable contact form</div>
                  <div className="text-xs text-muted-foreground">
                    Let visitors send you a message directly.
                  </div>
                </div>
                <Switch
                  checked={formEnabled}
                  onCheckedChange={(v) => {
                    setFormEnabled(v);
                    markDirty();
                  }}
                />
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
                <div className="max-w-xl mx-auto space-y-6">
                  <div>
                    <h1
                      className="text-3xl md:text-4xl font-semibold leading-tight"
                      style={{ fontFamily: tokens?.fontHeading }}
                    >
                      Get in touch
                    </h1>
                    <p className="mt-2 text-sm" style={{ color: tokens?.muted }}>
                      {intro}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {email && (
                      <PreviewRow icon={<Mail className="h-4 w-4" />} label="Email" value={email} muted={tokens?.muted} />
                    )}
                    {phone && (
                      <PreviewRow icon={<Phone className="h-4 w-4" />} label="Phone" value={phone} muted={tokens?.muted} />
                    )}
                    {address && (
                      <PreviewRow icon={<MapPin className="h-4 w-4" />} label="Address" value={address} muted={tokens?.muted} />
                    )}
                    {!email && !phone && !address && (
                      <div
                        className="text-sm rounded-lg border border-dashed p-4 text-center"
                        style={{ color: tokens?.muted, borderColor: tokens?.border }}
                      >
                        Add an email, phone, or address to see them here.
                      </div>
                    )}
                  </div>

                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: tokens?.primary,
                        color: tokens?.onPrimary,
                        borderRadius: tokens?.buttonRadius,
                      }}
                    >
                      <MapIcon className="h-4 w-4" /> Get directions
                    </a>
                  )}

                  {formEnabled && (
                    <div className="space-y-3 pt-4" style={{ borderTop: `1px solid ${tokens?.border}` }}>
                      <div className="text-sm font-medium">Send us a message</div>
                      <div className="grid gap-2">
                        <div
                          className="h-9 rounded px-3 flex items-center text-xs"
                          style={{ backgroundColor: tokens?.surface, color: tokens?.muted }}
                        >
                          Your name
                        </div>
                        <div
                          className="h-9 rounded px-3 flex items-center text-xs"
                          style={{ backgroundColor: tokens?.surface, color: tokens?.muted }}
                        >
                          Your email
                        </div>
                        <div
                          className="h-20 rounded px-3 py-2 text-xs"
                          style={{ backgroundColor: tokens?.surface, color: tokens?.muted }}
                        >
                          Message...
                        </div>
                      </div>
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

function PreviewRow({
  icon,
  label,
  value,
  muted,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: "rgba(0,0,0,0.05)" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider" style={{ color: muted }}>
          {label}
        </div>
        <div className="text-sm whitespace-pre-line break-words">{value}</div>
      </div>
    </div>
  );
}
