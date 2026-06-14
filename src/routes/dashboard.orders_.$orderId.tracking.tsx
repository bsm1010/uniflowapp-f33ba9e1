import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  ClipboardCheck,
  PackageCheck,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  trackOrderShipment,
  type TrackingDTO,
} from "@/lib/delivery/track-shipment.functions";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

export const Route = createFileRoute("/dashboard/orders_/$orderId/tracking")({
  component: TrackingPage,
  head: () => ({ meta: [{ title: "Order tracking — Fennecly" }] }),
});

const STATUS_FLOW = ["created", "picked_up", "in_transit", "out_for_delivery", "delivered"] as const;
type StatusFlow = (typeof STATUS_FLOW)[number];

function mapToFlowStatus(raw: string): StatusFlow {
  const s = (raw || "").toLowerCase();
  if (s.includes("livr")) return "delivered";
  if (s.includes("out") || s.includes("livraison") || s.includes("distribution")) return "out_for_delivery";
  if (s.includes("transit") || s.includes("route") || s.includes("expedi") || s.includes("shipped") || s.includes("envoy")) return "in_transit";
  if (s.includes("pick") || s.includes("ramass") || s.includes("collect") || s.includes("pris")) return "picked_up";
  return "created";
}

const FLOW_LABELS: Record<StatusFlow, string> = {
  created: "Order Created",
  picked_up: "Picked Up",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

function TrackingPage() {
  const { orderId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const trackFn = useServerFn(trackOrderShipment);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState<TrackingDTO | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const loadOrder = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      setOrder(data ?? null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const refreshTracking = async () => {
    const { data: session } = await supabase.auth.getSession();
    const accessToken = session.session?.access_token;
    if (!accessToken) {
      toast.error("Please sign in again.");
      return;
    }
    setRefreshing(true);
    setErrorMsg(null);
    try {
      const res = await trackFn({ data: { accessToken, orderId } });
      if (res.ok) {
        setTracking(res.tracking);
        setLastRefreshed(new Date());
      } else {
        setErrorMsg(res.message);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to fetch status.");
    } finally {
      setRefreshing(false);
    }
  };

  // Auto-refresh every 30s while the page is open.
  useEffect(() => {
    if (!autoRefresh || !order?.tracking_number) return;
    const id = setInterval(() => {
      void refreshTracking();
    }, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, order?.tracking_number]);

  useEffect(() => {
    if (!user) return;
    void loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, orderId]);

  useEffect(() => {
    if (order?.tracking_number) void refreshTracking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.tracking_number]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/dashboard/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const flowStatus = tracking ? mapToFlowStatus(tracking.rawStatus ?? tracking.status) : null;
  const flowIdx = flowStatus ? STATUS_FLOW.indexOf(flowStatus) : -1;
  const displayStatus = tracking?.rawStatus ?? tracking?.status ?? order.status;

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/dashboard/orders" })}
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Shipment"
          title="Order tracking"
          description={`Order #${order.id.slice(0, 8).toUpperCase()}`}
          icon={Truck}
          gradient="from-emerald-500 via-teal-500 to-cyan-500"
        />
        <div className="pt-6 flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="accent-primary h-3.5 w-3.5"
              />
              Auto-refresh 30s
            </label>
            <Button onClick={() => void refreshTracking()} disabled={refreshing || !order.tracking_number}>
              {refreshing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-1.5" />
              )}
              Refresh Status
            </Button>
          </div>
          {lastRefreshed && (
            <span className="text-[11px] text-muted-foreground">
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {!order.tracking_number && (
        <Card className="border-amber-500/30 bg-amber-500/5 mb-6">
          <CardContent className="p-4 text-sm text-amber-700 dark:text-amber-400">
            This order has not been sent to ZRExpress yet. Send it from the orders page to start tracking.
          </CardContent>
        </Card>
      )}

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Provider status banner */}
      {tracking && (
        <Card className="mb-6 border-border/60 shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Current Status</span>
              </div>
              <Badge variant="outline" className="text-sm font-medium capitalize px-3 py-1">
                {displayStatus}
              </Badge>
              {tracking.trackingNumber && (
                <span className="text-xs text-muted-foreground font-mono">
                  #{tracking.trackingNumber}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress stepper */}
      {flowIdx >= 0 && (
        <Card className="border-border/60 shadow-soft mb-6">
          <CardHeader>
            <CardTitle className="text-base">Delivery progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="flex justify-between gap-2 relative">
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
                <div
                  className="absolute top-5 left-5 h-0.5 bg-primary transition-all"
                  style={{
                    width:
                      flowIdx <= 0
                        ? "0%"
                        : `calc(${(flowIdx / (STATUS_FLOW.length - 1)) * 100}% - ${flowIdx === STATUS_FLOW.length - 1 ? "2.5rem" : "0rem"})`,
                  }}
                />
                {STATUS_FLOW.map((step, idx) => {
                  const completed = idx <= flowIdx;
                  const Icon = idx === 0 ? ClipboardCheck : idx === 1 ? Package : idx === 2 ? Truck : idx === 3 ? PackageCheck : CheckCircle2;
                  return (
                    <div
                      key={step}
                      className="flex flex-col items-center gap-2 relative z-10 flex-1 min-w-0"
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                          completed
                            ? "bg-primary border-primary text-primary-foreground"
                            : "bg-card border-border text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <span
                        className={`text-[11px] text-center font-medium ${
                          completed ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {FLOW_LABELS[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order info */}
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Order details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <InfoRow icon={ClipboardCheck} label="Tracking">
              <span className="font-mono">{order.tracking_number || "—"}</span>
            </InfoRow>
            <InfoRow icon={User} label="Customer">
              {order.customer_name}
            </InfoRow>
            <InfoRow icon={Phone} label="Phone">
              <a href={`tel:${order.customer_phone || order.shipping_address}`} className="hover:text-primary">
                {order.customer_phone || order.shipping_address}
              </a>
            </InfoRow>
            <InfoRow icon={MapPin} label="Wilaya">
              {order.shipping_postal_code || "—"}
              <span className="text-muted-foreground"> · {order.shipping_city}</span>
            </InfoRow>
            <InfoRow icon={MapPin} label="Address">
              {order.shipping_address}
            </InfoRow>
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{Number(order.total).toFixed(2)} DA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current status</span>
              <Badge variant="outline" className="capitalize">
                {displayStatus}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* History — ZRExpress exact statements */}
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Tracking history</CardTitle>
          </CardHeader>
          <CardContent>
            {refreshing && !tracking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : tracking?.history && tracking.history.length > 0 ? (
              <ol className="space-y-0">
                {tracking.history.map((h, i) => {
                  const isFirst = i === 0;
                  const locParts = [h.location, h.city, h.wilaya].filter(Boolean);
                  const locationStr = locParts.join(", ");
                  return (
                    <li key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-3 w-3 rounded-full mt-1 ${
                            isFirst
                              ? "bg-primary ring-2 ring-primary/20"
                              : "bg-muted-foreground/40"
                          }`}
                        />
                        {i < tracking.history.length - 1 && (
                          <div className="w-px flex-1 bg-border mt-1" />
                        )}
                      </div>
                      <div className={`flex-1 pb-4 ${isFirst ? "" : "opacity-80"}`}>
                        <div className={`text-sm font-medium ${isFirst ? "" : "text-muted-foreground"}`}>
                          {h.status || "—"}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                          {h.date && (
                            <span>{new Date(h.date).toLocaleString()}</span>
                          )}
                          {locationStr && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {locationStr}
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                No tracking history available yet.
                {tracking?.lastUpdate && (
                  <> Last update: {new Date(tracking.lastUpdate).toLocaleString()}.</>
                )}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm break-words">{children}</div>
      </div>
    </div>
  );
}
