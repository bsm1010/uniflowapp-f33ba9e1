import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import fennecyIcon from "@/assets/fennecly-icon.webp";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "fennecly:ios-install-dismissed-at";
const DISMISS_DAYS = 7;

function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent.toLowerCase();
  // iPad on iPadOS 13+ reports as Mac with touch — include that.
  return (
    /iphone|ipad|ipod/.test(ua) ||
    (ua.includes("mac") && "ontouchend" in document)
  );
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari standalone flag
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function IOSInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isIos() || isStandalone() || !isSafari()) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const ageMs = Date.now() - dismissedAt;
    if (dismissedAt && ageMs < DISMISS_DAYS * 86400000) return;
    setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
    setShowGuide(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -32, opacity: 0 }}
        className="md:hidden sticky top-0 z-40 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-md"
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <img src={fennecyIcon} alt="" className="h-9 w-9 rounded-lg bg-white/10 p-1" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">
              Add Fenncly to your Home Screen
            </p>
            <p className="text-xs opacity-90 truncate">
              Get instant push notifications for new orders.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowGuide((v) => !v)}
            className="h-8 text-xs"
          >
            {showGuide ? "Hide" : "How"}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="text-primary-foreground/80 hover:text-primary-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <AnimatePresence>
          {showGuide && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-white/10 backdrop-blur"
            >
              <ol className="px-4 pb-4 pt-2 space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">1</span>
                  <span>Tap the</span>
                  <Share className="h-4 w-4" />
                  <span>Share button at the bottom of Safari</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">2</span>
                  <span>Scroll and tap</span>
                  <span className="inline-flex items-center gap-1 rounded bg-white/20 px-1.5 py-0.5 text-xs">
                    <Plus className="h-3 w-3" /> Add to Home Screen
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">3</span>
                  <span>Open Fenncly from your Home Screen, then enable notifications.</span>
                </li>
              </ol>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
