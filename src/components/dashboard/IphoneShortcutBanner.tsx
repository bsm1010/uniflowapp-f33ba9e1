import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, Share, Plus } from "lucide-react";

const GUIDE_URL = "https://fennecly.online/iphone-guide";
const QR_URL = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(GUIDE_URL)}&bgcolor=000000&color=ffffff&format=png&margin=4`;

export function IphoneShortcutBanner() {
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("iphone-banner-v2-dismissed") === "true"
  );
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isDesktop || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem("iphone-banner-v2-dismissed", "true");
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-4 overflow-visible rounded-3xl"
        style={{
          background: "linear-gradient(135deg, #09090f 0%, #120f24 50%, #0b1220 100%)",
          border: "1px solid rgba(139,92,246,0.2)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="pointer-events-none absolute -top-20 left-16 h-52 w-52 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="pointer-events-none absolute right-48 top-0 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-full text-white/30 transition hover:bg-white/10 hover:text-white/70"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex items-stretch">

          {/* LEFT: Text content */}
          <div className="flex-1 p-6 pr-4">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1"
              style={{
                background: "rgba(139,92,246,0.18)",
                border: "1px solid rgba(139,92,246,0.3)",
              }}
            >
              <span className="text-xs font-bold tracking-widest uppercase text-violet-300">New</span>
              <span className="h-1 w-1 rounded-full bg-violet-400/60" />
              <span className="text-xs text-violet-300/70">iPhone Ready</span>
            </div>

            <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
              Fennecly is now<br />
              <span style={{ color: "#a78bfa" }}>available on iPhone</span>
            </h2>

            <p className="mt-2.5 text-sm leading-relaxed text-white/50 max-w-xs">
              No App Store needed. Scan the QR code with your iPhone camera to open the install guide.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: Share, label: "Tap Share" },
                { icon: Plus, label: "Add to Home" },
                { icon: Bell, label: "Allow Notifs" },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <step.icon className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-xs font-medium text-white/60">{step.label}</span>
                </div>
              ))}
            </div>

            <a
              href={GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-xs text-violet-400/70 hover:text-violet-300 transition-colors underline underline-offset-2"
            >
              Or tap here to open the guide →
            </a>
          </div>

          {/* RIGHT: QR + floating iPhone mockup */}
          <div
            className="flex shrink-0 items-center gap-4 pl-5 pr-6 py-5 relative"
            style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
          >
            {/* QR Code */}
            <div className="flex flex-col items-center gap-2 z-10">
              <div
                className="relative rounded-2xl p-2.5"
                style={{
                  background: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  boxShadow: "0 0 40px rgba(139,92,246,0.15)",
                }}
              >
                <img
                  src={QR_URL}
                  alt="Scan to open Fennecly iPhone install guide"
                  width={130}
                  height={130}
                  className="block rounded-xl"
                  loading="eager"
                  decoding="async"
                />
                <div className="absolute left-2 top-2 h-4 w-4 rounded-tl-md border-l-2 border-t-2 border-violet-400/50" />
                <div className="absolute right-2 top-2 h-4 w-4 rounded-tr-md border-r-2 border-t-2 border-violet-400/50" />
                <div className="absolute bottom-2 left-2 h-4 w-4 rounded-bl-md border-b-2 border-l-2 border-violet-400/50" />
                <div className="absolute bottom-2 right-2 h-4 w-4 rounded-br-md border-b-2 border-r-2 border-violet-400/50" />
              </div>
              <p className="text-center text-[11px] font-medium text-white/30 leading-tight">
                Scan with iPhone<br />camera app
              </p>
            </div>

            {/* Floating iPhone mockup */}
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-20"
              style={{ pointerEvents: "none" }}
            >
              <img
                src="/images/iphone-mockup.webp"
                width={180}
                height={300}
                alt="Fennecly on iPhone"
                loading="eager"
                decoding="async"
                style={{
                  height: 300,
                  width: "auto",
                  objectFit: "contain",
                  transform: "rotate(3deg)",
                  filter: "drop-shadow(0 24px 48px rgba(139,92,246,0.45))",
                }}
              />
            </motion.div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
}
