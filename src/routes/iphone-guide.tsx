import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Share, Plus, Bell, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/iphone-guide")({
  component: IphoneGuidePage,
  head: () => ({
    meta: [
      { title: "Add Fennecly to iPhone — Quick Guide" },
      {
        name: "description",
        content: "How to install Fennecly on your iPhone home screen and enable notifications.",
      },
      { name: "theme-color", content: "#09090f" },
    ],
  }),
});

const steps = [
  {
    number: "01",
    icon: Share,
    title: "Tap the Share button",
    desc: "Open fennecly.online in Safari, then tap the Share icon at the bottom of your screen.",
    tip: "Must use Safari — Chrome won't show the option.",
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.12)",
  },
  {
    number: "02",
    icon: Plus,
    title: 'Tap "Add to Home Screen"',
    desc: 'Scroll down in the share sheet and tap "Add to Home Screen". Give it a name — we suggest "Fennecly".',
    tip: "The icon will appear just like a real app.",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.12)",
  },
  {
    number: "03",
    icon: Bell,
    title: "Allow Notifications",
    desc: "Open Fennecly from your home screen and allow notifications when prompted — so you never miss an order.",
    tip: "You can manage this anytime in iPhone Settings → Fennecly.",
    color: "#059669",
    bg: "rgba(5,150,105,0.12)",
  },
];

function IphoneGuidePage() {
  return (
    <div
      className="min-h-screen w-full"
      style={{
        background: "linear-gradient(160deg, #09090f 0%, #0f0a1e 50%, #080d18 100%)",
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-sm px-5 pb-16 pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[20px]"
            style={{
              background: "linear-gradient(135deg, #1a1030, #0d0820)",
              border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 0 30px rgba(139,92,246,0.2)",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6.5" height="6.5" rx="1.5" fill="#AFA9EC" />
              <rect x="10.5" y="1" width="6.5" height="6.5" rx="1.5" fill="#7F77DD" />
              <rect x="1" y="10.5" width="6.5" height="6.5" rx="1.5" fill="#7F77DD" />
              <rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1.5" fill="#534AB7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white">
            Add Fennecly
            <br />
            to your iPhone
          </h1>
          <p className="mt-3 text-base text-white/50 leading-relaxed">
            3 quick steps — takes less than a minute. Get instant order notifications on your home
            screen.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.15 + i * 0.1 }}
              className="relative overflow-hidden rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span className="absolute right-4 top-3 text-5xl font-black tracking-tighter opacity-[0.06] text-white select-none">
                {step.number}
              </span>

              <div className="flex items-start gap-4">
                <div
                  className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    background: step.bg,
                    border: `1px solid ${step.color}33`,
                  }}
                >
                  <step.icon className="h-5 w-5" style={{ color: step.color }} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-white text-[15px] leading-snug">{step.title}</p>
                  <p className="mt-1.5 text-sm text-white/50 leading-relaxed">{step.desc}</p>
                  <div
                    className="mt-3 flex items-start gap-1.5 rounded-lg px-3 py-2"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <span className="mt-px text-[10px]">💡</span>
                    <p className="text-[11px] text-white/35 leading-relaxed">{step.tip}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Done */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-6 rounded-2xl p-5 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(5,150,105,0.12), rgba(5,150,105,0.05))",
            border: "1px solid rgba(5,150,105,0.2)",
          }}
        >
          <CheckCircle2 className="mx-auto h-8 w-8 mb-2" style={{ color: "#34d399" }} />
          <p className="font-semibold text-white">You're all set!</p>
          <p className="mt-1 text-sm text-white/45">
            Open Fennecly from your home screen and manage your store on the go.
          </p>
        </motion.div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-white/20">
          fennecly.online · Works on iPhone with Safari
        </p>
      </div>
    </div>
  );
}
