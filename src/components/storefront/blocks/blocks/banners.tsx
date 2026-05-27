import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlockComponentProps } from "../types";

/* ---------- Marquee ---------- */
export interface MarqueeProps {
  items: string[];
  speed: number;
}
export function Marquee({ props }: BlockComponentProps<MarqueeProps>) {
  const items = [...props.items, ...props.items];
  return (
    <div className="overflow-hidden border-y border-border bg-primary py-3 text-primary-foreground">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{ animation: `marquee ${props.speed ?? 30}s linear infinite` }}
      >
        {items.map((t, i) => (
          <span key={i} className="text-sm font-semibold tracking-wide">
            ✦ {t}
          </span>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ---------- AnnouncementBar ---------- */
export interface AnnouncementBarProps {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
  dismissible: boolean;
}
export function AnnouncementBar({ props }: BlockComponentProps<AnnouncementBarProps>) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="flex items-center justify-center gap-3 bg-foreground px-4 py-2 text-sm text-background">
      <span>{props.message}</span>
      {props.ctaLabel && props.ctaHref ? (
        <a href={props.ctaHref} className="font-semibold underline underline-offset-4">
          {props.ctaLabel}
        </a>
      ) : null}
      {props.dismissible ? (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Dismiss"
          className="ml-2 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

/* ---------- PromoBanner ---------- */
export interface PromoBannerProps {
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
}
export function PromoBanner({ props }: BlockComponentProps<PromoBannerProps>) {
  return (
    <section className="mx-auto my-10 max-w-7xl px-4">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-accent p-10 text-primary-foreground md:p-16">
        {props.imageUrl ? (
          <img
            src={props.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-overlay"
          />
        ) : null}
        <div className="relative max-w-xl">
          <h2 className="font-display text-3xl font-bold md:text-5xl">{props.title}</h2>
          {props.subtitle ? <p className="mt-3 text-lg opacity-90">{props.subtitle}</p> : null}
          <Button asChild size="lg" variant="secondary" className="mt-6">
            <a href={props.ctaHref}>{props.ctaLabel}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- CountdownBanner ---------- */
export interface CountdownBannerProps {
  title: string;
  endsAt: string;
  ctaLabel: string;
  ctaHref: string;
}
export function CountdownBanner({ props }: BlockComponentProps<CountdownBannerProps>) {
  const target = new Date(props.endsAt).getTime();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins = Math.floor((diff / 60000) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const cells: Array<[number, string]> = [
    [days, "Days"],
    [hours, "Hrs"],
    [mins, "Min"],
    [secs, "Sec"],
  ];
  return (
    <section className="mx-auto my-10 max-w-5xl px-4">
      <div className="rounded-3xl border border-border bg-card p-8 text-center">
        <h2 className="font-display text-2xl font-bold md:text-3xl">{props.title}</h2>
        <div className="mt-6 flex justify-center gap-3">
          {cells.map(([v, label]) => (
            <div key={label} className="min-w-[70px] rounded-xl bg-primary px-4 py-3 text-primary-foreground">
              <p className="font-display text-3xl font-bold tabular-nums">{String(v).padStart(2, "0")}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
            </div>
          ))}
        </div>
        <Button asChild size="lg" className="mt-6">
          <a href={props.ctaHref}>{props.ctaLabel}</a>
        </Button>
      </div>
    </section>
  );
}
