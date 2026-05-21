const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

/**
 * Send a Telegram message to a chat ID
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<void> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML",
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Telegram sendMessage failed:", err);
    }
  } catch (err) {
    console.error("Telegram sendMessage error:", err);
  }
}

/**
 * Build a new order notification message
 */
export function buildOrderMessage(order: {
  id: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  shipping_city: string;
  shipping_country: string;
  delivery_type: string;
}): string {
  const ref = order.id.substring(0, 8).toUpperCase();
  const statusEmoji: Record<string, string> = {
    pending: "🟡",
    confirmed: "🔵",
    shipped: "🚚",
    delivered: "✅",
    cancelled: "❌",
  };
  const emoji = statusEmoji[order.status] ?? "📦";

  return `
🛒 <b>New Order Received!</b>

📋 <b>Order:</b> #${ref}
👤 <b>Customer:</b> ${order.customer_name}
📧 <b>Email:</b> ${order.customer_email}
📍 <b>City:</b> ${order.shipping_city}, ${order.shipping_country}
🚚 <b>Delivery:</b> ${order.delivery_type}
💰 <b>Total:</b> ${order.total.toLocaleString()} DZD
${emoji} <b>Status:</b> ${order.status}

<i>Log in to your Fennecly dashboard to manage this order.</i>
  `.trim();
}
