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
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  gradient?: string;
  variant?: "graphical" | "plain";
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

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/40 bg-card/40 p-6 sm:p-8 mb-8",
        "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "transition-all duration-500 group",
        "animate-in fade-in slide-in-from-bottom-4 duration-700",
      )}
    >
      {/* Animated gradient orb top-right */}
      <div
        aria-hidden
        className={cn(
          "absolute -top-20 -right-16 h-72 w-72 rounded-full opacity-25 dark:opacity-20",
          "bg-gradient-to-br blur-3xl",
          "animate-[pulse_6s_ease-in-out_infinite]",
          gradient,
        )}
      />
      {/* Animated gradient orb bottom-left */}
      <div
        aria-hidden
        className={cn(
          "absolute -bottom-24 -left-12 h-64 w-64 rounded-full opacity-15 dark:opacity-10",
          "bg-gradient-to-tr blur-3xl",
          "animate-[pulse_8s_ease-in-out_2s_infinite]",
          gradient,
        )}
      />

      {/* Dot grid */}
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-dots opacity-[0.12] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
      />

      {/* Shimmer sweep on hover */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 -translate-x-full",
          "bg-gradient-to-r from-transparent via-white/10 to-transparent",
          "group-hover:translate-x-full transition-transform duration-[1200ms] ease-in-out",
          "pointer-events-none",
        )}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-5 min-w-0">
          {Icon && (
            <div className="relative shrink-0">
              {/* Pulse ring */}
              <div
                aria-hidden
                className={cn(
                  "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100",
                  "bg-gradient-to-br scale-110 blur-md transition-opacity duration-500",
                  gradient,
                )}
              />
              <div
                className={cn(
                  "relative grid place-items-center h-14 w-14 rounded-2xl text-white",
                  "shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
                  "bg-gradient-to-br transition-transform duration-300 group-hover:scale-105",
                  gradient,
                )}
              >
                <Icon className="h-7 w-7 drop-shadow-sm" />
              </div>
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p
                className={cn(
                  "text-[11px] uppercase tracking-[0.18em] font-semibold mb-1",
                  "bg-gradient-to-r bg-clip-text text-transparent",
                  gradient,
                )}
              >
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-1.5 text-muted-foreground text-sm md:text-base max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2 shrink-0">{actions}</div>
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
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center",
        "animate-in fade-in slide-in-from-bottom-4 duration-700",
      )}
    >
      <div
        aria-hidden
        className="absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 animate-[pulse_6s_ease-in-out_infinite]"
      />
      <div className="relative">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mt-4 font-semibold text-lg">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
    </div>
  );
}
