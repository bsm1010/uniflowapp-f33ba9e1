import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

export const Route = createFileRoute("/api/auth/instagram/media")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async ({ request }) => {
        const auth = request.headers.get("authorization") || "";
        const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
        if (!token) return json({ error: "Missing bearer token" }, 401);

        const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const {
          data: { user },
          error: authError,
        } = await client.auth.getUser(token);
        if (authError || !user) return json({ error: "Invalid token" }, 401);

        const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: conn } = await admin
          .from("instagram_connections")
          .select("access_token, instagram_user_id")
          .eq("user_id", user.id)
          .eq("status", "connected")
          .maybeSingle();

        if (!conn?.access_token) {
          return json({ error: "Instagram not connected" }, 400);
        }

        try {
          const mediaRes = await fetch(
            `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp&access_token=${conn.access_token}&limit=50`,
          );
          const mediaData = await mediaRes.json();

          if (mediaData.error) {
            return json({ error: mediaData.error.message }, 400);
          }

          return json({ data: mediaData.data || [] });
        } catch {
          return json({ error: "Failed to fetch Instagram media" }, 500);
        }
      },
    },
  },
});
