import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const StatusEnum = z.enum(["confirmed", "shipped", "delivered", "cancelled"]);

const Schema = z.object({
  orderId: z.string().uuid(),
  status: StatusEnum,
  accessToken: z.string().optional().default(""),
});

function buildMessage(status: z.infer<typeof StatusEnum>, shortId: string) {
  switch (status) {
    case "confirmed":
      return `Votre commande #${shortId} a été confirmée! Merci pour votre achat sur Fennecly.`;
    case "shipped":
      return `Votre commande #${shortId} est en route! Livraison estimée sous 2-3 jours.`;
    case "delivered":
      return `Votre commande #${shortId} a été livrée! Merci de faire confiance à Fennecly.`;
    case "cancelled":
      return `Votre commande #${shortId} a été annulée. Contactez le vendeur pour plus d'informations.`;
  }
}

function normalizePhone(raw: string): string | null {
  const digits = (raw || "").replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) return digits.slice(1);
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return "213" + digits.slice(1); // Algeria default
  return digits;
}

export const sendOrderStatusSms = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        console.error("SMS: backend auth env vars missing");
        return { sent: false, reason: "backend_not_configured" };
      }

      const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
        auth: {
          storage: undefined,
          persistSession: false,
          autoRefreshToken: false,
        },
      });

      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(data.accessToken);
      const userId = claimsData?.claims?.sub;
      if (claimsError || !userId) {
        console.error("SMS: invalid auth token", claimsError?.message);
        return { sent: false, reason: "unauthorized" };
      }

      const { data: order, error } = await supabase
        .from("orders")
        .select("id, shipping_address, store_owner_id")
        .eq("id", data.orderId)
        .maybeSingle();

      if (error || !order) {
        console.error("SMS: order lookup failed", error?.message);
        return { sent: false, reason: "order_not_found" };
      }
      if (order.store_owner_id !== userId) {
        return { sent: false, reason: "not_authorized" };
      }

      const phone = normalizePhone(order.shipping_address);
      if (!phone) return { sent: false, reason: "no_phone" };

      const baseUrl = process.env.INFOBIP_BASE_URL;
      const apiKey = process.env.INFOBIP_API_KEY;
      const sender = process.env.INFOBIP_SENDER;
      if (!baseUrl || !apiKey || !sender) {
        console.error("SMS: Infobip env vars missing");
        return { sent: false, reason: "not_configured" };
      }

      const shortId = order.id.slice(0, 8).toUpperCase();
      const text = buildMessage(data.status, shortId);

      const url = `https://${baseUrl.replace(/^https?:\/\//, "")}/sms/2/text/advanced`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `App ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          messages: [
            { from: sender, destinations: [{ to: phone }], text },
          ],
        }),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("Infobip SMS failed", res.status, body);
        return { sent: false, reason: `http_${res.status}` };
      }

      return { sent: true };
    } catch (err) {
      console.error("SMS handler error:", err instanceof Error ? err.message : err);
      return { sent: false, reason: "exception" };
    }
  });
