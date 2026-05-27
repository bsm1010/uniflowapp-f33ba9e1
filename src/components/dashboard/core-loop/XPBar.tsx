import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface XPBarProps {
  xp: number;
  level: number;
  xpForCurrent: number;
  xpForNext: number;
  animate?: boolean;
  size?: "sm" | "md" | "lg";
  showLevel?: boolean;
  className?: string;
}

export function XPBar({ xp, level, xpForCurrent, xpForNext, animate = true, size = "md", showLevel = true, className }: XPBarProps) {
  const progress = xpForNext > xpForCurrent
    ? Math.min(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100, 100)
    : xp > 0 ? 100 : 0;

  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";
  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className={cn("space-y-1", className)}>
      {showLevel && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className={cn("text-amber-400", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
            <span className={cn("font-bold text-amber-400", textSize)}>Level {level}</span>
          </div>
          <span className={cn("text-muted-foreground", textSize)}>
            {xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
          </span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted overflow-hidden", height)}>
        <motion.div
          initial={animate ? { width: 0 } : undefined}
          animate={{ width: `${Math.max(progress, 2)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400",
            height,
          )}
        />
      </div>
      {!showLevel && (
        <div className={cn("text-muted-foreground", textSize)}>
          {xp.toLocaleString()} / {xpForNext.toLocaleString()} XP
        </div>
      )}
    </div>
  );
}
