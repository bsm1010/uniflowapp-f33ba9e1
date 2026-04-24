import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Rocket, ShoppingBag, Sparkles, Store } from "lucide-react";

interface Props {
  userId: string;
}

export function WelcomeDialog({ userId }: Props) {
  const [open, setOpen] = useState(false);
  const storageKey = `fennecly:welcome-seen:${userId}`;

  useEffect(() => {
    if (!userId) return;
    try {
      if (!localStorage.getItem(storageKey)) {
        // small delay so it doesn't clash with first paint
        const t = setTimeout(() => setOpen(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [userId, storageKey]);

  const handleClose = (next: boolean) => {
    if (!next) {
      try {
        localStorage.setItem(storageKey, "1");
      } catch {
        /* ignore */
      }
    }
    setOpen(next);
  };

  const handleStart = () => {
    handleClose(false);
    // Signal that the welcome flow is finished so the guided tour can start.
    try {
      window.dispatchEvent(new CustomEvent("fennecly:welcome-finished"));
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        dir="rtl"
        className="max-w-md overflow-hidden border-0 p-0 shadow-2xl sm:rounded-2xl"
      >
        {/* Illustration */}
        <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-background">
          <div className="absolute -left-6 -top-6 h-24 w-24 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute -bottom-8 -right-4 h-28 w-28 rounded-full bg-accent/30 blur-2xl" />

          <div className="relative flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-lg ring-1 ring-border">
              <Store className="h-7 w-7 text-primary" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background shadow-lg ring-1 ring-border">
              <Sparkles className="h-7 w-7 text-primary" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 pb-6 pt-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            👋 مرحبا بك في Fennecly
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            في دقائق تقدر تنشئ متجرك وتبدأ تبيع في الجزائر 🇩🇿. راح نعاونك خطوة بخطوة.
          </p>

          <Button
            onClick={handleStart}
            size="lg"
            className="mt-6 w-full gap-2 text-base font-semibold"
          >
            <Rocket className="h-5 w-5" />
            🚀 ابدأ الآن
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
