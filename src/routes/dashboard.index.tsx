// ─── 1. Add this import at the top of dashboard.index.tsx ───────────────────
import { useCountUp } from "@/hooks/use-count-up";

// ─── 2. Replace the StatCard inside the stats .map() with this component ────
function StatCard({
  label,
  rawValue,
  isRevenue,
  icon: Icon,
  accent,
  iconColor,
  borderColor,
  delay,
}: {
  label: string;
  rawValue: number;
  isRevenue?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  iconColor: string;
  borderColor: string;
  delay: number;
}) {
  const animated = useCountUp(rawValue, 1400, delay);
  const display = isRevenue ? `$${animated.toLocaleString()}` : animated.toLocaleString();

  return (
    <Card className={`relative overflow-hidden ${borderColor} shadow-soft hover:shadow-glow/20 transition-shadow`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} pointer-events-none`} />
      <CardContent className="relative p-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">{label}</span>
          <div className="h-9 w-9 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center border border-border/60">
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-3xl font-bold font-display tabular-nums transition-all">
            {display}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── 3. Replace the stats grid in DashboardHome with this ───────────────────
// (find the block: <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">)
// and replace with:

/*
<div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  {stats.map((s, i) => (
    <motion.div
      key={s.label}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 * i }}
    >
      <StatCard
        label={s.label}
        rawValue={s.raw}
        isRevenue={s.isRevenue}
        icon={s.icon}
        accent={s.accent}
        iconColor={s.iconColor}
        borderColor={s.borderColor}
        delay={i * 120}
      />
    </motion.div>
  ))}
</div>
*/

// ─── 4. Update the stats array to use `raw` instead of `value` ───────────────
// Replace your current `stats` array with:

/*
const stats = [
  {
    label: t("dashboard.home.stats.products"),
    raw: counts.products,
    icon: Package,
    accent: "from-violet-500/40 to-violet-500/15",
    iconColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-500/30",
  },
  {
    label: t("dashboard.home.stats.orders"),
    raw: counts.orders,
    icon: ShoppingBag,
    accent: "from-fuchsia-500/40 to-fuchsia-500/15",
    iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
    borderColor: "border-fuchsia-500/30",
  },
  {
    label: t("dashboard.home.stats.revenue"),
    raw: counts.revenue,
    isRevenue: true,
    icon: DollarSign,
    accent: "from-emerald-500/40 to-emerald-500/15",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  {
    label: t("dashboard.home.stats.customers"),
    raw: counts.customers,
    icon: Users,
    accent: "from-sky-500/40 to-sky-500/15",
    iconColor: "text-sky-600 dark:text-sky-400",
    borderColor: "border-sky-500/30",
  },
];
*/
