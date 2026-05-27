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
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/40 p-6 sm:p-8 mb-8 shadow-soft">
      {/* Decorative orbs */}
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
      <div
        aria-hidden
        className="absolute inset-0 bg-grid-dots opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
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
