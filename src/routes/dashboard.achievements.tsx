import { useEffect, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getGamification, type GamificationData } from "@/lib/core-loop";
import { AchievementCard } from "@/components/dashboard/core-loop/AchievementCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Trophy, Lock, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/dashboard/achievements")({
  component: AchievementsPage,
  head: () => ({ meta: [{ title: "Achievements — Fennecly" }] }),
});

function AchievementsPage() {
  const callGet = useServerFn(getGamification);
  const [data, setData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    try {
      const result = await callGet({ data: { accessToken: session.access_token } });
      setData(result);
    } catch { /* ignore */ }
    setLoading(false);
  }, [callGet]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground p-8 text-center">Could not load achievements.</p>;

  const earned = data.achievements.filter((a) => a.earned);
  const locked = data.achievements.filter((a) => !a.earned);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Achievements"
        title="Your Achievement Collection"
        description={`${earned.length} of ${data.achievements.length} unlocked`}
        icon={Trophy}
        gradient="from-amber-500 to-orange-500"
      />

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            <Trophy className="h-4 w-4" /> All ({data.achievements.length})
          </TabsTrigger>
          <TabsTrigger value="unlocked" className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> Unlocked ({earned.length})
          </TabsTrigger>
          <TabsTrigger value="locked" className="gap-1.5">
            <Lock className="h-4 w-4" /> Locked ({locked.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} onShared={load} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="unlocked" className="mt-4">
          {earned.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No achievements unlocked yet. Keep building!</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {earned.map((a) => (
                <AchievementCard key={a.id} achievement={a} onShared={load} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="locked" className="mt-4">
          {locked.length === 0 ? (
            <p className="text-sm text-emerald-500 text-center py-8">All achievements unlocked! Amazing!</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {locked.map((a) => (
                <AchievementCard key={a.id} achievement={a} onShared={load} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
