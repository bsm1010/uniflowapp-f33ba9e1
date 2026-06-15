import {
  Package,
  CheckCircle2,
  Layers,
  ShoppingBag,
  TrendingUp,
  Award,
  DollarSign,
  Zap,
  Lock,
  Circle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Milestone } from "@/lib/progress/get-progress";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  CheckCircle2,
  Layers,
  ShoppingBag,
  TrendingUp,
  Award,
  DollarSign,
  Zap,
};

interface Props {
  milestones: Milestone[];
  compact?: boolean;
}

export function MilestonesList({ milestones, compact }: Props) {
  if (compact) {
    const unlocked = milestones.filter((m) => m.unlocked).length;
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Milestones</span>
          <span className="font-medium">
            {unlocked}/{milestones.length}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
            style={{ width: `${(unlocked / milestones.length) * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {milestones.slice(0, 8).map((m) => {
            const Icon = ICON_MAP[m.icon] || Circle;
            return (
              <div
                key={m.key}
                className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                  m.unlocked
                    ? "bg-purple-500/15 text-purple-500"
                    : "bg-muted text-muted-foreground/40",
                )}
                title={`${m.label}${m.unlocked ? "" : " — locked"}`}
              >
                {m.unlocked ? <Icon className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {milestones.map((m, i) => {
        const Icon = ICON_MAP[m.icon] || Circle;
        const isProgress = !m.unlocked && m.progress !== undefined && m.progress > 0;
        return (
          <div
            key={m.key}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl transition-all",
              m.unlocked
                ? "bg-emerald-500/5 border border-emerald-500/15"
                : "bg-muted/30 border border-border/50",
            )}
          >
            <div
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
                m.unlocked
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground/50",
              )}
            >
              {m.unlocked ? <Icon className="h-4.5 w-4.5" /> : <Lock className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={cn(
                    "text-sm font-medium",
                    m.unlocked ? "text-emerald-700" : "text-foreground",
                  )}
                >
                  {m.label}
                </p>
                {m.unlocked && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>
              {isProgress && m.target && (
                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{ width: `${m.progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
