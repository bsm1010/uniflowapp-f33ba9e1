import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakFlameProps {
  streak: number;
  longestStreak: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakFlame({ streak, longestStreak, size = "md", className }: StreakFlameProps) {
  const isActive = streak > 0;
  const flameColor = streak >= 30 ? "text-orange-500" : streak >= 7 ? "text-orange-400" : streak >= 3 ? "text-amber-400" : "text-amber-300";

  const iconSize = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <motion.div
        key={streak}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className={cn("flex items-center", flameColor)}
      >
        <Flame className={cn(iconSize, "drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]")} />
      </motion.div>
      <div>
        <span className={cn("font-bold", textSize, flameColor)}>
          {streak}
        </span>
        <span className={cn("text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs", "ml-1")}>
          day{streak !== 1 ? "s" : ""}
        </span>
        {size === "lg" && (
          <p className="text-[11px] text-muted-foreground">Best: {longestStreak} days</p>
        )}
      </div>
    </div>
  );
}
