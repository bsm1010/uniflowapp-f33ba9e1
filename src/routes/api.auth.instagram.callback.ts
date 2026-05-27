import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || process.env.VITE_INSTAGRAM_CLIENT_ID;
const CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;

const redirect = (to: string) =>
  new Response(null, { status: 302, headers: { Location: to } });

export const Route = createFileRoute("/api/auth/instagram/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) return redirect("/dashboard/products?instagram=error");
        if (!code || !state) return redirect("/dashboard/products?instagram=error");

        if (!CLIENT_ID || !CLIENT_SECRET || !SERVICE_KEY) {
          return redirect("/dashboard/products?instagram=missing_config");
        }

        let accessToken: string;
        try {
          accessToken = atob(state);
        } catch {
          return redirect("/dashboard/products?instagram=error");
        }

        const userClient = createClient(SUPABASE_URL, SUPABASE_ANON, {
          global: { headers: { Authorization: `Bearer ${accessToken}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: { user }, error: authError } = await userClient.auth.getUser(accessToken);
        if (authError || !user) return redirect("/login");

        const redirectUri = `${url.origin}/api/auth/instagram/callback`;
        const redirectTo = `${url.origin}/dashboard/products`;

        try {
          const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: CLIENT_ID,
              client_secret: CLIENT_SECRET,
              grant_type: "authorization_code",
              redirect_uri: redirectUri,
              code,
            }),
          });
          const tokenData = await tokenRes.json();
          if (!tokenData.access_token) return redirect(`${redirectTo}?instagram=token_error`);

          const longLivedRes = await fetch(
            `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${CLIENT_SECRET}&access_token=${tokenData.access_token}`,
          );
          const longLived = await longLivedRes.json();
          const finalToken = longLived.access_token || tokenData.access_token;
          const expiresAt = longLived.expires_in
            ? new Date(Date.now() + longLived.expires_in * 1000).toISOString()
            : null;

          const profileRes = await fetch(
            `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${finalToken}`,
          );
          const profile = await profileRes.json();

          const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          });
          await admin.from("instagram_connections").upsert({
            user_id: user.id,
            instagram_user_id: profile.id,
            instagram_username: profile.username,
            access_token: finalToken,
            token_expires_at: expiresAt,
            status: "connected",
            last_synced_at: new Date().toISOString(),
          }, { onConflict: "user_id" });

          return redirect(`${redirectTo}?instagram=connected`);
        } catch {
          return redirect(`${redirectTo}?instagram=error`);
        }
      },
    },
  },
});
