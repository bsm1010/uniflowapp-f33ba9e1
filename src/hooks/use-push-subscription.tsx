import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { subscribePush, unsubscribePush } from "@/lib/push/push.functions";
import { VAPID_PUBLIC_KEY } from "@/lib/push/vapid";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}

function bufToB64u(buf: ArrayBuffer | null): string {
  if (!buf) return "";
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export type PushStatus =
  | "unsupported"
  | "denied"
  | "default"
  | "granted-no-sub"
  | "granted-subscribed"
  | "loading";

export function usePushSubscription(storeId?: string | null) {
  const [status, setStatus] = useState<PushStatus>("loading");
  const subscribeFn = useServerFn(subscribePush);
  const unsubscribeFn = useServerFn(unsubscribePush);

  const refresh = useCallback(async () => {
    if (typeof window === "undefined") return;
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window) ||
      !("Notification" in window)
    ) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }
    if (Notification.permission === "default") {
      setStatus("default");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? "granted-subscribed" : "granted-no-sub");
    } catch {
      setStatus("granted-no-sub");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = useCallback(async () => {
    if (typeof window === "undefined") return { ok: false, error: "No window" };
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { ok: false, error: "Push not supported on this device." };
    }
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      await refresh();
      return { ok: false, error: "Notifications were not allowed." };
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });
    }
    const json = sub.toJSON();
    const p256dh = json.keys?.p256dh ?? bufToB64u(sub.getKey("p256dh"));
    const auth = json.keys?.auth ?? bufToB64u(sub.getKey("auth"));
    await subscribeFn({
      data: {
        endpoint: sub.endpoint,
        p256dh,
        auth,
        store_id: storeId ?? null,
        user_agent: navigator.userAgent.slice(0, 500),
      },
    });
    await refresh();
    return { ok: true };
  }, [refresh, storeId, subscribeFn]);

  const disable = useCallback(async () => {
    if (typeof window === "undefined") return { ok: false };
    if (!("serviceWorker" in navigator)) return { ok: false };
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await unsubscribeFn({ data: { endpoint: sub.endpoint } });
      await sub.unsubscribe();
    }
    await refresh();
    return { ok: true };
  }, [refresh, unsubscribeFn]);

  return { status, enable, disable, refresh };
}
