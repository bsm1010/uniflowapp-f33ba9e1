import { Link } from "@tanstack/react-router";
import { Sparkles, Zap } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/use-credits";

export function PaywallDialog() {
  const { showPaywall, setShowPaywall, credits } = useCredits();

  return (
    <Dialog open={showPaywall} onOpenChange={setShowPaywall}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <div className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-gradient-brand text-brand-foreground">
            <Zap className="size-6" />
          </div>
          <DialogTitle className="text-center text-2xl">
            لقد انتهى رصيدك
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            قم بالشحن للمتابعة واستخدام جميع ميزات الذكاء الاصطناعي.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted/50 p-4 text-center">
          <div className="text-xs text-muted-foreground mb-1">رصيدك الحالي</div>
          <div className="text-3xl font-bold">{credits} رصيد</div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button asChild size="lg" className="w-full gap-2">
            <Link to="/dashboard/credits" onClick={() => setShowPaywall(false)}>
              <Sparkles className="size-4" />
              شحن الرصيد الآن
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => setShowPaywall(false)} className="w-full">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
