import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const SendSchema = z.object({
  campaignId: z.string().uuid(),
  accessToken: z.string().min(1),
});

export const sendCampaign = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SendSchema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!SUPABASE_URL || !SERVICE_KEY)
      throw new Error("Supabase env not configured");

    // Verify the caller
    const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser(data.accessToken);
    if (userErr || !user) throw new Error("Unauthorized");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Load campaign owned by this user
    const { data: campaign, error: cErr } = await admin
      .from("email_campaigns")
      .select("*")
      .eq("id", data.campaignId)
      .eq("user_id", user.id)
      .single();
    if (cErr || !campaign) throw new Error("Campaign not found");
    if (campaign.status === "sent" || campaign.status === "sending") {
      throw new Error("Campaign already processed");
    }

    // Build recipients
    let recipients: string[] = [];
    if (campaign.audience_type === "manual") {
      recipients = (campaign.recipients ?? []).filter(Boolean);
    } else {
      const { data: orders } = await admin
        .from("orders")
        .select("customer_email")
        .eq("store_owner_id", user.id);
      recipients = Array.from(
        new Set(
          (orders ?? [])
            .map((o) => (o.customer_email ?? "").trim().toLowerCase())
            .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)),
        ),
      );
    }

    if (recipients.length === 0) {
      await admin
        .from("email_campaigns")
        .update({
          status: "failed",
          error: "No valid recipients",
          sent_at: new Date().toISOString(),
        })
        .eq("id", campaign.id);
      throw new Error("No valid recipients found");
    }

    await admin
      .from("email_campaigns")
      .update({ status: "sending" })
      .eq("id", campaign.id);

    const htmlBody = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#ffffff;padding:24px;color:#111;line-height:1.6;">
      <div style="max-width:560px;margin:0 auto;">
        ${campaign.message
          .split("\n")
          .map((p: string) => `<p style="margin:0 0 12px 0;">${escapeHtml(p)}</p>`)
          .join("")}
      </div>
    </body></html>`;

    let sent = 0;
    let failed = 0;
    let firstError: string | null = null;

    // Send one email per recipient (no CC/BCC leakage)
    for (const to of recipients) {
      try {
        const res = await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "Your Store <onboarding@resend.dev>",
            to: [to],
            subject: campaign.subject,
            html: htmlBody,
          }),
        });
        if (!res.ok) {
          failed++;
          if (!firstError) firstError = `Resend ${res.status}: ${await res.text()}`;
        } else {
          sent++;
        }
      } catch (e: any) {
        failed++;
        if (!firstError) firstError = e?.message ?? "Unknown error";
      }
    }

    await admin
      .from("email_campaigns")
      .update({
        status: failed === recipients.length ? "failed" : "sent",
        sent_count: sent,
        failed_count: failed,
        error: firstError,
        sent_at: new Date().toISOString(),
        recipients,
      })
      .eq("id", campaign.id);

    return { sent, failed, total: recipients.length };
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
