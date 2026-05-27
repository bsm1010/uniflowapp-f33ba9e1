import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "noreply@fennecly.online";
const FROM_NAME = "Fennecly";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, confirmation_url, type } = await req.json();

    if (!email || !confirmation_url) {
      return new Response(
        JSON.stringify({ error: "Missing email or confirmation_url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email content based on type
    const isSignup = type === "signup" || !type;
    const subject = isSignup ? "Confirm your Fennecly account" : "Reset your Fennecly password";

    const html = isSignup
      ? `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9f9f9;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">Fennecly</h1>
            </div>
            <h2 style="color: #111; font-size: 22px; margin-bottom: 12px;">Confirm your email address</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
              Thanks for signing up! Click the button below to confirm your email address and activate your account.
            </p>
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${confirmation_url}"
                style="background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
                Confirm Email Address
              </a>
            </div>
            <p style="color: #888; font-size: 13px; text-align: center;">
              If you didn't create an account, you can safely ignore this email.<br/>
              This link expires in 24 hours.
            </p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #f9f9f9;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">Fennecly</h1>
            </div>
            <h2 style="color: #111; font-size: 22px; margin-bottom: 12px;">Reset your password</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-bottom: 28px;">
              Click the button below to reset your password.
            </p>
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${confirmation_url}"
                style="background: #7c3aed; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #888; font-size: 13px; text-align: center;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `;

    // Send via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [email],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(
        JSON.stringify({ error: data }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
