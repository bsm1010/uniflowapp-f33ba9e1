import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — Storely" }] }),
});

function AnalyticsPage() {
  const stats = [
    { label: "Sessions (7d)", value: "0", gradient: "from-violet-500 to-fuchsia-500" },
    { label: "Conversion rate", value: "0.0%", gradient: "from-emerald-500 to-teal-500" },
    { label: "Avg. order value", value: "$0.00", gradient: "from-amber-500 to-orange-500" },
  ];
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Understand how your store is performing."
        icon={BarChart3}
        gradient="from-emerald-500 via-teal-500 to-cyan-500"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((k) => (
          <Card key={k.label} className="relative overflow-hidden border-border/60 shadow-soft">
            <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl opacity-25 bg-gradient-to-br ${k.gradient}`} />
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{k.label}</span>
                <div className={`grid size-9 place-items-center rounded-xl text-white bg-gradient-to-br ${k.gradient}`}>
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 text-3xl font-bold font-display">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="mt-6 border-border/60 shadow-soft">
        <CardContent className="p-6">
          <h3 className="font-semibold">Traffic overview</h3>
          <div className="mt-6 h-64 rounded-xl border border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto opacity-60" />
              <p className="mt-2 text-sm">Charts will appear once data flows in.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
