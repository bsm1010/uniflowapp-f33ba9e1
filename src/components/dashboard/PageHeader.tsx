import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
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
          <p className="mt-1 text-muted-foreground text-sm md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
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
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-accent-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-semibold text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        {description}
      </p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
