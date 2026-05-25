import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

export const Route = createFileRoute("/api/public/hooks/telegram-setup")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        const token = process.env.TELEGRAM_BOT_TOKEN;
        const rawSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
        if (!token || !rawSecret) {
          return new Response(
            "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET",
            { status: 500 },
          );
        }

        // Telegram only accepts [A-Za-z0-9_-]{1,256} in secret_token.
        // Hash to hex so any user-provided secret works.
        const secret = createHash("sha256").update(rawSecret).digest("hex");

        const webhookUrl = `${url.origin}/api/public/hooks/telegram`;
        const res = await fetch(
          `https://api.telegram.org/bot${token}/setWebhook`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: webhookUrl,
              secret_token: secret,
              allowed_updates: ["message"],
              drop_pending_updates: true,
            }),
          },
        );
        const body = await res.text();
        return new Response(
          `setWebhook -> ${webhookUrl}\nstatus ${res.status}\n${body}`,
          {
            status: res.ok ? 200 : 500,
            headers: { "Content-Type": "text/plain" },
          },
        );
      },
    },
  },
});
