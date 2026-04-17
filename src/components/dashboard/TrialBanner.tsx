import { Link } from "@tanstack/react-router";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TrialBannerProps {
  status: string;
  daysRemaining: number;
}

export function TrialBanner({ status, daysRemaining }: TrialBannerProps) {
  if (status === "active") return null;

  const isExpired = status === "expired" || daysRemaining <= 0;

  if (isExpired) {
    return (
      <div className="border-b border-destructive/30 bg-destructive/10 text-destructive-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-8">
          <div className="flex items-center gap-2 text-sm">
            <AlertTriangle className="size-4 text-destructive" />
            <span className="text-foreground">
              <strong className="text-destructive">Your trial has expired.</strong>{" "}
              Upgrade to keep using your store.
            </span>
          </div>
          <Button size="sm" asChild>
            <Link to="/dashboard/settings">Upgrade now</Link>
          </Button>
        </div>
      </div>
    );
  }

  const dayLabel = daysRemaining === 1 ? "day" : "days";
  const isUrgent = daysRemaining <= 2;

  return (
    <div
      className={
        isUrgent
          ? "border-b border-amber-500/30 bg-amber-500/10"
          : "border-b border-primary/20 bg-primary/5"
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-8">
        <div className="flex items-center gap-2 text-sm text-foreground">
          <Sparkles
            className={isUrgent ? "size-4 text-amber-600" : "size-4 text-primary"}
          />
          <span>
            <strong>Free trial:</strong> {daysRemaining} {dayLabel} remaining
          </span>
        </div>
        <Button size="sm" variant={isUrgent ? "default" : "outline"} asChild>
          <Link to="/dashboard/settings">Upgrade</Link>
        </Button>
      </div>
    </div>
  );
}
