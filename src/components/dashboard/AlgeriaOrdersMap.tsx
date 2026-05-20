import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentStore } from "@/hooks/use-current-store";
import { motion, AnimatePresence } from "framer-motion";

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

// Algeria rough border path for SVG background
const ALGERIA_PATH = "M 195 88 L 220 85 L 260 83 L 300 82 L 340 83 L 375 85 L 405 88 L 425 92 L 440 98 L 450 108 L 455 118 L 458 132 L 457 148 L 453 162 L 448 175 L 445 188 L 443 205 L 441 225 L 440 248 L 439 268 L 438 290 L 436 315 L 433 340 L 428 368 L 422 395 L 415 420 L 405 445 L 392 465 L 375 480 L 352 490 L 325 496 L 295 498 L 265 495 L 235 488 L 205 476 L 178 460 L 155 440 L 135 415 L 112 385 L 88 355 L 68 325 L 52 295 L 42 265 L 38 238 L 38 215 L 42 195 L 48 178 L 56 163 L 65 150 L 75 138 L 88 126 L 105 114 L 125 104 L 148 96 L 170 90 L 195 88 Z";
function getGlowColor(count: number, max: number): string {
  if (count === 0) return "transparent";
  const t = Math.min(count / Math.max(max, 1), 1);
  const opacity = 0.3 + t * 0.5;
  return `rgba(139, 92, 246, ${opacity})`;
}

function getFillColor(count: number, max: number): string {
  if (count === 0) return "rgba(139, 92, 246, 0.08)";
  const t = Math.min(count / Math.max(max, 1), 1);
  if (t < 0.25) return "rgba(167, 139, 250, 0.6)";
  if (t < 0.5) return "rgba(139, 92, 246, 0.75)";
  if (t < 0.75) return "rgba(109, 40, 217, 0.85)";
  return "rgba(91, 33, 182, 0.95)";
}

function getRadius(count: number, max: number): number {
  if (count === 0) return 6;
  return 8 + Math.round((count / Math.max(max, 1)) * 20);
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
  const [hoveredWilaya, setHoveredWilaya] = useState<string | null>(null);

  useEffect(() => {
    if (!currentStore?.id) return;
    const fetchOrders = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("shipping_city, shipping_postal_code")
        .eq("store_id", currentStore.id);

      const norm = (s: string) =>
        s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['`’\s-]/g, "");
      const byName = new Map(WILAYAS.map((w) => [norm(w.name), w.name]));
      const byCode = new Map(WILAYAS.map((w) => [w.code, w.name]));

      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        const city = (row.shipping_city ?? "").toString().trim();
        const postal = (row.shipping_postal_code ?? "").toString().trim();
        let name: string | undefined;
        if (city) name = byName.get(norm(city));
        if (!name && postal) name = byCode.get(postal.slice(0, 2));
        if (name) map[name] = (map[name] ?? 0) + 1;
      }
      setOrdersByWilaya(map);
      setTotalOrders(Object.values(map).reduce((a, b) => a + b, 0));
      setLoading(false);
    };
    fetchOrders();
  }, [currentStore?.id]);

  const max = Math.max(...Object.values(ordersByWilaya), 1);

  const topWilayas = [...WILAYAS]
    .map((w) => ({ ...w, count: ordersByWilaya[w.name] ?? 0 }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/50">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Orders by Wilaya</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{totalOrders}</span> total orders across Algeria
          </p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-violet-200/60 border border-violet-300/40" />
            <span>Low</span>
          </div>
          <div className="h-px w-8 bg-gradient-to-r from-violet-300 to-violet-700" />
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-violet-700" />
            <span>High</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* MAP */}
        <div className="lg:col-span-2 relative p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {/* Grid lines for atmosphere */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
            }}
          />

          {loading ? (
            <div className="h-[480px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <span className="text-sm">Loading map...</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <svg viewBox="0 0 500 530" className="w-full h-auto" style={{ maxHeight: "480px" }}>
                <defs>
                  <radialGradient id="mapBg" cx="50%" cy="40%" r="60%">
                    <stop offset="0%" stopColor="rgba(139,92,246,0.06)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="softglow">
                    <feGaussianBlur stdDeviation="6" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Algeria background shape */}
                <path
                  d={ALGERIA_PATH}
                  fill="rgba(139,92,246,0.04)"
                  stroke="rgba(139,92,246,0.2)"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <path d={ALGERIA_PATH} fill="url(#mapBg)" />

                {/* Wilaya bubbles */}
                {WILAYAS.map((wilaya, i) => {
                  const count = ordersByWilaya[wilaya.name] ?? 0;
                  const r = getRadius(count, max);
                  const fill = getFillColor(count, max);
                  const isHovered = hoveredWilaya === wilaya.code;
                  const hasOrders = count > 0;

                  return (
                    <motion.g
                      key={wilaya.code}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.008, duration: 0.4, type: "spring", stiffness: 200 }}
                    >
                      {/* Glow ring for wilayas with orders */}
                      {hasOrders && (
                        <circle
                          cx={wilaya.x}
                          cy={wilaya.y}
                          r={r + 5}
                          fill="none"
                          stroke={getGlowColor(count, max)}
                          strokeWidth="8"
                          filter="url(#softglow)"
                          opacity={isHovered ? 1 : 0.5}
                        />
                      )}

                      {/* Main bubble */}
                      <circle
                        cx={wilaya.x}
                        cy={wilaya.y}
                        r={isHovered ? r + 3 : r}
                        fill={fill}
                        stroke={hasOrders ? "rgba(167,139,250,0.8)" : "rgba(139,92,246,0.2)"}
                        strokeWidth={hasOrders ? "1.5" : "1"}
                        style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                        filter={hasOrders ? "url(#glow)" : undefined}
                        onMouseEnter={(e) => {
                          const rect = e.currentTarget.closest("svg")!.getBoundingClientRect();
                          const svgEl = e.currentTarget.closest("svg")!;
                          const svgRect = svgEl.getBoundingClientRect();
                          const scaleX = svgRect.width / 500;
                          const scaleY = svgRect.height / 530;
                          setTooltip({
                            name: wilaya.name,
                            count,
                            x: wilaya.x * scaleX,
                            y: wilaya.y * scaleY,
                          });
                          setHoveredWilaya(wilaya.code);
                        }}
                        onMouseLeave={() => {
                          setTooltip(null);
                          setHoveredWilaya(null);
                        }}
                      />

                      {/* Order count label */}
                      {count > 0 && (
                        <text
                          x={wilaya.x}
                          y={wilaya.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={r > 16 ? "8" : "7"}
                          fill="white"
                          fontWeight="700"
                          pointerEvents="none"
                        >
                          {count}
                        </text>
                      )}

                      {/* Wilaya code — only show on hover or if has orders */}
                      {(hasOrders || isHovered) && (
                        <text
                          x={wilaya.x}
                          y={wilaya.y + r + 9}
                          textAnchor="middle"
                          fontSize="5"
                          fill={hasOrders ? "rgba(167,139,250,0.9)" : "rgba(100,100,120,0.6)"}
                          fontWeight="600"
                          pointerEvents="none"
                        >
                          {wilaya.code}
                        </text>
                      )}
                    </motion.g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              <AnimatePresence>
                {tooltip && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 pointer-events-none"
                    style={{ left: tooltip.x + 14, top: tooltip.y - 52 }}
                  >
                    <div className="bg-slate-900 border border-violet-500/40 rounded-xl px-3 py-2 shadow-2xl shadow-violet-900/30">
                      <div className="font-semibold text-white text-sm">{tooltip.name}</div>
                      <div className="text-violet-300 text-xs mt-0.5">
                        {tooltip.count === 0 ? "No orders" : `${tooltip.count} ${tooltip.count === 1 ? "order" : "orders"}`}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* SIDEBAR */}
        <div className="flex flex-col gap-4 p-6 border-l border-border/50 bg-card">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Top Wilayas
          </h4>

          {topWilayas.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2 py-8 text-center">
              <div className="h-10 w-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                <span className="text-xl">🗺️</span>
              </div>
              <p className="text-sm text-muted-foreground">No orders yet</p>
              <p className="text-xs text-muted-foreground/60">Orders will appear here once placed</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {topWilayas.map((w, i) => (
                <motion.div
                  key={w.code}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="group flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-default"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black"
                    style={{
                      background: i === 0 ? "linear-gradient(135deg, #f59e0b, #d97706)" :
                                  i === 1 ? "linear-gradient(135deg, #94a3b8, #64748b)" :
                                  i === 2 ? "linear-gradient(135deg, #cd7c2f, #a16207)" :
                                  "linear-gradient(135deg, #6d28d9, #4c1d95)",
                      color: "white"
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium truncate">{w.name}</span>
                      <span className="text-sm font-bold text-violet-600 dark:text-violet-400 ml-2 shrink-0">{w.count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #8b5cf6, #6d28d9)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(w.count / max) * 100}%` }}
                        transition={{ delay: i * 0.08 + 0.3, duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-auto pt-4 border-t border-border/50 space-y-3">
            {[
              { label: "Wilayas with orders", value: Object.keys(ordersByWilaya).length },
              { label: "Most active", value: topWilayas[0]?.name ?? "—" },
              { label: "Total orders", value: totalOrders },
            ].map((stat) => (
              <div key={stat.label} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{stat.label}</span>
                <span className="font-semibold text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
