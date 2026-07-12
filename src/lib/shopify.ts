import { supabase } from "@/integrations/supabase/client";

const SHOPIFY_API_VERSION = "2024-10";

export type ShopifyConnection = {
  id: string;
  user_id: string;
  store_id: string;
  shop_domain: string;
  access_token: string;
  shop_name: string | null;
  is_active: boolean;
  sync_products: boolean;
  sync_orders: boolean;
  last_sync_at: string | null;
  created_at: string;
};

export type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string | null;
  product_type: string | null;
  status: "active" | "draft" | "archived";
  images: Array<{ id: number; src: string; alt: string | null; width: number; height: number }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    compare_at_price: string | null;
    sku: string | null;
    inventory_quantity: number;
    inventory_management: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>;
  options: Array<{ id: number; name: string; values: string[] }>;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type ShopifyOrder = {
  id: number;
  order_number: number;
  name: string;
  email: string | null;
  phone: string | null;
  total_price: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string | null;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
    variant_id: number;
    product_id: number;
  }>;
  shipping_address: {
    name: string;
    address1: string;
    city: string;
    province: string | null;
    zip: string | null;
    country: string;
    phone: string | null;
  } | null;
  customer: {
    id: number;
    email: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
  created_at: string;
  updated_at: string;
  note: string | null;
  tags: string[];
};

async function getShopifyConnection(): Promise<ShopifyConnection | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("shopify_connections" as any)
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  return data as unknown as ShopifyConnection | null;
}

async function shopifyFetch<T>(
  domain: string,
  accessToken: string,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `https://${domain}/admin/api/${SHOPIFY_API_VERSION}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function shopifyGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  const conn = await getShopifyConnection();
  if (!conn) throw new Error("Not connected to Shopify");

  const query = new URLSearchParams(params).toString();
  const fullPath = query ? `${path}?${query}` : path;
  return shopifyFetch<T>(conn.shop_domain, conn.access_token, fullPath);
}

export async function shopifyPost<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const conn = await getShopifyConnection();
  if (!conn) throw new Error("Not connected to Shopify");

  return shopifyFetch<T>(conn.shop_domain, conn.access_token, path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function shopifyPut<T>(
  path: string,
  body: unknown,
): Promise<T> {
  const conn = await getShopifyConnection();
  if (!conn) throw new Error("Not connected to Shopify");

  return shopifyFetch<T>(conn.shop_domain, conn.access_token, path, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function shopifyDelete(path: string): Promise<void> {
  const conn = await getShopifyConnection();
  if (!conn) throw new Error("Not connected to Shopify");

  await shopifyFetch(conn.shop_domain, conn.access_token, path, {
    method: "DELETE",
  });
}

export async function testShopifyConnection(
  domain: string,
  accessToken: string,
): Promise<{ ok: boolean; shopName?: string; error?: string }> {
  try {
    const res = await fetch(
      `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/shop.json`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, shopName: data.shop?.name };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function fetchAllShopifyProducts(): Promise<ShopifyProduct[]> {
  const products: ShopifyProduct[] = [];
  let pageInfo: string | null = null;

  const conn = await getShopifyConnection();
  if (!conn) return [];

  let path = `/products.json?limit=250`;
  let hasMore = true;

  while (hasMore) {
    const url = `https://${conn.shop_domain}/admin/api/${SHOPIFY_API_VERSION}${path}`;
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": conn.access_token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) break;

    const data = await res.json();
    products.push(...(data.products || []));

    const linkHeader = res.headers.get("Link");
    if (linkHeader) {
      const match = linkHeader.match(/<[^?]+\?(page_info=[^>]+)>; rel="next"/);
      if (match) {
        path = `/products.json?limit=250&${match[1]}`;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return products;
}

export async function fetchAllShopifyOrders(): Promise<ShopifyOrder[]> {
  const orders: ShopifyOrder[] = [];
  const conn = await getShopifyConnection();
  if (!conn) return [];

  let path = `/orders.json?limit=250&status=any`;
  let hasMore = true;

  while (hasMore) {
    const url = `https://${conn.shop_domain}/admin/api/${SHOPIFY_API_VERSION}${path}`;
    const res = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": conn.access_token,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) break;

    const data = await res.json();
    orders.push(...(data.orders || []));

    const linkHeader = res.headers.get("Link");
    if (linkHeader) {
      const match = linkHeader.match(/<[^?]+\?(page_info=[^>]+)>; rel="next"/);
      if (match) {
        path = `/orders.json?limit=250&status=any&${match[1]}`;
      } else {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return orders;
}

export async function createShopifyProduct(
  product: Partial<ShopifyProduct>,
): Promise<ShopifyProduct> {
  const result = await shopifyPost<{ product: ShopifyProduct }>(
    "/products.json",
    { product },
  );
  return result.product;
}

export async function updateShopifyProduct(
  productId: number,
  product: Partial<ShopifyProduct>,
): Promise<ShopifyProduct> {
  const result = await shopifyPut<{ product: ShopifyProduct }>(
    `/products/${productId}.json`,
    { product },
  );
  return result.product;
}

export async function createShopifyOrder(
  order: Record<string, unknown>,
): Promise<{ order: { id: number; order_number: number } }> {
  return shopifyPost("/orders.json", { order });
}

export async function updateShopifyOrderFulfillment(
  orderId: number,
  trackingCompany: string,
  trackingNumber: string,
): Promise<void> {
  await shopifyPost(`/orders/${orderId}/fulfillments.json`, {
    fulfillment: {
      tracking_company: trackingCompany,
      tracking_number: trackingNumber,
      notify_customer: true,
    },
  });
}
