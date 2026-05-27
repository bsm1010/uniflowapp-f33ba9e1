import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Bell, BellOff, Check, AlertTriangle, Smartphone, Volume2, Send, ExternalLink, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { usePushSubscription } from "@/hooks/use-push-subscription";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  sendTestPush,
  getPushStatus,
} from "@/lib/push/push.functions";
import { useCurrentStore } from "@/hooks/use-current-store";
import { supabase } from "@/integrations/supabase/client";
import { createTelegramLinkToken } from "@/lib/telegram-link.functions";

export const Route = createFileRoute("/dashboard/notifications/settings")({
  component: NotificationsSettings,
  head: () => ({
    meta: [
      { title: "Notification Settings — Fennecly" },
      { name: "description", content: "Choose which Fennecly push notifications to receive." },
    ],
  }),
});

type Prefs = {
  new_order: boolean;
  low_stock: boolean;
  order_status: boolean;
  delivery_update: boolean;
  payment: boolean;
  sound_enabled: boolean;
};

const DEFAULT_PREFS: Prefs = {
  new_order: true,
  low_stock: true,
  order_status: true,
  delivery_update: true,
  payment: true,
  sound_enabled: true,
};

const TELEGRAM_BOT_USERNAME = "FenneclyBOT";

function NotificationsSettings() {
  const { currentStore } = useCurrentStore();
  const { status, enable, disable, refresh } = usePushSubscription(currentStore?.id ?? null);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [subCount, setSubCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  const loadPrefs = useServerFn(getNotificationPreferences);
  const savePrefs = useServerFn(saveNotificationPreferences);
  const loadStatus = useServerFn(getPushStatus);
  const sendTest = useServerFn(sendTestPush);
  const generateLinkToken = useServerFn(createTelegramLinkToken);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    loadPrefs().then((p) =>
      setPrefs({
        new_order: p.new_order,
        low_stock: p.low_stock,
        order_status: p.order_status,
        delivery_update: p.delivery_update,
        payment: p.payment,
        sound_enabled: p.sound_enabled,
      }),
    );
    loadStatus().then((s) => setSubCount(s.subscriptionCount));
  }, [loadPrefs, loadStatus, status]);

  useEffect(() => {
    if (!currentStore?.id) return;
    supabase
      .from("stores")
      .select("telegram_chat_id")
      .eq("id", currentStore.id)
      .single()
      .then(({ data }) => {
        setTelegramConnected(!!data?.telegram_chat_id);
      });
  }, [currentStore?.id]);

  const handleDisconnectTelegram = async () => {
    if (!currentStore?.id) return;
    const { error } = await supabase
      .from("stores")
      .update({ telegram_chat_id: null })
      .eq("id", currentStore.id);
    if (!error) {
      setTelegramConnected(false);
      toast.success("Telegram disconnected");
    } else {
      toast.error("Failed to disconnect");
    }
  };

  const handleConnectTelegram = async () => {
    if (!currentStore?.id) {
      toast.error("Store not loaded yet.");
      return;
    }
    setLinking(true);
    try {
      const { token } = await generateLinkToken({ data: { storeId: currentStore.id } });
      const url = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;
      window.open(url, "_blank");
      toast.success("Press Start in Telegram to finish linking (link valid 15 min).");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create link");
    } finally {
      setLinking(false);
    }
  };

  const togglePref = async (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await savePrefs({ data: next });
    } catch {
      toast.error("Could not save preference");
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  };

  const handleEnable = async () => {
    const res = await enable();
    if (res.ok) toast.success("Push notifications enabled");
    else toast.error(res.error ?? "Could not enable notifications");
    const s = await loadStatus();
    setSubCount(s.subscriptionCount);
  };

  const handleDisable = async () => {
    await disable();
    toast.success("Push notifications disabled");
    const s = await loadStatus();
    setSubCount(s.subscriptionCount);
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await sendTest();
      if (res.sent > 0) toast.success(`Test sent to ${res.sent} device(s)`);
      else toast.error(res.error ?? `Failed (${res.failed} errors)`);
    } catch {
      toast.error("Test failed");
    } finally {
      setTesting(false);
    }
  };

  const items: Array<{ key: keyof Prefs; label: string; description: string }> = [
    { key: "new_order", label: "New orders", description: "🛍️ When a new order is placed" },
    { key: "low_stock", label: "Low stock alerts", description: "⚠️ When a product is running low" },
    { key: "order_status", label: "Order status changes", description: "📦 When an order moves through fulfillment" },
    { key: "delivery_update", label: "Delivery updates", description: "🚚 ZRExpress / shipment tracking changes" },
    { key: "payment", label: "Payments", description: "💰 When a payment is received" },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
        <p className="text-muted-foreground text-sm">
          Choose which push notifications you want on this device.
        </p>
      </div>

      {/* Telegram Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-[#229ED9]" />
                Telegram notifications
              </CardTitle>
              <CardDescription className="mt-1">
                {telegramConnected
                  ? "Your store is connected. You'll receive order alerts on Telegram."
                  : "Get instant order notifications in your Telegram app."}
              </CardDescription>
            </div>
            {telegramConnected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnectTelegram}>
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-[#229ED9] hover:bg-[#1a8bbf] text-white"
                onClick={handleConnectTelegram}
                disabled={!currentStore?.id || linking}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                {linking ? "Preparing…" : "Connect Telegram"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {telegramConnected ? (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Connected — new orders will be sent to your Telegram.
            </div>
          ) : (
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Click <strong>Connect Telegram</strong> above</li>
              <li>Telegram opens — press <strong>Start</strong> in the bot chat</li>
              <li>Come back here — status updates automatically</li>
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Push notifications Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push notifications
              </CardTitle>
              <CardDescription className="mt-1">
                {status === "granted-subscribed"
                  ? `Active on ${subCount} device${subCount === 1 ? "" : "s"}.`
                  : status === "denied"
                  ? "Blocked. Enable notifications in your browser settings to re-enable."
                  : status === "unsupported"
                  ? "Push notifications aren't supported on this browser/device."
                  : "Not enabled on this device."}
              </CardDescription>
            </div>
            {status === "granted-subscribed" ? (
              <Button variant="outline" size="sm" onClick={handleDisable}>
                <BellOff className="h-4 w-4 mr-1.5" /> Disable
              </Button>
            ) : status === "denied" ? (
              <Button variant="outline" size="sm" onClick={() => refresh()}>
                Re-check
              </Button>
            ) : (
              <Button size="sm" onClick={handleEnable} disabled={status === "unsupported" || status === "loading"}>
                <Bell className="h-4 w-4 mr-1.5" /> Enable
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {status === "denied" && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                Notifications are blocked at the browser level. On iPhone: Settings → Notifications → Fennecly →
                Allow Notifications.
              </div>
            </div>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleTest}
            disabled={status !== "granted-subscribed" || testing}
          >
            <Check className="h-4 w-4 mr-1.5" />
            {testing ? "Sending..." : "Send test notification"}
          </Button>
        </CardContent>
      </Card>

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle>What to notify me about</CardTitle>
          <CardDescription>These apply to all your stores.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((it) => (
            <div key={it.key} className="flex items-start justify-between gap-4 py-1">
              <div className="space-y-0.5">
                <Label htmlFor={`pref-${it.key}`} className="text-sm font-medium">
                  {it.label}
                </Label>
                <p className="text-xs text-muted-foreground">{it.description}</p>
              </div>
              <Switch
                id={`pref-${it.key}`}
                checked={prefs[it.key]}
                onCheckedChange={(v) => togglePref(it.key, v)}
                disabled={saving}
              />
            </div>
          ))}
          <div className="border-t pt-4 flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="pref-sound" className="text-sm font-medium flex items-center gap-1.5">
                <Volume2 className="h-4 w-4" /> Custom sound
              </Label>
              <p className="text-xs text-muted-foreground">
                Plays the Fennecly chime when this tab is open. iOS uses the system sound on the lock screen.
              </p>
            </div>
            <Switch
              id="pref-sound"
              checked={prefs.sound_enabled}
              onCheckedChange={(v) => togglePref("sound_enabled", v)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
