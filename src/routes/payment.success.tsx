import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/payment/success")({
  head: () => ({ meta: [{ title: "Payment Successful — Fennecly" }] }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const [countdown, setCountdown] = useState(5);
  const search = Route.useSearch();
  const orderId = (search as Record<string, string>)?.order_id;

  useEffect(() => {
    if (countdown <= 0) {
      window.location.href = "/dashboard/orders";
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto px-6 text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">تم الدفع بنجاح!</h1>
          <p className="text-muted-foreground">
            تلقّينا دفعتك بنجاح. سيتم تجهيز طلبك قريباً.
          </p>
        </div>

        {orderId && (
          <div className="inline-block px-4 py-2 text-sm font-mono bg-muted rounded-lg">
            Order #{orderId.slice(0, 8).toUpperCase()}
          </div>
        )}

        <div className="flex flex-col gap-3 pt-2">
          <Link
            to="/dashboard/orders"
            className="inline-flex h-11 items-center justify-center gap-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <ShoppingBag className="h-4 w-4" />
            عرض طلباتي
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          {countdown > 0 ? (
            <>جاري التوجيه تلقائياً خلال {countdown} ثوانٍ...</>
          ) : (
            <Loader2 className="h-3 w-3 animate-spin inline" />
          )}
        </p>
      </div>
    </div>
  );
}
