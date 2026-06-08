import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";

/**
 * Admin-only supply marketplace server functions.
 * These run with service_role (bypasses RLS).
 */

// ------------------------------------------------------------
// Admin: list all supply marketplace products
// ------------------------------------------------------------
const ListSupplyProductsInput = z.object({
  category: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export const listSupplyProducts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListSupplyProductsInput.parse(input))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("supply_marketplace_products")
      .select(
        "id, name, description, images, price, suggested_price, category, " +
          "stock, supplier_name, status, created_by, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (data.category) q = q.eq("category", data.category);
    if (data.status) q = q.eq("status", data.status);
    if (data.search) {
      q = q.or(`name.ilike.%${data.search}%,description.ilike.%${data.search}%`);
    }

    const { data: products, error } = await q;
    if (error) throw new Error(error.message);
    return { products: products ?? [] };
  });

// ------------------------------------------------------------
// Admin: create a supply marketplace product
// ------------------------------------------------------------
const CreateSupplyProductInput = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  images: z.array(z.string().url()).max(10).optional().default([]),
  price: z.number().min(0),
  suggested_price: z.number().min(0),
  category: z.string().trim().max(60).optional(),
  stock: z.number().int().min(0).optional().default(0),
  supplier_name: z.string().trim().max(200).optional(),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  created_by: z.string().uuid(),
});

export const createSupplyProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateSupplyProductInput.parse(input))
  .handler(async ({ data }) => {
    const { data: product, error } = await supabaseAdmin
      .from("supply_marketplace_products")
      .insert({
        name: data.name,
        description: data.description,
        images: data.images,
        price: data.price,
        suggested_price: data.suggested_price,
        category: data.category,
        stock: data.stock,
        supplier_name: data.supplier_name,
        status: data.status,
        created_by: data.created_by,
      })
      .select(
        "id, name, description, images, price, suggested_price, category, " +
          "stock, supplier_name, status, created_by, created_at, updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return { product };
  });

// ------------------------------------------------------------
// Admin: update a supply marketplace product
// ------------------------------------------------------------
const UpdateSupplyProductInput = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  images: z.array(z.string().url()).max(10).optional(),
  price: z.number().min(0).optional(),
  suggested_price: z.number().min(0).optional(),
  category: z.string().trim().max(60).optional().nullable(),
  stock: z.number().int().min(0).optional(),
  supplier_name: z.string().trim().max(200).optional().nullable(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const updateSupplyProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => UpdateSupplyProductInput.parse(input))
  .handler(async ({ data }) => {
    const { id, ...patch } = data;
    // Remove undefined keys so we don't overwrite with undefined
    const cleanPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) cleanPatch[k] = v;
    }
    if (Object.keys(cleanPatch).length === 0) {
      throw new Error("Nothing to update");
    }

    const { data: product, error } = await supabaseAdmin
      .from("supply_marketplace_products")
      .update(cleanPatch as Database["public"]["Tables"]["supply_marketplace_products"]["Update"])
      .eq("id", id)
      .select(
        "id, name, description, images, price, suggested_price, category, " +
          "stock, supplier_name, status, created_by, created_at, updated_at",
      )
      .single();
    if (error) throw new Error(error.message);
    return { product };
  });

// ------------------------------------------------------------
// Admin: delete a supply marketplace product
// ------------------------------------------------------------
const DeleteSupplyProductInput = z.object({
  id: z.string().uuid(),
});

export const deleteSupplyProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DeleteSupplyProductInput.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("supply_marketplace_products")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------------------------------------------------------
// Admin: list supply orders
// ------------------------------------------------------------
const ListSupplyOrdersInput = z.object({
  status: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
  offset: z.number().int().min(0).optional().default(0),
});

export const listSupplyOrders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ListSupplyOrdersInput.parse(input))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("supply_orders")
      .select(
        "id, user_id, store_id, supply_product_id, quantity, unit_price, " +
          "total_price, status, created_at, updated_at, " +
          "supply_product:supply_marketplace_products!supply_orders_supply_product_id_fkey" +
          "(id, name, images, category), " +
          "buyer:profiles!supply_orders_user_id_fkey(id, name, email)",
      )
      .order("created_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (data.status) q = q.eq("status", data.status);

    const { data: orders, error } = await q;
    if (error) throw new Error(error.message);
    return { orders: orders ?? [] };
  });

// ------------------------------------------------------------
// Admin: update supply order status
// ------------------------------------------------------------
const UpdateSupplyOrderStatusInput = z.object({
  order_id: z.string().uuid(),
  status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
});

const STATUS_LABELS: Record<string, string> = {
  pending: "بانتظار المعالجة",
  processing: "قيد المعالجة",
  shipped: "تم الشحن",
  delivered: "تم التسليم",
  cancelled: "تم الإلغاء",
};

export const updateSupplyOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => UpdateSupplyOrderStatusInput.parse(input))
  .handler(async ({ data }) => {
    // Fetch order before update to get user_id
    const { data: existing } = await supabaseAdmin
      .from("supply_orders")
      .select("user_id, supply_product_id")
      .eq("id", data.order_id)
      .maybeSingle();

    const { data: order, error } = await supabaseAdmin
      .from("supply_orders")
      .update({ status: data.status })
      .eq("id", data.order_id)
      .select("id, status, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);

    // Notify the user about the status change
    if (existing?.user_id) {
      try {
        const statusLabel = STATUS_LABELS[data.status] ?? data.status;
        await supabaseAdmin.from("notifications").insert({
          user_id: existing.user_id,
          title: "تحديث حالة طلبية التوريد",
          message: `تم تحديث حالة طلبتك إلى "${statusLabel}".`,
          type: data.status === "delivered" ? "success" : data.status === "cancelled" ? "error" : "info",
        });
      } catch {
        // Non-critical
      }
    }

    return { order };
  });

// ------------------------------------------------------------
// User: buy a supply product (deducts wallet, creates order)
// ------------------------------------------------------------
const BuySupplyProductInput = z.object({
  user_id: z.string().uuid(),
  supply_product_id: z.string().uuid(),
  quantity: z.number().int().min(1).optional().default(1),
  store_id: z.string().uuid().optional(),
});

export const buySupplyProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BuySupplyProductInput.parse(input))
  .handler(async ({ data }) => {
    const qty = data.quantity;

    // Fetch the product
    const { data: product, error: pErr } = await supabaseAdmin
      .from("supply_marketplace_products")
      .select("id, name, price, stock, status")
      .eq("id", data.supply_product_id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!product) throw new Error("المنتج غير موجود");
    if (product.status !== "active") throw new Error("المنتج غير متاح حالياً");
    if (product.stock < qty) throw new Error("الكمية المطلوبة غير متوفرة");

    const total = Number(product.price) * qty;

    // Fetch wallet
    const { data: wallet, error: wErr } = await supabaseAdmin
      .from("reseller_wallet")
      .select("id, balance")
      .eq("reseller_id", data.user_id)
      .maybeSingle();
    if (wErr) throw new Error(wErr.message);
    if (!wallet || Number(wallet.balance) < total) {
      throw new Error("رصيدك غير كافٍ، يرجى شحن المحفظة");
    }

    const newBalance = Number(wallet.balance) - total;

    // Deduct wallet
    const { error: upErr } = await supabaseAdmin
      .from("reseller_wallet")
      .update({ balance: newBalance })
      .eq("id", wallet.id);
    if (upErr) throw new Error(upErr.message);

    // Record wallet transaction
    const { error: txErr } = await supabaseAdmin.from("wallet_transactions").insert({
      reseller_id: data.user_id,
      type: "payment",
      amount: -total,
      balance_after: newBalance,
      description: "شراء من سوق التوريد",
    });
    if (txErr) throw new Error(txErr.message);

    // Decrement stock
    await supabaseAdmin
      .from("supply_marketplace_products")
      .update({ stock: product.stock - qty })
      .eq("id", product.id);

    // Create supply order
    const { data: order, error: oErr } = await supabaseAdmin
      .from("supply_orders")
      .insert({
        user_id: data.user_id,
        store_id: data.store_id ?? null,
        supply_product_id: product.id,
        quantity: qty,
        unit_price: Number(product.price),
        total_price: total,
        status: "pending",
      })
      .select("id, status, created_at")
      .single();
    if (oErr) throw new Error(oErr.message);

    // Notify all admins about the new supply purchase
    try {
      const { data: admins } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "marketplace_admin"]);
      if (admins && admins.length > 0) {
        const { data: buyer } = await supabaseAdmin
          .from("profiles")
          .select("name, email")
          .eq("id", data.user_id)
          .maybeSingle();
        const buyerName = buyer?.name ?? buyer?.email ?? "مستخدم";
        const notifRows = admins.map((a) => ({
          user_id: a.user_id,
          title: "طلبية توريد جديدة",
          message: `${buyerName} اشترى ${qty}x ${product.name} بقيمة ${total.toLocaleString("fr-DZ")} DA`,
          type: "info" as const,
        }));
        await supabaseAdmin.from("notifications").insert(notifRows);
      }
    } catch {
      // Non-critical — don't fail the purchase if notification fails
    }

    // Notify the buyer about their purchase
    try {
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id,
        title: "تم استلام طلبية التوريد",
        message: `طلبك "${product.name}" (${qty}x) بقيمة ${total.toLocaleString("fr-DZ")} DA قيد المعالجة.`,
        type: "success" as const,
      });
    } catch {
      // Non-critical
    }

    return { order };
  });
