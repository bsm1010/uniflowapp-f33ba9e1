import { supabase } from "@/integrations/supabase/client";

type EmailType =
  | "welcome_merchant"
  | "new_order_merchant"
  | "order_confirmation"
  | "weekly_summary";

type EmailData = {
  welcome_merchant: { merchantName: string; email: string };
  new_order_merchant: {
    merchantName: string;
    merchantEmail: string;
    customerName: string;
    orderTotal: number;
    orderNumber: string;
    ordersUrl: string;
  };
  order_confirmation: {
    customerName: string;
    customerEmail: string;
    storeName: string;
    orderNumber: string;
    items: Array<{ name: string; qty: number; price: number }>;
    total: number;
    deliveryWilaya: string;
  };
  weekly_summary: {
    merchantName: string;
    merchantEmail: string;
    weekOrders: number;
    weekRevenue: number;
    topProduct: string;
    newCustomers: number;
  };
};

export async function sendEmail<T extends EmailType>(
  type: T,
  data: EmailData[T],
): Promise<boolean> {
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { type, data },
    });
    if (error) {
      console.error("[brevo] send-email error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[brevo] send-email exception:", err);
    return false;
  }
}
