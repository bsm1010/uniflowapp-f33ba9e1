import { Link } from "@tanstack/react-router";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExpiredOverlay() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <div className="max-w-md w-full rounded-2xl border border-border/60 bg-card shadow-2xl p-8 text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-brand text-brand-foreground">
          <Lock className="size-6" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">
          Your trial has expired
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Please upgrade your plan to continue managing your store. Your products,
          orders, and customizations are safe — nothing has been deleted.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/dashboard/upgrade">
              <Sparkles className="size-4" />
              Upgrade now
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard">Back to overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
