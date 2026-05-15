import { Download, Zap, Shield, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import fenneclyBox from "@/assets/fennecly-windows-box.png";

const DOWNLOAD_URL =
  "https://github.com/bsm1010/FenneclySetup/releases/download/untagged-72b1a4a0dfc00bb66b82/FenneclySetup.exe";

export function WindowsDownload() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl"
          style={{
            background:
              "radial-gradient(circle at 20% 10%, #4c1d95 0%, #2e1065 40%, #1a0a3e 75%, #120633 100%)",
          }}
        >
          {/* decorative glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-600/30 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_60%)]" />

          <div className="relative grid gap-10 p-8 md:p-14 lg:grid-cols-2 lg:items-center text-white">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur">
                <Sparkle /> New · Desktop App
              </div>
              <h2 className="mt-5 text-4xl md:text-5xl font-bold font-display tracking-tight text-white">
                Fennecly for{" "}
                <span className="bg-gradient-to-r from-fuchsia-300 via-purple-200 to-indigo-200 bg-clip-text text-transparent">
                  Windows
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-base md:text-lg text-purple-100/80 leading-relaxed">
                Get the full desktop experience — faster, smoother, and always
                available. Manage your store natively on Windows with offline
                access and instant launch.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="group bg-white text-[#2e1065] hover:bg-purple-50 shadow-xl shadow-purple-900/40"
                >
                  <a href={DOWNLOAD_URL} download>
                    <WindowsLogo className="h-5 w-5" />
                    <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                    Download for Windows
                  </a>
                </Button>
                <span className="text-xs text-purple-200/70">
                  Free · Windows 10/11 · ~80 MB
                </span>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 max-w-md">
                <Feature icon={Zap} label="Faster" />
                <Feature icon={Shield} label="Secure" />
                <Feature icon={Monitor} label="Native UI" />
              </div>
            </div>

            {/* Right: visual */}
            <div className="relative flex items-center justify-center">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/30 via-purple-500/20 to-blue-500/30 blur-3xl" />
                <img
                  src={fenneclyBox}
                  alt="Fennecly for Windows desktop app box"
                  loading="lazy"
                  className="h-auto w-full max-w-md drop-shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-3 backdrop-blur">
      <Icon className="h-5 w-5 text-fuchsia-300" />
      <span className="text-xs font-medium text-white">{label}</span>
    </div>
  );
}

function Sparkle() {
  return <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-300 animate-pulse" />;
}

export function WindowsLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 5.5 11 4.3v7.2H3V5.5Zm0 13L11 19.7v-7.2H3v6Zm9-14.3L21 3v8.5h-9V4.2Zm0 8.3h9V21l-9-1.2v-7.3Z" />
    </svg>
  );
}
