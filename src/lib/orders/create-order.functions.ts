import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  name: z.string().max(500).optional(),
  image: z.string().max(2000).nullable().optional(),
});

const CreateOrderSchema = z.object({
  storeSlug: z.string().min(1).max(100),
  customerName: z.string().trim().min(1).max(200),
  customerEmail: z.string().trim().min(1).max(300),
  shippingAddress: z.string().trim().min(1).max(500),
  shippingCity: z.string().trim().min(1).max(200),
  shippingWilaya: z.string().trim().min(1).max(200),
  shippingCountry: z.string().trim().min(1).max(100).default("Algeria"),
  deliveryType: z.enum(["domicile", "stopdesk"]).default("domicile"),
  companyId: z.string().uuid().optional(),
  notes: z.string().max(1000).nullable().optional(),
  items: z.array(OrderItemSchema).min(1).max(50),
});

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CreateOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Backend not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Look up store
    const { data: store } = await admin
      .from("store_settings")
      .select("user_id, slug")
      .eq("slug", data.storeSlug)
      .maybeSingle();
    if (!store?.user_id) throw new Error("Store not found");

    const storeOwnerId = store.user_id;

    // 2. Look up actual product prices server-side
    const productIds = data.items.map((i) => i.productId);
    const { data: products, error: prodErr } = await admin
      .from("products")
      .select("id, name, price, images, user_id")
      .in("id", productIds);

    if (prodErr) {
      console.error("Product lookup error:", prodErr);
      throw new Error(`Failed to look up products: ${prodErr.message}`);
    }
    if (!products || products.length === 0) {
      console.error("No products found for IDs:", productIds, "store:", storeOwnerId);
      throw new Error("No products found for this order");
    }
    const wrongStore = products.filter((p) => p.user_id !== storeOwnerId);
    if (wrongStore.length > 0) {
      console.error("Products belong to wrong store:", wrongStore.map((p) => p.id));
      throw new Error("One or more products do not belong to this store");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Verify all items exist and compute server-side totals
    let subtotal = 0;
    const orderItems: Array<{
      product_id: string;
      product_name: string;
      unit_price: number;
      quantity: number;
      image_url: string | null;
    }> = [];

    for (const item of data.items) {
      const product = productMap.get(item.productId);
      if (!product) throw new Error(`Product ${item.productId} not found in this store`);

      const unitPrice = Number(product.price);
      subtotal += unitPrice * item.quantity;
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        unit_price: unitPrice,
        quantity: item.quantity,
        image_url: product.image_url,
      });
    }

    // 3. Look up delivery price server-side
    let deliveryPrice = 0;
    if (data.shippingWilaya) {
      const tariffQuery = admin
        .from("delivery_tariffs")
        .select("price, city")
        .eq("store_id", storeOwnerId)
        .eq("wilaya", data.shippingWilaya)
        .eq("delivery_type", data.deliveryType);

      if (data.companyId) {
        tariffQuery.eq("company_id", data.companyId);
      }

      const { data: tariffRows } = await tariffQuery;

      if (tariffRows && tariffRows.length > 0) {
        const cityNorm = (data.shippingCity ?? "").trim().toLowerCase();
        const exact = cityNorm
          ? tariffRows.find((r) => (r.city ?? "").trim().toLowerCase() === cityNorm)
          : null;
        const wilayaDefault = tariffRows.find((r) => !r.city || r.city.trim() === "");
        const chosen = exact ?? wilayaDefault ?? tariffRows[0];
        deliveryPrice = chosen ? Number(chosen.price) : 0;
      }
    }

    const total = subtotal + deliveryPrice;

    // 4. Insert order
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        store_owner_id: storeOwnerId,
        store_slug: store.slug,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        shipping_address: data.shippingAddress,
        shipping_city: data.shippingCity,
        shipping_postal_code: data.shippingWilaya,
        shipping_country: data.shippingCountry,
        notes: data.notes || null,
        subtotal,
        total,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderErr || !order) throw new Error(orderErr?.message ?? "Failed to create order");

    // 5. Insert order items
    const { error: itemsErr } = await admin.from("order_items").insert(
      orderItems.map((item) => ({
        order_id: order.id,
        ...item,
      })),
    );
    if (itemsErr) throw new Error(itemsErr.message);

    // 6. Create shipment (best-effort)
    if (data.companyId) {
      await admin.from("shipments").insert({
        store_id: storeOwnerId,
        order_id: order.id,
        company_id: data.companyId,
        status: "pending",
      });
    }

    return { orderId: order.id, subtotal, deliveryPrice, total };
  });
