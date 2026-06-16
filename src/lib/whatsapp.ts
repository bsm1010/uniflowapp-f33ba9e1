/**
 * Format an Algerian phone number for use in wa.me links.
 *
 * Handles common formats: local (0xxx), international (+213), and raw digits.
 * Returns a clean number with country code, ready for WhatsApp URLs.
 *
 * @param phone - Raw phone number input
 * @returns Formatted number without "+" prefix (e.g. "213770123456")
 */
export function formatAlgerianPhone(phone: string): string {
  let digits = phone.replace(/[\s\-.\(\)]/g, "");

  if (digits.startsWith("0")) {
    digits = "213" + digits.slice(1);
  } else if (digits.startsWith("+213")) {
    digits = digits.slice(1);
  } else if (digits.startsWith("213")) {
    // already good
  } else if (digits.length === 9 || digits.length === 10) {
    digits = "213" + digits;
  }

  return digits;
}

/**
 * Build a WhatsApp URL that opens directly to the contact (for calling).
 *
 * @param phone - Customer phone number
 * @returns Full wa.me URL (e.g. "https://wa.me/213770123456")
 */
export function buildWhatsAppCallUrl(phone: string): string {
  const formatted = formatAlgerianPhone(phone);
  return `https://wa.me/${formatted}`;
}

/**
 * Build a WhatsApp URL with a pre-filled message.
 *
 * @param phone - Customer phone number
 * @param message - Message text to pre-fill
 * @returns Full wa.me URL with encoded message param
 */
export function buildWhatsAppMessageUrl(phone: string, message: string): string {
  const formatted = formatAlgerianPhone(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${formatted}?text=${encoded}`;
}

/**
 * Generate a bilingual default order follow-up message (Arabic + French).
 *
 * @param customerName - Customer's name
 * @param orderNumber - Display order number (e.g. "#4821")
 * @returns Bilingual message string
 */
export function buildDefaultOrderMessage(customerName: string, orderNumber: string): string {
  return `مرحباً ${customerName}، نتصل بك بخصوص طلبك رقم #${orderNumber} 🛍️\nBonjour ${customerName}, nous vous contactons concernant votre commande #${orderNumber}`;
}
