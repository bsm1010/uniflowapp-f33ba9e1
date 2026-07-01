import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
  gradient = "from-violet-500 via-fuchsia-500 to-pink-500",
  variant = "graphical",
  rightSlot,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
  variant?: "graphical" | "plain";
  rightSlot?: ReactNode;
}) {
  if (variant === "plain") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          {eyebrow && (
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">{eyebrow}</p>
          )}
          <h1 className="mt-1 text-2xl md:text-3xl font-bold font-display tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-muted-foreground text-sm md:text-base">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    );
  }

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 text-white shadow-lg mb-8",
        "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700",
        "animate-in fade-in slide-in-from-bottom-4 duration-700 group",
      )}
    >
      {/* Dot pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-2xl opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Soft glow orb */}
      <div
        aria-hidden
        className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/15 blur-3xl pointer-events-none"
      />

      {/* Shimmer sweep on hover */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -translate-x-full pointer-events-none",
          "bg-gradient-to-r from-transparent via-white/15 to-transparent",
          "group-hover:translate-x-full transition-transform duration-[1200ms] ease-in-out",
        )}
      />

      <div className="relative grid items-center gap-4 px-6 py-5 sm:grid-cols-[1fr_auto] sm:px-8">
        <div className="flex items-start gap-5 min-w-0">
          {Icon && (
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-white/30 blur-md scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div className="relative grid place-items-center h-14 w-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 text-white shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-7 w-7 drop-shadow-sm" />
              </div>
            </div>
          )}
          <div className="min-w-0 space-y-2">
            {eyebrow && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur border border-white/10">
                {eyebrow}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight leading-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs leading-relaxed text-white/85 sm:text-sm max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
        {rightSlot && <div className="hidden sm:block shrink-0">{rightSlot}</div>}
      </div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center",
        "animate-in fade-in slide-in-from-bottom-4 duration-700",
      )}
    >
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 blur-3xl"
      />
      <div className="relative">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-[0_4px_24px_rgba(139,92,246,0.35)] transition-transform duration-300 hover:scale-105">
          <Icon className="h-7 w-7 drop-shadow-sm" />
        </div>
        <h3 className="mt-5 font-bold text-lg tracking-tight">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">{description}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
