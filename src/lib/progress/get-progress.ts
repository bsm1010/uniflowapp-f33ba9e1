import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

export type SetupItem = {
  key: string;
  label: string;
  completed: boolean;
};

export type Milestone = {
  key: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
};

export type ProgressData = {
  setupProgress: number;
  setupItems: SetupItem[];
  milestones: Milestone[];
  stats: {
    products: number;
    published: number;
    orders: number;
    revenue: number;
  };
};

const CHECKLIST: SetupItem[] = [
  { key: "product", label: "progress.setup.product", completed: false },
  { key: "published", label: "progress.setup.published", completed: false },
  { key: "store_customized", label: "progress.setup.store_customized", completed: false },
  { key: "first_order", label: "progress.setup.first_order", completed: false },
  { key: "store_launched", label: "progress.setup.store_launched", completed: false },
];

const MILESTONES: (Omit<Milestone, "unlocked"> & { check: (stats: any) => boolean | number })[] = [
  {
    key: "first_product",
    label: "progress.milestones.first_product.label",
    description: "progress.milestones.first_product.description",
    icon: "Package",
    check: (s) => s.products >= 1,
  },
  {
    key: "first_published",
    label: "progress.milestones.first_published.label",
    description: "progress.milestones.first_published.description",
    icon: "CheckCircle2",
    check: (s) => s.published >= 1,
  },
  {
    key: "ten_products",
    label: "progress.milestones.ten_products.label",
    description: "progress.milestones.ten_products.description",
    icon: "Layers",
    check: (s) => Math.min(s.products / 10, 1),
  },
  {
    key: "first_sale",
    label: "progress.milestones.first_sale.label",
    description: "progress.milestones.first_sale.description",
    icon: "ShoppingBag",
    check: (s) => s.orders >= 1,
  },
  {
    key: "ten_orders",
    label: "progress.milestones.ten_orders.label",
    description: "progress.milestones.ten_orders.description",
    icon: "TrendingUp",
    check: (s) => Math.min(s.orders / 10, 1),
  },
  {
    key: "hundred_orders",
    label: "progress.milestones.hundred_orders.label",
    description: "progress.milestones.hundred_orders.description",
    icon: "Award",
    check: (s) => Math.min(s.orders / 100, 1),
  },
  {
    key: "first_revenue",
    label: "progress.milestones.first_revenue.label",
    description: "progress.milestones.first_revenue.description",
    icon: "DollarSign",
    check: (s) => s.revenue >= 1,
  },
  {
    key: "revenue_100k",
    label: "progress.milestones.revenue_100k.label",
    description: "progress.milestones.revenue_100k.description",
    icon: "Zap",
    check: (s) => Math.min(s.revenue / 100000, 1),
  },
];

const Schema = z.object({
  accessToken: z.string().min(1),
  storeId: z.string().min(1),
});

export const getProgress = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(data.accessToken);
    if (authError || !user) {
      return {
        setupProgress: 0,
        setupItems: CHECKLIST,
        milestones: MILESTONES.map(({ check, ...m }) => ({ ...m, unlocked: false })),
        stats: { products: 0, published: 0, orders: 0, revenue: 0 },
      } as ProgressData;
    }

    const [prodRes, orderRes, settingsRes, storeRes] = await Promise.all([
      client.from("products").select("id,status").eq("store_id", data.storeId),
      client.from("orders").select("id,total").eq("store_id", data.storeId),
      client
        .from("store_settings")
        .select("id,primary_color,background_color,hero_heading")
        .eq("store_id", data.storeId)
        .maybeSingle(),
      client.from("stores").select("id,is_active,description").eq("id", data.storeId).maybeSingle(),
    ]);

    const products = prodRes.data ?? [];
    const orders = orderRes.data ?? [];
    const settings = settingsRes.data;
    const store = storeRes.data;

    const productCount = products.length;
    const publishedCount = products.filter((p: any) => p.status === "published").length;
    const orderCount = orders.length;
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

    const hasCustomized = !!(
      settings?.primary_color &&
      settings.primary_color !== "#000000" &&
      settings?.hero_heading
    );

    const setupItems: SetupItem[] = [
      { key: "product", label: "progress.setup.product", completed: productCount >= 1 },
      { key: "published", label: "progress.setup.published", completed: publishedCount >= 1 },
      {
        key: "store_customized",
        label: "progress.setup.store_customized",
        completed: hasCustomized,
      },
      { key: "first_order", label: "progress.setup.first_order", completed: orderCount >= 1 },
      {
        key: "store_launched",
        label: "progress.setup.store_launched",
        completed: store?.is_active === true,
      },
    ];

    const completedItems = setupItems.filter((i) => i.completed).length;
    const setupProgress = Math.round((completedItems / setupItems.length) * 100);

    const stats = {
      products: productCount,
      published: publishedCount,
      orders: orderCount,
      revenue: totalRevenue,
    };

    const milestones: Milestone[] = MILESTONES.map(({ check, ...m }) => {
      const result = check(stats);
      if (typeof result === "boolean") {
        return { ...m, unlocked: result };
      }
      return {
        ...m,
        unlocked: result >= 1,
        progress: Math.round(result * 100),
        target: m.key.includes("ten_")
          ? 10
          : m.key.includes("hundred_")
            ? 100
            : m.key.includes("100k")
              ? 100000
              : 1,
      };
    });

    return { setupProgress, setupItems, milestones, stats };
  });
