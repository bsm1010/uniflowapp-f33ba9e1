import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

export const Route = createFileRoute("/api/public/hooks/telegram")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const rawSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
          if (!rawSecret) {
            console.error("TELEGRAM_WEBHOOK_SECRET not configured");
            return new Response("Server misconfigured", { status: 500 });
          }
          const expectedSecret = createHash("sha256")
            .update(rawSecret)
            .digest("hex");
          const providedSecret = request.headers.get(
            "x-telegram-bot-api-secret-token",
          );
          if (providedSecret !== expectedSecret) {
            return new Response("Unauthorized", { status: 401 });
          }

          const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
          const supabase = createClient(
            process.env.SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
          );

          const body = await request.json();
          const message = body?.message;
          if (!message) return new Response("ok", { status: 200 });

          const text: string = message?.text ?? "";
          const chatId: string = String(message.chat.id);

          if (text.startsWith("/start")) {
            const parts = text.trim().split(/\s+/);
            const linkToken = parts[1];

            if (!linkToken) {
              await sendMessage(
                TELEGRAM_TOKEN,
                chatId,
                "👋 Welcome to Fennecly!\n\nTo connect your store, open your dashboard → Notifications → Settings → Connect Telegram.",
              );
              return new Response("ok", { status: 200 });
            }

            // Look up store by single-use link token (must be unexpired)
            const { data: store, error: lookupErr } = await supabase
              .from("stores")
              .select("id, telegram_link_token_expires_at")
              .eq("telegram_link_token", linkToken)
              .maybeSingle();

            if (lookupErr || !store) {
              await sendMessage(
                TELEGRAM_TOKEN,
                chatId,
                "❌ This connection link is invalid or has already been used. Please generate a new one from your dashboard.",
              );
              return new Response("ok", { status: 200 });
            }

            const expiresAt = store.telegram_link_token_expires_at
              ? new Date(store.telegram_link_token_expires_at as string).getTime()
              : 0;
            if (!expiresAt || expiresAt < Date.now()) {
              await sendMessage(
                TELEGRAM_TOKEN,
                chatId,
                "❌ This connection link has expired. Please generate a new one from your dashboard.",
              );
              return new Response("ok", { status: 200 });
            }

            const { error: updErr } = await supabase
              .from("stores")
              .update({
                telegram_chat_id: chatId,
                telegram_link_token: null,
                telegram_link_token_expires_at: null,
              })
              .eq("id", store.id);

            if (updErr) {
              console.error("Failed to save telegram_chat_id:", updErr);
              await sendMessage(
                TELEGRAM_TOKEN,
                chatId,
                "❌ Failed to connect your store. Please try again from your dashboard.",
              );
              return new Response("ok", { status: 200 });
            }

            await sendMessage(
              TELEGRAM_TOKEN,
              chatId,
              "✅ Your store is now connected to Telegram!\n\nYou'll receive instant notifications here whenever you get a new order. 🛒",
            );
          }

          return new Response("ok", { status: 200 });
        } catch (err) {
          console.error("Telegram webhook error:", err);
          return new Response("error", { status: 500 });
        }
      },

      GET: async () => new Response("Telegram webhook active", { status: 200 }),
    },
  },
});

async function sendMessage(token: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
