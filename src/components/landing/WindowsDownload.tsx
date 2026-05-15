import { Download, Zap, Shield, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import fenneclyBox from "@/assets/fennecly-windows-box.png";

const DOWNLOAD_URL =
  "https://github.com/bsm1010/FenneclySetup/releases/download/untagged-72b1a4a0dfc00bb66b82/FenneclySetup.exe";

export function WindowsDownload() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/5 shadow-soft">
          {/* decorative glows */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_60%)]" />

          <div className="relative grid gap-10 p-8 md:p-14 lg:grid-cols-2 lg:items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
                <Sparkle /> New · Desktop App
              </div>
              <h2 className="mt-5 text-4xl md:text-5xl font-bold font-display tracking-tight">
                Fennecly for{" "}
                <span className="text-gradient-brand">Windows</span>
              </h2>
              <p className="mt-4 max-w-xl text-base md:text-lg text-muted-foreground leading-relaxed">
                Get the full desktop experience — faster, smoother, and always
                available. Manage your store natively on Windows with offline
                access and instant launch.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button asChild size="lg" className="group shadow-glow">
                  <a href={DOWNLOAD_URL} download>
                    <Download className="h-5 w-5 transition-transform group-hover:translate-y-0.5" />
                    Download for Windows
                  </a>
                </Button>
                <span className="text-xs text-muted-foreground">
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
              <div className="relative h-64 w-64 md:h-80 md:w-80">
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-[#0078D4] via-[#2B88D8] to-[#50E6FF] shadow-2xl shadow-blue-500/40" />
                <div className="absolute inset-0 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.4),transparent_55%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <WindowsLogo className="h-32 w-32 md:h-40 md:w-40 text-white drop-shadow-xl" />
                </div>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border/60 bg-background/90 px-4 py-1.5 text-xs font-semibold backdrop-blur shadow-soft">
                  FenneclySetup.exe
                </div>
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
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/60 px-3 py-3 backdrop-blur">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

function Sparkle() {
  return <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />;
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
