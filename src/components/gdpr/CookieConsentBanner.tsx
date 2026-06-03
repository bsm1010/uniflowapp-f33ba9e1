import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getCookieConsentSettings, recordCookieConsent } from "@/lib/gdpr/cookie-consent.functions";
import type { CookieConsentSettings } from "@/lib/gdpr/cookie-consent.functions";

function getVisitorId(): string {
  const key = "gdpr_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getConsentKey(storeId: string): string {
  return `gdpr_consent_${storeId}`;
}

export function CookieConsentBanner({ storeId }: { storeId: string }) {
  const [settings, setSettings] = useState<CookieConsentSettings | null>(null);
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [preferences, setPreferences] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(getConsentKey(storeId));
    if (saved) return;

    getCookieConsentSettings({ data: { storeId } }).then((s) => {
      if (s?.enabled) {
        setSettings(s);
        setVisible(true);
      }
    });
  }, [storeId]);

  const saveConsent = useCallback(
    async (necessary: boolean, analyticsVal: boolean, marketingVal: boolean, preferencesVal: boolean) => {
      const visitorId = getVisitorId();
      await recordCookieConsent({
        data: {
          storeId,
          visitorId,
          necessary,
          analytics: analyticsVal,
          marketing: marketingVal,
          preferences: preferencesVal,
        },
      });
      localStorage.setItem(getConsentKey(storeId), "true");
      setVisible(false);
    },
    [storeId],
  );

  if (!visible || !settings) return null;

  const positionClass =
    settings.position === "bottom-left"
      ? "bottom-4 left-4"
      : settings.position === "bottom-right"
        ? "bottom-4 right-4"
        : "bottom-4 left-1/2 -translate-x-1/2";

  return (
    <div
      className={`fixed ${positionClass} z-[9999] w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500`}
    >
      <div className="rounded-2xl border border-border/60 bg-background shadow-2xl p-5">
        <h3 className="font-semibold text-base mb-2">{settings.banner_title}</h3>
        <p className="text-sm text-muted-foreground mb-4">{settings.banner_text}</p>

        {showCustomize && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Necessary</Label>
              <Switch checked disabled />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Analytics</Label>
              <Switch checked={analytics} onCheckedChange={setAnalytics} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Marketing</Label>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Preferences</Label>
              <Switch checked={preferences} onCheckedChange={setPreferences} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => saveConsent(true, true, true, true)}>
            {settings.accept_all_text}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => saveConsent(true, false, false, false)}
          >
            {settings.reject_all_text}
          </Button>
          {!showCustomize ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCustomize(true)}
            >
              {settings.manage_text}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveConsent(true, analytics, marketing, preferences)}
            >
              {settings.save_text}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
