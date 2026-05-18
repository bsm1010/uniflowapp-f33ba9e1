import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Share, Plus } from "lucide-react";

export function IphoneShortcutBanner() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("iphone-banner-dismissed") === "true"
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
        className="relative mt-4 overflow-hidden rounded-3xl border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, #09090f 0%, #120f24 45%, #0b1220 100%)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Background glows */}
        <div className="pointer-events-none absolute -top-16 left-10 h-44 w-44 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-10 top-0 h-40 w-40 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-28 w-72 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative flex items-center gap-5 px-5 py-5">

          {/* PREMIUM 3D IPHONE */}
          <div className="hidden shrink-0 sm:block">
            <motion.div
              whileHover={{
                rotateY: -8,
                rotateX: 6,
                scale: 1.03,
              }}
              transition={{
                type: "spring",
                stiffness: 180,
                damping: 18,
              }}
              className="relative"
              style={{
                width: 72,
                height: 140,
                transformStyle: "preserve-3d",
                perspective: 1200,
              }}
            >
              {/* Shadow */}
              <div
                className="absolute inset-0 rounded-[28px] blur-2xl"
                style={{
                  background: "rgba(139,92,246,0.35)",
                  transform: "translateY(18px) scale(0.9)",
                }}
              />

              {/* Titanium body */}
              <div
                className="absolute inset-0 rounded-[28px]"
                style={{
                  background:
                    "linear-gradient(145deg,#3b3b45 0%,#1e1e28 30%,#0c0c14 100%)",
                  boxShadow:
                    "0 25px 50px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -2px 6px rgba(0,0,0,0.4)",
                  transform: "rotateX(10deg) rotateY(-14deg)",
                }}
              >
                {/* Screen */}
                <div
                  className="absolute inset-[3px] overflow-hidden rounded-[25px] border border-white/10"
                  style={{
                    background:
                      "linear-gradient(180deg,#09090f 0%,#111827 100%)",
                  }}
                >
                  {/* Dynamic island */}
                  <div
                    className="absolute left-1/2 top-3 z-30 h-5 w-20 -translate-x-1/2 rounded-full"
                    style={{
                      background: "#000",
                      boxShadow:
                        "inset 0 1px 2px rgba(255,255,255,0.08)",
                    }}
                  />

                  {/* Reflection */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 35%, transparent 100%)",
                    }}
                  />

                  {/* UI */}
                  <div className="relative flex h-full flex-col justify-between p-3">
                    {/* Header */}
                    <div className="pt-7">
                      <div
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1"
                        style={{
                          background: "rgba(139,92,246,0.15)",
                          border:
                            "1px solid rgba(139,92,246,0.25)",
                        }}
                      >
                        <Bell className="h-2.5 w-2.5 text-violet-300" />

                        <span className="text-[7px] font-medium text-violet-200">
                          Fennecly AI
                        </span>
                      </div>

                      <h3 className="mt-3 text-[10px] font-bold leading-tight text-white">
                        New order
                        <span className="block text-violet-400">
                          received 🎉
                        </span>
                      </h3>
                    </div>

                    {/* Chat */}
                    <div className="space-y-1.5">
                      <div className="ml-auto max-w-[80%] rounded-xl rounded-br-sm bg-violet-500 px-2 py-1 text-[6px] text-white shadow">
                        Hello 👋
                      </div>

                      <div
                        className="max-w-[85%] rounded-xl rounded-bl-sm px-2 py-1 text-[6px] text-white/80"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border:
                            "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        AI replied automatically.
                      </div>

                      <div className="ml-auto max-w-[75%] rounded-xl rounded-br-sm bg-violet-500 px-2 py-1 text-[6px] text-white shadow">
                        Amazing ⚡
                      </div>
                    </div>

                    {/* Bottom line */}
                    <div className="pb-2">
                      <div
                        className="mx-auto h-1 w-14 rounded-full"
                        style={{
                          background:
                            "rgba(255,255,255,0.25)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Side buttons */}
              <div className="absolute -left-[2px] top-8 h-6 w-[2px] rounded-full bg-zinc-500/60" />
              <div className="absolute -left-[2px] top-16 h-8 w-[2px] rounded-full bg-zinc-500/60" />
              <div className="absolute -right-[2px] top-12 h-10 w-[2px] rounded-full bg-zinc-500/60" />
            </motion.div>
          </div>

          {/* TEXT */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-white">
                📱 Fennecly is now available on iPhone!
              </span>

              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  background: "rgba(139,92,246,0.3)",
                  color: "#c4b5fd",
                  border:
                    "1px solid rgba(139,92,246,0.4)",
                }}
              >
                New
              </span>
            </div>

            <p className="mt-1 text-xs leading-5 text-white/55">
              Get instant order notifications on your iPhone —
              no App Store required.
            </p>

            {/* Steps */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {[
                { icon: Share, label: "Tap Share" },
                { icon: Plus, label: "Add to Home Screen" },
                { icon: Bell, label: "Allow Notifications" },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5"
                >
                  {i > 0 && (
                    <div className="h-px w-3 bg-white/20" />
                  )}

                  <div className="flex items-center gap-1">
                    <div
                      className="flex h-5 w-5 items-center justify-center rounded-md"
                      style={{
                        background:
                          "rgba(139,92,246,0.2)",
                        border:
                          "1px solid rgba(139,92,246,0.3)",
                      }}
                    >
                      <step.icon className="h-3 w-3 text-violet-400" />
                    </div>

                    <span className="text-xs text-white/65">
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CLOSE BUTTON */}
          <button
            onClick={handleDismiss}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white/90"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
