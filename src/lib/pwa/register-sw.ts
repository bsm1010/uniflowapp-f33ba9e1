// Register the service worker — but never inside the Lovable preview iframe.
// SW activates only on the published site / installed PWA.

let registered = false;

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (registered) return;
  if (!("serviceWorker" in navigator)) return;

  let inIframe = false;
  try {
    inIframe = window.self !== window.top;
  } catch {
    inIframe = true;
  }

  const isPreviewHost =
    window.location.hostname.includes("id-preview--") ||
    window.location.hostname.includes("lovableproject.com");

  if (inIframe || isPreviewHost) {
    // Make sure we never leave a stale SW around in preview contexts.
    navigator.serviceWorker
      .getRegistrations()
      .then((regs) => {
        regs.forEach((r) => r.unregister());
      })
      .catch(() => {});
    return;
  }

  registered = true;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js", { scope: "/" }).catch((err) => {
      console.warn("SW registration failed", err);
    });
  });

  // Play custom sound when SW asks
  navigator.serviceWorker.addEventListener("message", (ev) => {
    if (ev.data?.type === "PLAY_NOTIFICATION_SOUND") {
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch {
        // ignore
      }
    }
  });
}
