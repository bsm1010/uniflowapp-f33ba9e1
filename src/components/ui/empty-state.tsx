import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EmptyAction = {
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyAction;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center",
        "animate-in fade-in slide-in-from-bottom-4 duration-700",
        className,
      )}
    >
      <div
        aria-hidden
        className="absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-12 right-1/4 h-32 w-32 rounded-full bg-gradient-to-br from-sky-500/10 to-blue-500/10 blur-3xl"
      />
      <div className="relative">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-[0_4px_24px_rgba(139,92,246,0.35)] transition-transform duration-300 hover:scale-105">
          <Icon className="h-8 w-8 drop-shadow-sm" />
        </div>
        <h3 className="mt-5 text-lg font-bold tracking-tight">{title}</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        {action && (
          <div className="mt-6 flex justify-center">
            <Button variant={action.variant ?? "default"} onClick={action.onClick} className="gap-1.5">
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
