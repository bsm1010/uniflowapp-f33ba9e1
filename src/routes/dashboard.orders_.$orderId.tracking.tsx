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

const STEPS = [
  { key: "created", label: "Order Created", icon: ClipboardCheck },
  { key: "picked_up", label: "Picked Up", icon: Package },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: PackageCheck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
] as const;

function stepIndex(status: string): number {
  const s = (status || "").toLowerCase();
  if (s.includes("deliver") && !s.includes("out")) return 4;
  if (s.includes("out") || s.includes("livraison")) return 3;
  if (s.includes("transit") || s.includes("route") || s.includes("expedi") || s.includes("shipped")) return 2;
  if (s.includes("pick") || s.includes("ramass") || s.includes("collect")) return 1;
  return 0;
}

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
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    setOrder(data ?? null);
    setLoading(false);
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
      refreshTracking();
    }, 30_000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, order?.tracking_number]);

  useEffect(() => {
    if (!user) return;
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, orderId]);

  useEffect(() => {
    if (order?.tracking_number) refreshTracking();
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

  const currentStep = tracking ? stepIndex(tracking.status) : -1;

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
        <div className="pt-6">
          <Button onClick={refreshTracking} disabled={refreshing || !order.tracking_number}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1.5" />
            )}
            Refresh Status
          </Button>
        </div>
      </div>

      {!order.tracking_number && (
        <Card className="border-amber-500/30 bg-amber-500/5 mb-6">
          <CardContent className="p-4 text-sm text-amber-700 dark:text-amber-400">
            This order has not been sent to ZRExpress yet. Send it from the orders page to start tracking.
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="border-border/60 shadow-soft mb-6">
        <CardHeader>
          <CardTitle className="text-base">Delivery progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex justify-between gap-2 relative">
              {/* Connector line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-border" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-primary transition-all"
                style={{
                  width:
                    currentStep <= 0
                      ? "0%"
                      : `calc(${(currentStep / (STEPS.length - 1)) * 100}% - ${currentStep === STEPS.length - 1 ? "2.5rem" : "0rem"})`,
                }}
              />
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const completed = idx <= currentStep;
                return (
                  <div
                    key={step.key}
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
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          {errorMsg && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-4">{errorMsg}</p>
          )}
        </CardContent>
      </Card>

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
              <a href={`tel:${order.shipping_address}`} className="hover:text-primary">
                {order.shipping_address}
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
                {tracking?.status ?? order.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="border-border/60 shadow-soft">
          <CardHeader>
            <CardTitle className="text-base">Status history</CardTitle>
          </CardHeader>
          <CardContent>
            {refreshing && !tracking ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : tracking?.history && tracking.history.length > 0 ? (
              <ol className="space-y-4">
                {tracking.history.map((h, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
                      {i < tracking.history.length - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-3">
                      <div className="text-sm font-medium capitalize">{h.status || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {h.date ? new Date(h.date).toLocaleString() : ""}
                        {h.location ? ` · ${h.location}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">
                No history available yet.
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
