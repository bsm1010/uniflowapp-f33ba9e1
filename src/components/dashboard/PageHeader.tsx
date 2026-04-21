import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  icon: Icon,
  gradient = "from-violet-600 via-fuchsia-600 to-pink-600",
  variant = "bold",
  rightSlot,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
  variant?: "bold" | "soft" | "plain";
  /** Optional inset panel rendered on the right of the hero (e.g. a stats badge). */
  rightSlot?: ReactNode;
}) {
  if (variant === "plain") {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          {eyebrow && (
            <p className="text-xs uppercase tracking-wider text-primary font-semibold">
              {eyebrow}
            </p>
          )}
          <h1 className="mt-1 text-2xl md:text-3xl font-bold font-display">{title}</h1>
          {description && (
            <p className="mt-1 text-muted-foreground text-sm md:text-base">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    );
  }

  if (variant === "soft") {
    // Toned-down version: card surface with gradient orbs, dark text
    return (
      <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 sm:p-8 mb-8 shadow-soft">
        <div
          aria-hidden
          className={cn(
            "absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl opacity-30 bg-gradient-to-br",
            gradient,
          )}
        />
        <div
          aria-hidden
          className={cn(
            "absolute -bottom-20 -left-10 h-56 w-56 rounded-full blur-3xl opacity-20 bg-gradient-to-tr",
            gradient,
          )}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            {Icon && (
              <div
                className={cn(
                  "shrink-0 grid place-items-center h-12 w-12 rounded-2xl text-white shadow-glow bg-gradient-to-br",
                  gradient,
                )}
              >
                <Icon className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary font-semibold">
                  {eyebrow}
                </p>
              )}
              <h1 className="mt-1 text-2xl md:text-3xl font-bold font-display tracking-tight">
                {title}
              </h1>
              {description && (
                <p className="mt-1.5 text-muted-foreground text-sm md:text-base max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>}
        </div>
      </div>
    );
  }

  // "bold" — credits-style hero: full gradient background, white text, dotted pattern
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60 mb-8 p-6 sm:p-10 text-white bg-gradient-to-br shadow-[0_20px_70px_-20px_rgba(139,92,246,0.45)]",
        gradient,
      )}
    >
      {/* Dotted pattern overlay */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
          backgroundSize: "40px 40px, 60px 60px",
        }}
      />
      <div
        aria-hidden
        className="absolute -top-20 -right-20 size-72 rounded-full bg-white/15 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -left-10 size-72 rounded-full bg-amber-300/20 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-start gap-4 min-w-0">
          {Icon && (
            <div className="shrink-0 size-14 grid place-items-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-lg">
              <Icon className="h-7 w-7" />
            </div>
          )}
          <div className="min-w-0 space-y-2">
            {eyebrow && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur border border-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                {eyebrow}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold font-display tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-white/85 text-base md:text-lg max-w-2xl">{description}</p>
            )}
          </div>
        </div>
        {(rightSlot || actions) && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {rightSlot}
            {actions}
          </div>
        )}
      </div>
    </div>
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
    <div className="relative overflow-hidden rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div
        aria-hidden
        className="absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500"
      />
      <div className="relative">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-glow">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-semibold text-lg">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
