import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore } from "@/hooks/use-current-store";
import {
  ALGERIA_MAP_HEIGHT,
  ALGERIA_MAP_WIDTH,
  ALGERIA_WILAYA_SHAPES,
} from "@/lib/algeriaMapShapes";
import { ALGERIA_GEO } from "@/lib/algeriaWilayas";

type TooltipState = { name: string; count: number; x: number; y: number } | null;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]/g, "");

const codeToName = new Map(ALGERIA_GEO.map((w) => [String(w.code).padStart(2, "0"), w.wilaya]));
const cityToName = new Map<string, string>();
for (const entry of ALGERIA_GEO) {
  cityToName.set(normalize(entry.wilaya), entry.wilaya);
  for (const city of entry.cities) cityToName.set(normalize(city), entry.wilaya);
}
cityToName.set("alger", "Algiers");
cityToName.set("algiers", "Algiers");
cityToName.set("msila", "M'Sila");
cityToName.set("m sila", "M'Sila");

function resolveWilaya(city?: string | null, postal?: string | null) {
  const byCity = city ? cityToName.get(normalize(city)) : null;
  if (byCity) return byCity;
  const digits = (postal ?? "").replace(/\D/g, "");
  if (digits.length >= 2) return codeToName.get(digits.slice(0, 2));
  return null;
}

function heatColor(count: number, max: number) {
  if (!count) return "color-mix(in oklch, var(--muted) 62%, var(--background))";
  const t = count / Math.max(max, 1);
  if (t < 0.25) return "oklch(0.82 0.12 170)";
  if (t < 0.5) return "oklch(0.74 0.16 145)";
  if (t < 0.75) return "oklch(0.66 0.19 80)";
  return "oklch(0.58 0.22 35)";
}

export function AlgeriaOrdersMap() {
  const { currentStore } = useCurrentStore();
  const [ordersByWilaya, setOrdersByWilaya] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!currentStore?.id) {
      setOrdersByWilaya({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("shipping_city, shipping_postal_code")
        .eq("store_id", currentStore.id)
        .order("created_at", { ascending: false })
        .limit(500);

      if (cancelled) return;
      const next: Record<string, number> = {};
      for (const order of data ?? []) {
        const wilaya = resolveWilaya(order.shipping_city, order.shipping_postal_code);
        if (wilaya) next[wilaya] = (next[wilaya] ?? 0) + 1;
      }
      setOrdersByWilaya(next);
      setLoading(false);
    };

    void load();

    // ── Live updates: incrementally add new orders ────────────────────────────
    const channel = supabase
      .channel(`algeria-map-orders-${currentStore.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${currentStore.id}`,
        },
        (payload) => {
          const newOrder = payload.new as { shipping_city: string; shipping_postal_code: string };
          const wilaya = resolveWilaya(newOrder.shipping_city, newOrder.shipping_postal_code);
          if (wilaya) {
            setOrdersByWilaya((prev) => ({ ...prev, [wilaya]: (prev[wilaya] ?? 0) + 1 }));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [currentStore?.id]);

  const max = Math.max(1, ...Object.values(ordersByWilaya));
  const totalOrders = Object.values(ordersByWilaya).reduce((sum, c) => sum + c, 0);

  const topWilayas = useMemo(
    () =>
      ALGERIA_WILAYA_SHAPES.map((shape) => ({
        ...shape,
        count: ordersByWilaya[shape.name] ?? 0,
      }))
        .filter((s) => s.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    [ordersByWilaya],
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Orders by Wilaya</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{totalOrders}</span> orders mapped
            across Algeria
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Low</span>
          <span className="h-2 w-20 rounded-full bg-gradient-to-r from-emerald-200 via-amber-300 to-orange-600" />
          <span>High</span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* ── Map ── */}
        <div className="relative min-h-[460px] bg-muted/20 p-4 md:p-6">
          {loading ? (
            <div className="flex h-[460px] items-center justify-center text-sm text-muted-foreground">
              Loading map…
            </div>
          ) : (
            <div className="relative mx-auto max-w-4xl">
              <svg
                viewBox={`0 0 ${ALGERIA_MAP_WIDTH} ${ALGERIA_MAP_HEIGHT}`}
                className="h-auto w-full max-h-[620px] drop-shadow-sm"
                role="img"
                aria-label="Interactive Algeria orders heatmap by wilaya"
              >
                <defs>
                  <filter id="wilayaShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow
                      dx="0"
                      dy="8"
                      stdDeviation="10"
                      floodColor="currentColor"
                      floodOpacity="0.12"
                    />
                  </filter>
                </defs>

                <g filter="url(#wilayaShadow)">
                  {ALGERIA_WILAYA_SHAPES.map((shape, index) => {
                    const count = ordersByWilaya[shape.name] ?? 0;
                    const isSelected = selected === shape.name;

                    return (
                      <motion.path
                        key={`${shape.code}-${shape.name}`}
                        d={shape.d}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.006, duration: 0.25 }}
                        fill={heatColor(count, max)}
                        // ── FIX: always-visible border that works in light + dark ──
                        stroke={isSelected ? "var(--foreground)" : "rgba(100,100,100,0.45)"}
                        strokeWidth={isSelected ? 2.5 : 0.8}
                        className="cursor-pointer transition-[filter,opacity] hover:brightness-105"
                        onClick={() =>
                          setSelected((cur) => (cur === shape.name ? null : shape.name))
                        }
                        onMouseMove={(event) => {
                          const rect = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
                          if (!rect) return;
                          setTooltip({
                            name: shape.name,
                            count,
                            x: event.clientX - rect.left,
                            y: event.clientY - rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  })}
                </g>
              </svg>

              {/* ── Tooltip ── */}
              <AnimatePresence>
                {tooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 4 }}
                    className="pointer-events-none absolute z-10 rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lg"
                    style={{
                      left: Math.min(tooltip.x + 14, 760),
                      top: Math.max(tooltip.y - 48, 8),
                    }}
                  >
                    <div className="font-semibold text-popover-foreground">{tooltip.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {tooltip.count} {tooltip.count === 1 ? "order" : "orders"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="border-t border-border/60 p-5 lg:border-l lg:border-t-0">
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Top Wilayas
          </h4>

          <div className="mt-4 space-y-3">
            {topWilayas.length ? (
              topWilayas.map((wilaya, index) => (
                <button
                  key={wilaya.name}
                  type="button"
                  onClick={() => setSelected(wilaya.name)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">
                      {index + 1}. {wilaya.name}
                    </span>
                    <span className="font-bold text-foreground">{wilaya.count}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(wilaya.count / max) * 100}%` }}
                    />
                  </div>
                </button>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No orders have a recognized wilaya yet.
              </p>
            )}
          </div>

          {selected && (
            <div className="mt-4 rounded-lg bg-accent p-3 text-sm">
              <span className="font-semibold">{selected}</span>
              <span className="text-muted-foreground">
                {" "}
                · {ordersByWilaya[selected] ?? 0} orders
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
