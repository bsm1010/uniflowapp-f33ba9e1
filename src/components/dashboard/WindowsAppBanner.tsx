import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { WindowsLogo } from "@/components/landing/WindowsDownload";

const DOWNLOAD_URL =
  "https://github.com/bsm1010/FenneclySetup/releases/download/untagged-72b1a4a0dfc00bb66b82/FenneclySetup.exe";
const DISMISS_KEY = "fennecly_windows_banner_dismissed_v1";

export function WindowsAppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(DISMISS_KEY) !== "1");
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="relative mt-6 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-[#0078D4]/10 via-primary/5 to-[#50E6FF]/10 p-5 shadow-soft"
        >
          <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#0078D4]/30 blur-3xl" />
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-3 right-3 rounded-md p-1 text-muted-foreground hover:bg-background/60 hover:text-foreground transition"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0078D4] to-[#50E6FF] shadow-lg shadow-blue-500/30">
              <WindowsLogo className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base md:text-lg font-bold font-display">
                🎉 Fennecly for Windows is here!
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Download the desktop app for a faster, smoother experience.
              </p>
            </div>
            <Button asChild className="shrink-0 group">
              <a href={DOWNLOAD_URL} download>
                <Download className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                Download
              </a>
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
