import { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCurrentStore } from "@/hooks/use-current-store";
import { getCookieConsentStats } from "@/lib/gdpr/cookie-consent.functions";

export function ConsentStatsCard() {
  const { currentStore } = useCurrentStore();
  const [stats, setStats] = useState({ total: 0, allAccepted: 0, allRejected: 0, customized: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    getCookieConsentStats({ data: { storeId: currentStore.id } }).then((s) => {
      setStats(s);
      setLoading(false);
    });
  }, [currentStore]);

  const hasData = stats.total > 0;
  const acceptedPct = hasData ? Math.round((stats.allAccepted / stats.total) * 100) : 0;
  const rejectedPct = hasData ? Math.round((stats.allRejected / stats.total) * 100) : 0;
  const customizedPct = hasData ? 100 - acceptedPct - rejectedPct : 0;

  return (
    <Card className="border-border/60 shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid place-items-center h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">Consent Analytics</CardTitle>
            <CardDescription>Overview of cookie consent from your visitors</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <span className="text-3xl font-bold">{stats.total}</span>
              <p className="text-sm text-muted-foreground">Total Consents</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  Accepted All
                </span>
                <span className="font-medium">
                  {stats.allAccepted} ({acceptedPct}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500" />
                  Rejected All
                </span>
                <span className="font-medium">
                  {stats.allRejected} ({rejectedPct}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  Customized
                </span>
                <span className="font-medium">
                  {stats.customized} ({customizedPct}%)
                </span>
              </div>
            </div>

            {hasData && (
              <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                <div className="bg-green-500 transition-all" style={{ width: `${acceptedPct}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${rejectedPct}%` }} />
                <div
                  className="bg-amber-500 transition-all"
                  style={{ width: `${customizedPct}%` }}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
