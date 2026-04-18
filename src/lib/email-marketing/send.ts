import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const SendSchema = z.object({
  campaignId: z.string().uuid(),
});

export const sendCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SendSchema.parse(input))
  .handler(async ({ data, context }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { userId } = context;
    const admin = supabaseAdmin;

    // Load campaign owned by this user
    const { data: campaign, error: cErr } = await admin
      .from("email_campaigns")
      .select("*")
      .eq("id", data.campaignId)
      .eq("user_id", userId)
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
        .eq("store_owner_id", userId);
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
