import { createServerFileRoute } from "@tanstack/start/server";

export const ServerRoute = createServerFileRoute(
  "/api/public/hooks/telegram-setup",
).methods({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    if (!key || key !== process.env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!token || !secret) {
      return new Response("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET", { status: 500 });
    }

    const webhookUrl = `${url.origin}/api/public/hooks/telegram`;
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ["message"],
        drop_pending_updates: true,
      }),
    });
    const body = await res.text();
    return new Response(`setWebhook -> ${webhookUrl}\nstatus ${res.status}\n${body}`, {
      status: res.ok ? 200 : 500,
      headers: { "Content-Type": "text/plain" },
    });
  },
});
