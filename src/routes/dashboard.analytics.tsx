import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/analytics")({
  component: AnalyticsPage,
  head: () => ({ meta: [{ title: "Analytics — Storely" }] }),
});

function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Insights"
        title="Analytics"
        description="Understand how your store is performing."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Sessions (7d)", value: "0" },
          { label: "Conversion rate", value: "0.0%" },
          { label: "Avg. order value", value: "$0.00" },
        ].map((k) => (
          <Card key={k.label} className="border-border/60 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{k.label}</span>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
