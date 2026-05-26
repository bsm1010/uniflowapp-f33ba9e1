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
        className="absolute -top-20 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full blur-3xl opacity-20 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 animate-[pulse_6s_ease-in-out_infinite]"
      />
      <div className="relative">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 text-white shadow-[0_4px_20px_rgba(139,92,246,0.4)]">
          <Icon className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
        {action && (
          <div className="mt-6 flex justify-center">
            <Button variant={action.variant ?? "default"} onClick={action.onClick}>
              {action.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
