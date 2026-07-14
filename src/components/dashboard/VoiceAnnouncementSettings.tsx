import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Volume2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useOrderVoice } from "@/hooks/use-order-voice";

const isSpeechSupported =
  typeof window !== "undefined" && "speechSynthesis" in window;

function getStored(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function setStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}

const LANG_OPTIONS = [
  { value: "ar", label: "AR" },
  { value: "fr", label: "FR" },
  { value: "en", label: "EN" },
] as const;

const MODE_OPTIONS = [
  { value: "short", key: "short" as const },
  { value: "full", key: "full" as const },
] as const;

export function VoiceAnnouncementSettings() {
  const { t } = useTranslation();
  const { testVoice } = useOrderVoice();

  const [enabled, setEnabled] = useState(
    () => getStored("fennecly_voice_enabled", "false") === "true",
  );
  const [lang, setLang] = useState(() =>
    getStored("fennecly_voice_lang", "ar"),
  );
  const [mode, setMode] = useState(() =>
    getStored("fennecly_voice_mode", "short"),
  );
  const [volume, setVolume] = useState(() =>
    parseFloat(getStored("fennecly_voice_volume", "1")),
  );
  const [rate, setRate] = useState(() =>
    parseFloat(getStored("fennecly_voice_rate", "0.9")),
  );

  if (!isSpeechSupported) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {t("dashboard.voice.notSupported", "Voice announcements not supported in this browser")}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {t("dashboard.voice.useChrome", "Please use Chrome or Edge for this feature")}
          </p>
        </div>
      </div>
    );
  }

  const update = (key: string, value: string) => {
    setStored(key, value);
  };

  const handleEnabledChange = (on: boolean) => {
    setEnabled(on);
    update("fennecly_voice_enabled", String(on));
    if (on) {
      const u = new SpeechSynthesisUtterance(
        t("dashboard.voice.confirmOn", "تم تفعيل الإعلانات الصوتية"),
      );
      u.lang = lang === "ar" ? "ar-DZ" : lang === "fr" ? "fr-FR" : "en-US";
      u.volume = 0.7;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          {t("dashboard.voice.title", "Voice Announcements")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("dashboard.voice.subtitle", "Hear new orders read aloud automatically")}
        </p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="voice-enable" className="text-sm font-medium">
          {t("dashboard.voice.enable", "Enable voice")}
        </Label>
        <Switch
          id="voice-enable"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
        />
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t("dashboard.voice.language", "Language")}
        </Label>
        <div className="flex gap-1.5">
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setLang(opt.value);
                update("fennecly_voice_lang", opt.value);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                lang === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t("dashboard.voice.mode", "Announcement mode")}
        </Label>
        <div className="flex gap-1.5">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setMode(opt.value);
                update("fennecly_voice_mode", opt.value);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === opt.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {opt.value === "short"
                ? t("dashboard.voice.modeShort", "Short")
                : t("dashboard.voice.modeFull", "Full details")}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === "short"
            ? t("dashboard.voice.shortExample", "New order from Karim in Oran")
            : t("dashboard.voice.fullExample", "Reads all order details including products")}
        </p>
      </div>

      {/* Volume */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {t("dashboard.voice.volume", "Volume")}
          </Label>
          <span className="text-xs text-muted-foreground">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <Slider
          min={0}
          max={1}
          step={0.1}
          value={[volume]}
          onValueChange={([v]) => {
            setVolume(v);
            update("fennecly_voice_volume", String(v));
          }}
          className="w-full"
        />
      </div>

      {/* Speed */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            {t("dashboard.voice.speed", "Speed")}
          </Label>
          <span className="text-xs text-muted-foreground">
            {rate <= 0.6
              ? t("dashboard.voice.slow", "Slow")
              : rate >= 1.3
                ? t("dashboard.voice.fast", "Fast")
                : t("dashboard.voice.normal", "Normal")}
          </span>
        </div>
        <Slider
          min={0.5}
          max={1.5}
          step={0.1}
          value={[rate]}
          onValueChange={([v]) => {
            setRate(v);
            update("fennecly_voice_rate", String(v));
          }}
          className="w-full"
        />
      </div>

      {/* Test button */}
      <Button
        variant="outline"
        size="sm"
        onClick={testVoice}
        disabled={!enabled}
      >
        <Volume2 className="h-4 w-4 mr-1.5" />
        {t("dashboard.voice.test", "Test voice announcement")}
      </Button>
    </div>
  );
}
