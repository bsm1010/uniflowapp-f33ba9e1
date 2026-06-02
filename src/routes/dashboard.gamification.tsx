import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getGamification, type GamificationData } from "@/lib/core-loop";
import { GamificationHub } from "@/components/dashboard/core-loop/GamificationHub";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/dashboard/gamification")({
  component: GamificationPage,
  head: () => ({ meta: [{ title: "Your Progress — Fennecly" }] }),
});

function GamificationPage() {
  const { t } = useTranslation();
  const callGet = useServerFn(getGamification);
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const result = await callGet({ data: { accessToken: session.access_token } });
        setData(result);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [callGet]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground p-8 text-center">{t("common.error")}</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("dashboard.gamification.coreLoop")}
        title={t("dashboard.gamification.yourProgress")}
        description={t("dashboard.gamification.coreLoopDesc")}
        icon={Zap}
        gradient="from-violet-500 via-fuchsia-500 to-amber-400"
      />
      <GamificationHub data={data} />
    </div>
  );
}
