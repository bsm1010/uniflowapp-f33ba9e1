import { useEffect, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getGamification, type GamificationData, type QuestWithProgress } from "@/lib/core-loop";
import { QuestCard } from "@/components/dashboard/core-loop/QuestCard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Flame, TrendingUp, Trophy } from "lucide-react";

export const Route = createFileRoute("/dashboard/quests")({
  component: QuestsPage,
  head: () => ({ meta: [{ title: "Quests — Fennecly" }] }),
});

function QuestsPage() {
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!data) return <p className="text-muted-foreground p-8 text-center">Could not load quests.</p>;

  const renderQuestList = (quests: QuestWithProgress[]) => {
    const unclaimed = quests.filter((q) => q.completed && !q.claimed);
    const inProgress = quests.filter((q) => !q.completed);
    const done = quests.filter((q) => q.claimed);

    return (
      <div className="space-y-3">
        {unclaimed.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2">Ready to Claim</p>
            <div className="space-y-2">
              {unclaimed.map((q) => <QuestCard key={q.id} quest={q} onClaimed={load} />)}
            </div>
          </div>
        )}
        {inProgress.length > 0 && (
          <div>
            {unclaimed.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">In Progress</p>}
            <div className="space-y-2">
              {inProgress.map((q) => <QuestCard key={q.id} quest={q} onClaimed={load} />)}
            </div>
          </div>
        )}
        {done.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">Completed</p>
            <div className="space-y-2">
              {done.map((q) => <QuestCard key={q.id} quest={q} onClaimed={load} />)}
            </div>
          </div>
        )}
        {quests.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No quests available.</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quests"
        title="Complete Quests & Earn Rewards"
        description="Finish quests to earn XP, unlock achievements, and level up."
        gradient="from-violet-500 to-purple-500"
      />
      <Tabs defaultValue="daily" className="w-full">
        <TabsList>
          <TabsTrigger value="daily" className="gap-1.5">
            <Flame className="h-4 w-4" /> Daily
          </TabsTrigger>
          <TabsTrigger value="weekly" className="gap-1.5">
            <TrendingUp className="h-4 w-4" /> Weekly
          </TabsTrigger>
          <TabsTrigger value="achievement" className="gap-1.5">
            <Trophy className="h-4 w-4" /> Achievements
          </TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
          {renderQuestList(data.dailyQuests)}
        </TabsContent>
        <TabsContent value="weekly" className="mt-4">
          {renderQuestList(data.weeklyQuests)}
        </TabsContent>
        <TabsContent value="achievement" className="mt-4">
          {renderQuestList(data.achievementQuests)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
