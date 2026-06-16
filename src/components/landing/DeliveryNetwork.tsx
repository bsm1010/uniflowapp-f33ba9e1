import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Truck } from "lucide-react";
import zrLogo from "@/assets/zrexpress-logo.png";
import yalidineLogo from "@/assets/yalidine-logo.png";
import maystroLogo from "@/assets/maystro-logo.svg";

const companies = [
  { name: "ZRexpress", logo: zrLogo, color: "#e11d48", x: 10, y: 20 },
  { name: "Yalidine", logo: yalidineLogo, color: "#2563eb", x: 50, y: 5 },
  { name: "Maystro", logo: maystroLogo, color: "#16a34a", x: 90, y: 20 },
];

export function DeliveryNetwork() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0].isIntersecting),
      { rootMargin: "200px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={containerRef} className="py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/5 to-transparent pointer-events-none" />
      <div className="mx-auto max-w-6xl px-4 relative">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
            {t("delivery.kicker", "Delivery Integration")}
          </span>
          <h2 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight">
            {t("delivery.titleA", "Ship with")}{" "}
            <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
              {t("delivery.titleB", "any carrier")}
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t("delivery.subtitle", "Send orders directly to Algeria's top delivery networks — no manual entry needed.")}
          </p>
        </div>

        <div className="relative mx-auto max-w-3xl" style={{ height: 320 }}>
          {/* SVG lines */}
          <svg
            viewBox="0 0 100 40"
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#d946ef" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            {companies.map((c, i) => (
              <g key={c.name}>
                <line
                  x1="50"
                  y1="20"
                  x2={c.x}
                  y2={c.y + 10}
                  stroke="url(#lineGrad)"
                  strokeWidth="0.3"
                  strokeLinecap="round"
                  strokeDasharray="60"
                  strokeDashoffset={inView ? 0 : 60}
                  style={{ transition: `stroke-dashoffset 1.2s ease ${i * 0.4}s` }}
                />
                <circle
                  cx={c.x}
                  cy={c.y + 10}
                  r={inView ? 1.2 : 0}
                  fill={c.color}
                  opacity={0.6}
                  style={{ transition: `r 0.4s ease ${i * 0.4 + 0.8}s` }}
                />
              </g>
            ))}
          </svg>

          {/* Center icon */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className={`relative flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl shadow-violet-500/30 transition-all duration-700 ${inView ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
              <Truck className="h-9 w-9 text-white" />
            </div>
          </div>

          {/* Delivery company logos */}
          {companies.map((c, i) => {
            const posClass =
              i === 0
                ? "left-0 top-[5%]"
                : i === 1
                  ? "left-1/2 -translate-x-1/2 top-0"
                  : "right-0 top-[5%]";
            return (
              <div
                key={c.name}
                className={`absolute ${posClass} z-10 transition-all duration-700 ${inView ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"}`}
                style={{ transitionDelay: `${i * 0.3 + 0.5}s` }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl shadow-xl flex items-center justify-center p-2">
                    <img
                      src={c.logo}
                      alt={c.name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{c.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
