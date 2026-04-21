import { Link } from "@tanstack/react-router";
import { Coins, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCredits, PLAN_LABELS } from "@/hooks/use-credits";

export function CreditsBadge() {
  const { credits, plan, loading } = useCredits();
  const isUnlimited = plan === "business";

  if (loading) return null;

  const low = credits < 5 && !isUnlimited;

  return (
    <Link
      to="/dashboard/credits"
      className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
        low
          ? "border-destructive/50 bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "border-border/60 bg-muted/40 hover:bg-muted/70"
      }`}
      title={`Plan: ${PLAN_LABELS[plan]}`}
    >
      {isUnlimited ? (
        <>
          <InfinityIcon className="size-4" />
          <span>غير محدود</span>
        </>
      ) : (
        <>
          <Coins className="size-4" />
          <span>{credits}</span>
          <span className="text-muted-foreground">رصيد</span>
        </>
      )}
    </Link>
  );
}
