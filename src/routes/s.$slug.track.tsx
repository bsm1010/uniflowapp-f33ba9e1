import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Package, CheckCircle2, Truck, Home, Clock, XCircle } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  StorefrontShell,
  getStoreTokens,
} from "@/components/storefront/StorefrontShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type StoreSettings = Tables<"store_settings">;
type Order = Tables<"orders">;
type OrderItem = Tables<"order_items">;

const searchSchema = z.object({
  order: z.string().optional(),
  phone: z.string().optional(),
});

export const Route = createFileRoute("/s/$slug/track")({
  component: TrackPage,
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Track your order" }] }),
});

const STEP_KEYS = ["pending", "confirmed", "shipped", "delivered"] as const;
const STEP_ICONS = { pending: Clock, confirmed: CheckCircle2, shipped: Truck, delivered: Home };

function TrackPage() {
  const { slug } = Route.useParams();
  const { order: orderParam, phone: phoneParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { t: tr } = useTranslation();

  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  const [phoneInput, setPhoneInput] = useState(phoneParam ?? "");
  const [orders, setOrders] = useState<(Order & { items: OrderItem[] })[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("store_settings")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (!active) return;
      setSettings(data);
      setSettingsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  const lookup = async (opts: { phone?: string; orderId?: string }) => {
    setSearching(true);
    setSearched(true);
    let query = supabase
      .from("orders")
      .select("*")
      .eq("store_slug", slug)
      .order("created_at", { ascending: false });

    if (opts.orderId) query = query.eq("id", opts.orderId);
    if (opts.phone) query = query.eq("shipping_address", opts.phone.trim());

    const { data: ords } = await query;
    if (!ords || ords.length === 0) {
      setOrders([]);
      setSearching(false);
      return;
    }
    const ids = ords.map((o) => o.id);
    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", ids);
    const grouped = ords.map((o) => ({
      ...o,
      items: (items ?? []).filter((it) => it.order_id === o.id),
    }));
    setOrders(grouped);
    setSearching(false);
  };

  useEffect(() => {
    if (!settings) return;
    if (orderParam) {
      lookup({ orderId: orderParam });
    } else if (phoneParam) {
      lookup({ phone: phoneParam });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, orderParam, phoneParam]);

  useEffect(() => {
    if (orders.length === 0) return;
    const ids = orders.map((o) => o.id);
    const channel = supabase
      .channel(`track-${slug}-${ids[0]}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as Order;
          if (!ids.includes(updated.id)) return;
          setOrders((cur) =>
            cur.map((o) => (o.id === updated.id ? { ...o, ...updated } : o)),
          );
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orders, slug]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    navigate({ to: "/s/$slug/track", params: { slug }, search: { phone: phoneInput.trim() } });
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>{tr("storefront.notFound")}</p>
      </div>
    );
  }

  const t = getStoreTokens(settings);
  const radius =
    settings.theme === "minimal" ? 0 : settings.theme === "grid" ? 8 : 16;

  return (
    <StorefrontShell settings={settings}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center h-14 w-14 rounded-full mb-4"
            style={{ backgroundColor: t.primary + "1f", color: t.primary }}
          >
            <Package className="h-7 w-7" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{tr("storefront.track.title")}</h1>
          <p className="mt-2 text-sm" style={{ color: t.muted }}>
            {tr("storefront.track.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row gap-2 mb-8"
        >
          <Input
            type="tel"
            placeholder={tr("storefront.track.phonePh")}
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={searching || !phoneInput.trim()}
            style={{ backgroundColor: t.primary, color: t.onPrimary, borderRadius: radius / 2 }}
          >
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {!searching && tr("storefront.track.search")}
          </Button>
        </form>

        {searching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!searching && searched && orders.length === 0 && (
          <div
            className="text-center py-12 rounded-lg"
            style={{ backgroundColor: t.surface, border: `1px solid ${t.border}`, borderRadius: radius / 2 }}
          >
            <XCircle className="h-10 w-10 mx-auto mb-2" style={{ color: t.muted }} />
            <p className="font-medium">{tr("storefront.track.none")}</p>
            <p className="text-sm mt-1" style={{ color: t.muted }}>
              {tr("storefront.track.noneDesc")}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {orders.map((o) => (
            <OrderTrackingCard key={o.id} order={o} tokens={t} radius={radius} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/s/$slug"
            params={{ slug }}
            className="text-sm underline"
            style={{ color: t.muted }}
          >
            {tr("storefront.track.back")}
          </Link>
        </div>
      </div>
    </StorefrontShell>
  );
}

function OrderTrackingCard({
  order,
  tokens: t,
  radius,
}: {
  order: Order & { items: OrderItem[] };
  tokens: ReturnType<typeof getStoreTokens>;
  radius: number;
}) {
  const { t: tr } = useTranslation();
  const status = (order.status || "pending").toLowerCase();
  const isCancelled = status === "cancelled";
  const currentIndex = useMemo(() => {
    const i = STEP_KEYS.findIndex((s) => s === status);
    return i === -1 ? 0 : i;
  }, [status]);
  const stepKey = STEP_KEYS[currentIndex];
  const progressPct = isCancelled ? 0 : ((currentIndex + 1) / STEP_KEYS.length) * 100;

  return (
    <div
      className="p-5 sm:p-6"
      style={{
        backgroundColor: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: radius,
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-xs font-mono" style={{ color: t.muted }}>
            {tr("storefront.track.orderNo", { id: order.id.slice(0, 8).toUpperCase() })}
          </div>
          <div className="font-semibold mt-1">{order.customer_name}</div>
          <div className="text-sm" style={{ color: t.muted }}>
            {order.shipping_city} • {order.shipping_postal_code}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: t.muted }}>
            {new Date(order.created_at).toLocaleDateString()}
          </div>
          <div className="font-semibold mt-1">{Number(order.total).toLocaleString()} DA</div>
        </div>
      </div>

      {order.items.length > 0 && (
        <div className="mb-5 text-sm">
          <div className="font-medium mb-1">{tr("storefront.track.items")}</div>
          <ul className="space-y-1" style={{ color: t.muted }}>
            {order.items.map((it) => (
              <li key={it.id}>
                {it.product_name} × {it.quantity}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCancelled ? (
        <div
          className="flex items-center gap-2 p-3 rounded text-sm"
          style={{ backgroundColor: "#fee2e2", color: "#991b1b", borderRadius: radius / 2 }}
        >
          <XCircle className="h-4 w-4" />
          {tr("storefront.track.cancelled")}
        </div>
      ) : (
        <>
          <div className="relative mb-6">
            <div
              className="absolute top-4 left-0 right-0 h-1 rounded"
              style={{ backgroundColor: t.border }}
            />
            <div
              className="absolute top-4 left-0 h-1 rounded transition-all duration-500"
              style={{ backgroundColor: t.primary, width: `${progressPct}%` }}
            />
            <div className="relative flex justify-between">
              {STEP_KEYS.map((key, i) => {
                const Icon = STEP_ICONS[key];
                const reached = i <= currentIndex;
                return (
                  <div key={key} className="flex flex-col items-center text-center" style={{ width: 80 }}>
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center transition-colors"
                      style={{
                        backgroundColor: reached ? t.primary : t.surface,
                        color: reached ? t.onPrimary : t.muted,
                        border: `2px solid ${reached ? t.primary : t.border}`,
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div
                      className="text-xs mt-2 font-medium"
                      style={{ color: reached ? t.fg : t.muted }}
                    >
                      {tr(`storefront.track.steps.${key}`)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className="p-3 rounded text-sm"
            style={{ backgroundColor: t.primary + "12", color: t.fg, borderRadius: radius / 2 }}
          >
            {tr(`storefront.track.steps.${stepKey}Msg`)}
          </div>
        </>
      )}
    </div>
  );
}
