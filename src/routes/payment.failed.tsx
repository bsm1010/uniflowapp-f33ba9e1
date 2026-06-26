import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, ArrowRight, Headphones } from "lucide-react";

export const Route = createFileRoute("/payment/failed")({
  head: () => ({ meta: [{ title: "Payment Failed — Fennecly" }] }),
  component: PaymentFailedPage,
});

function PaymentFailedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-auto px-6 text-center space-y-6">
        <div className="mx-auto h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">فشل الدفع</h1>
          <p className="text-muted-foreground">
            لم نتمكن من معالجة الدفعة. يمكنك المحاولة مرة أخرى أو التواصل مع الدعم.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => window.history.back()}
            className="inline-flex h-11 items-center justify-center gap-2 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            <ArrowRight className="h-4 w-4" />
            حاول مجدداً
          </button>
          <Link
            to="/dashboard/orders"
            className="inline-flex h-11 items-center justify-center gap-2 border border-border font-medium rounded-lg hover:bg-accent transition-colors"
          >
            <Headphones className="h-4 w-4" />
            تواصل مع الدعم
          </Link>
        </div>
      </div>
    </div>
  );
}
