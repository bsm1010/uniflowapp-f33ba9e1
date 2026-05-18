import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Share, Plus } from "lucide-react";

export function IphoneShortcutBanner() {
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("iphone-banner-dismissed") === "true"
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("iphone-banner-dismissed", "true");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-4 relative overflow-hidden rounded-2xl border border-white/10"
        style={{
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1035 40%, #0f1a2e 100%)",
        }}
      >
        {/* Glow effects */}
        <div className="absolute -top-10 left-20 h-32 w-32 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-40 h-32 w-32 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 h-20 w-64 -translate-x-1/2 rounded-full bg-violet-500/10 blur-2xl pointer-events-none" />

        <div className="relative flex items-center gap-4 px-5 py-4">

          {/* 3D iPhone mockup */}
          <div className="shrink-0 hidden sm:block">
            <div className="relative" style={{ width: 52, height: 88 }}>
              {/* Phone body */}
              <div
                className="absolute inset-0 rounded-[14px] border border-white/20"
                style={{
                  background: "linear-gradient(145deg, #2a2a3e 0%, #1a1a2e 50%, #111120 100%)",
                  boxShadow: "4px 6px 20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1), -2px -2px 8px rgba(139,92,246,0.15)",
                }}
              />
              {/* Screen */}
              <div
                className="absolute rounded-[10px] overflow-hidden"
                style={{
                  top: 6, left: 4, right: 4, bottom: 6,
                  background: "linear-gradient(160deg, #1e1040 0%, #0d0d1f 100%)",
                }}
              >
                {/* Status bar */}
                <div className="flex justify-between items-center px-2 pt-1">
                  <span style={{ fontSize: 4, color: "rgba(255,255,255,0.6)" }}>9:41</span>
                  <div className="flex gap-0.5 items-center">
                    <div className="h-1 w-1 rounded-full bg-white/60" />
                    <div className="h-1 w-1 rounded-full bg-white/60" />
                    <div className="h-1 w-1 rounded-full bg-white/60" />
                  </div>
                </div>
                {/* Notification card on screen */}
                <div className="mx-1 mt-1 rounded-md p-1"
                  style={{ background: "rgba(139,92,246,0.25)", border: "0.5px solid rgba(139,92,246,0.4)" }}>
                  <div className="flex items-center gap-1">
                    <div className="h-2.5 w-2.5 rounded-sm bg-violet-500 flex items-center justify-center">
                      <Bell style={{ width: 5, height: 5, color: "white" }} />
                    </div>
                    <span style={{ fontSize: 3.5, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>Fennecly</span>
                  </div>
                  <p style={{ fontSize: 3, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>New order received! 🎉</p>
                </div>
                {/* App icon grid */}
                <div className="grid grid-cols-3 gap-1 px-1.5 mt-2">
                  {["bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-pink-500", "bg-cyan-500"].map((c, i) => (
                    <div key={i} className={`${c} rounded-sm`} style={{ height: 8, opacity: 0.8 }} />
                  ))}
                </div>
              </div>
              {/* Home indicator */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-white/30" />
              {/* Side button */}
              <div className="absolute -right-0.5 top-6 h-4 w-0.5 rounded-full bg-white/20" />
              {/* Volume buttons */}
              <div className="absolute -left-0.5 top-5 h-3 w-0.5 rounded-full bg-white/20" />
              <div className="absolute -left-0.5 top-9 h-3 w-0.5 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-white">
                📱 Fennecly is now available on iPhone!
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "rgba(139,92,246,0.3)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.4)" }}>
                New
              </span>
            </div>
            <p className="mt-0.5 text-xs text-white/50">
              Get instant order notifications on your iPhone — no app store needed.
            </p>
            {/* Steps */}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {[
                { icon: Share, label: "Tap Share" },
                { icon: Plus, label: "Add to Home Screen" },
                { icon: Bell, label: "Allow Notifications" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {i > 0 && <div className="h-px w-3 bg-white/20" />}
                  <div className="flex items-center gap-1">
                    <div className="h-5 w-5 rounded-md flex items-center justify-center"
                      style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}>
                      <step.icon className="h-3 w-3 text-violet-400" />
                    </div>
                    <span className="text-xs text-white/60">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-colors hover:bg-white/10 text-white/40 hover:text-white/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
