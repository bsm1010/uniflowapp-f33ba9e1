import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore } from "@/hooks/use-current-store";
import { motion } from "framer-motion";

// Real wilaya centroids (longitude, latitude) converted to SVG coordinates
const WILAYAS = [
  { code: "01", name: "Adrar", x: 142, y: 340 },
  { code: "02", name: "Chlef", x: 274, y: 122 },
  { code: "03", name: "Laghouat", x: 290, y: 220 },
  { code: "04", name: "Oum El Bouaghi", x: 390, y: 148 },
  { code: "05", name: "Batna", x: 368, y: 162 },
  { code: "06", name: "Béjaïa", x: 340, y: 118 },
  { code: "07", name: "Biskra", x: 362, y: 200 },
  { code: "08", name: "Béchar", x: 98, y: 252 },
  { code: "09", name: "Blida", x: 292, y: 132 },
  { code: "10", name: "Bouira", x: 318, y: 128 },
  { code: "11", name: "Tamanrasset", x: 268, y: 442 },
  { code: "12", name: "Tébessa", x: 408, y: 172 },
  { code: "13", name: "Tlemcen", x: 198, y: 118 },
  { code: "14", name: "Tiaret", x: 252, y: 158 },
  { code: "15", name: "Tizi Ouzou", x: 326, y: 114 },
  { code: "16", name: "Alger", x: 304, y: 110 },
  { code: "17", name: "Djelfa", x: 294, y: 192 },
  { code: "18", name: "Jijel", x: 358, y: 108 },
  { code: "19", name: "Sétif", x: 358, y: 138 },
  { code: "20", name: "Saïda", x: 232, y: 168 },
  { code: "21", name: "Skikda", x: 382, y: 112 },
  { code: "22", name: "Sidi Bel Abbès", x: 212, y: 142 },
  { code: "23", name: "Annaba", x: 400, y: 108 },
  { code: "24", name: "Guelma", x: 390, y: 128 },
  { code: "25", name: "Constantine", x: 378, y: 128 },
  { code: "26", name: "Médéa", x: 290, y: 152 },
  { code: "27", name: "Mostaganem", x: 244, y: 128 },
  { code: "28", name: "M'Sila", x: 330, y: 182 },
  { code: "29", name: "Mascara", x: 228, y: 152 },
  { code: "30", name: "Ouargla", x: 368, y: 278 },
  { code: "31", name: "Oran", x: 216, y: 118 },
  { code: "32", name: "El Bayadh", x: 202, y: 210 },
  { code: "33", name: "Illizi", x: 428, y: 360 },
  { code: "34", name: "Bordj Bou Arréridj", x: 342, y: 148 },
  { code: "35", name: "Boumerdès", x: 312, y: 114 },
  { code: "36", name: "El Tarf", x: 410, y: 112 },
  { code: "37", name: "Tindouf", x: 52, y: 268 },
  { code: "38", name: "Tissemsilt", x: 260, y: 148 },
  { code: "39", name: "El Oued", x: 396, y: 238 },
  { code: "40", name: "Khenchela", x: 390, y: 162 },
  { code: "41", name: "Souk Ahras", x: 402, y: 132 },
  { code: "42", name: "Tipaza", x: 280, y: 118 },
  { code: "43", name: "Mila", x: 370, y: 132 },
  { code: "44", name: "Aïn Defla", x: 268, y: 138 },
  { code: "45", name: "Naâma", x: 172, y: 188 },
  { code: "46", name: "Aïn Témouchent", x: 208, y: 122 },
  { code: "47", name: "Ghardaïa", x: 308, y: 262 },
  { code: "48", name: "Relizane", x: 250, y: 138 },
  { code: "49", name: "Timimoun", x: 158, y: 298 },
  { code: "50", name: "Bordj Badji Mokhtar", x: 148, y: 422 },
  { code: "51", name: "Ouled Djellal", x: 342, y: 228 },
  { code: "52", name: "Béni Abbès", x: 108, y: 282 },
  { code: "53", name: "In Salah", x: 228, y: 368 },
  { code: "54", name: "In Guezzam", x: 272, y: 488 },
  { code: "55", name: "Touggourt", x: 378, y: 252 },
  { code: "56", name: "Djanet", x: 448, y: 398 },
  { code: "57", name: "El M'Ghair", x: 388, y: 228 },
  { code: "58", name: "El Meniaa", x: 282, y: 308 },
];

function getColor(count: number, max: number): string {
  if (count === 0) return "hsl(220 13% 91%)";
  const t = Math.min(count / Math.max(max, 1), 1);
  // interpolate from light purple to deep purple
  const lightness = Math.round(85 - t * 55);
  const saturation = Math.round(40 + t * 60);
  return `hsl(262 ${saturation}% ${lightness}%)`;
}

function getRadius(count: number, max: number): number {
  if (count === 0) return 8;
  return 8 + Math.round((count / Math.max(max, 1)) * 18);
}

export function AlgeriaOrdersMap() {
  const { currentStore } = useCurrentStore();
  const [ordersByWilaya, setOrdersByWilaya] = useState<Record<string, number>>({});
  const [tooltip, setTooltip] = useState<{
    name: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (!currentStore?.id) return;
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("shipping_wilaya")
        .eq("store_id", currentStore.id);

      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        const w = row.shipping_wilaya;
        if (w) map[w] = (map[w] ?? 0) + 1;
      }
      setOrdersByWilaya(map);
      setTotalOrders(Object.values(map).reduce((a, b) => a + b, 0));
      setLoading(false);
    };
    fetchOrders();
  }, [currentStore?.id]);

  const max = Math.max(...Object.values(ordersByWilaya), 1);

  // Top 5 wilayas
  const topWilayas = [...WILAYAS]
    .map((w) => ({ ...w, count: ordersByWilaya[w.name] ?? 0 }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Orders by Wilaya</h3>
          <p className="text-sm text-muted-foreground">
            {totalOrders} total orders across Algeria
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-3 w-3 rounded-full bg-gray-200" />
          <span>0</span>
          <div className="h-2 w-16 rounded-full"
            style={{ background: "linear-gradient(to right, #c4b5fd, #6d28d9)" }}
          />
          <span>High</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAP */}
        <div className="lg:col-span-2 relative">
          {loading ? (
            <div className="h-[500px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm">Loading map...</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <svg
                viewBox="0 0 480 520"
                className="w-full h-auto"
                style={{ maxHeight: "500px" }}
              >
                {/* Algeria outline background */}
                <rect
                  x="40" y="90" width="400" height="400"
                  rx="4" fill="hsl(220 13% 96%)"
                  stroke="hsl(220 13% 85%)" strokeWidth="1"
                />

                {/* Wilaya bubbles */}
                {WILAYAS.map((wilaya) => {
                  const count = ordersByWilaya[wilaya.name] ?? 0;
                  const r = getRadius(count, max);
                  const fill = getColor(count, max);
                  return (
                    <motion.g
                      key={wilaya.code}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: parseInt(wilaya.code) * 0.01, duration: 0.3 }}
                    >
                      <circle
                        cx={wilaya.x}
                        cy={wilaya.y}
                        r={r}
                        fill={fill}
                        stroke="white"
                        strokeWidth="1.5"
                        style={{ cursor: "pointer", transition: "r 0.2s" }}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.closest("svg")!.getBoundingClientRect();
                          setTooltip({
                            name: wilaya.name,
                            count,
                            x: e.clientX - rect.left,
                            y: e.clientY - rect.top,
                          });
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                      {count > 0 && (
                        <text
                          x={wilaya.x}
                          y={wilaya.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={count > 9 ? "7" : "8"}
                          fill="white"
                          fontWeight="600"
                          pointerEvents="none"
                        >
                          {count}
                        </text>
                      )}
                      <text
                        x={wilaya.x}
                        y={wilaya.y + r + 8}
                        textAnchor="middle"
                        fontSize="5.5"
                        fill="hsl(220 13% 45%)"
                        pointerEvents="none"
                      >
                        {wilaya.code}
                      </text>
                    </motion.g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute z-10 pointer-events-none bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-sm"
                  style={{ left: tooltip.x + 12, top: tooltip.y - 45 }}
                >
                  <div className="font-semibold">{tooltip.name}</div>
                  <div className="text-muted-foreground">
                    {tooltip.count} {tooltip.count === 1 ? "order" : "orders"}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* TOP WILAYAS SIDEBAR */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Top Wilayas
          </h4>
          {topWilayas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet</p>
          ) : (
            topWilayas.map((w, i) => (
              <motion.div
                key={w.code}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="text-xs font-bold text-muted-foreground w-4">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{w.name}</span>
                    <span className="text-sm font-bold">{w.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(w.count / max) * 100}%` }}
                      transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                    />
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* Summary stats */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Wilayas with orders</span>
              <span className="font-medium">
                {Object.keys(ordersByWilaya).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Most active</span>
              <span className="font-medium">
                {topWilayas[0]?.name ?? "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total orders</span>
              <span className="font-medium">{totalOrders}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
