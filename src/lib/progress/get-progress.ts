import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

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
  { key: "product", label: "إضافة منتج", completed: false },
  { key: "published", label: "نشر منتج", completed: false },
  { key: "store_customized", label: "تخصيص المتجر", completed: false },
  { key: "first_order", label: "استقبال أول طلب", completed: false },
  { key: "store_launched", label: "إطلاق المتجر", completed: false },
];

const MILESTONES: (Omit<Milestone, "unlocked"> & { check: (stats: any) => boolean | number })[] = [
  { key: "first_product", label: "أول منتج", description: "أضف منتجك الأول", icon: "Package", check: (s) => s.products >= 1 },
  { key: "first_published", label: "أول منتج منشور", description: "انشر منتجك الأول", icon: "CheckCircle2", check: (s) => s.published >= 1 },
  { key: "ten_products", label: "10 منتجات", description: "أضف 10 منتجات", icon: "Layers", check: (s) => Math.min(s.products / 10, 1) },
  { key: "first_sale", label: "أول عملية بيع", description: "استقبل أول طلب", icon: "ShoppingBag", check: (s) => s.orders >= 1 },
  { key: "ten_orders", label: "10 طلبات", description: "استقبل 10 طلبات", icon: "TrendingUp", check: (s) => Math.min(s.orders / 10, 1) },
  { key: "hundred_orders", label: "100 طلب", description: "استقبل 100 طلب", icon: "Award", check: (s) => Math.min(s.orders / 100, 1) },
  { key: "first_revenue", label: "أول أرباح", description: "حق أول أرباح", icon: "DollarSign", check: (s) => s.revenue >= 1 },
  { key: "revenue_100k", label: "100,000 د.ج", description: "حق 100,000 د.ج أرباح", icon: "Zap", check: (s) => Math.min(s.revenue / 100000, 1) },
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

    const { data: { user }, error: authError } = await client.auth.getUser(data.accessToken);
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
      client.from("store_settings").select("id,primary_color,background_color,hero_heading").eq("store_id", data.storeId).maybeSingle(),
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
      { key: "product", label: "", completed: productCount >= 1 },
      { key: "published", label: "", completed: publishedCount >= 1 },
      { key: "store_customized", label: "", completed: hasCustomized },
      { key: "first_order", label: "", completed: orderCount >= 1 },
      { key: "store_launched", label: "", completed: store?.is_active === true },
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
      return { ...m, unlocked: result >= 1, progress: Math.round(result * 100), target: m.key.includes("ten_") ? 10 : m.key.includes("hundred_") ? 100 : m.key.includes("100k") ? 100000 : 1 };
    });

    return { setupProgress, setupItems, milestones, stats };
  });
