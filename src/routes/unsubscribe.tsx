import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/unsubscribe")({
  head: () => ({
    meta: [{ title: "إلغاء الاشتراك — فينيكلي" }],
  }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get("email");
    if (!email) {
      setStatus("error");
      return;
    }
    supabase.functions
      .invoke("send-email", {
        body: { type: "unsubscribe", data: { email } },
      })
      .then(() => setStatus("done"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {status === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
            <p className="text-lg text-muted-foreground">جارٍ إلغاء الاشتراك...</p>
          </>
        )}
        {status === "done" && (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold">تم إلغاء اشتراكك</h1>
            <p className="text-muted-foreground">
              لن تتلقى رسائل فينيكلي التسويقية بعد الآن. يمكنك العودة إلى{" "}
              <a href="/" className="text-primary underline">
                الصفحة الرئيسية
              </a>{" "}
              في أي وقت.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-2xl font-bold">حدث خطأ</h1>
            <p className="text-muted-foreground">
              رابط إلغاء الاشتراك غير صالح أو تعذّر الإلغاء. يرجى المحاولة لاحقاً.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
