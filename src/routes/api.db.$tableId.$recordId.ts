import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

async function getAuthedClient(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7)
    : null;
  if (!token) return { error: json({ error: "Missing bearer token" }, 401) };

  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user)
    return { error: json({ error: "Invalid token" }, 401) };
  return { client, userId: data.user.id };
}

export const Route = createFileRoute("/api/db/$tableId/$recordId")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      GET: async ({ request, params }) => {
        const auth = await getAuthedClient(request);
        if ("error" in auth) return auth.error;

        const { data, error } = await auth.client
          .from("db_records")
          .select("id, data, position, created_at, updated_at, table_id")
          .eq("id", params.recordId)
          .eq("table_id", params.tableId)
          .maybeSingle();

        if (error) return json({ error: error.message }, 400);
        if (!data) return json({ error: "Record not found" }, 404);
        return json({ record: data });
      },

      PATCH: async ({ request, params }) => {
        const auth = await getAuthedClient(request);
        if ("error" in auth) return auth.error;

        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const patch =
          body && typeof body === "object" && body.data ? body.data : body;
        if (!patch || typeof patch !== "object")
          return json({ error: "Body must be an object" }, 400);

        // Merge with existing data
        const { data: existing, error: fetchErr } = await auth.client
          .from("db_records")
          .select("data")
          .eq("id", params.recordId)
          .eq("table_id", params.tableId)
          .maybeSingle();
        if (fetchErr) return json({ error: fetchErr.message }, 400);
        if (!existing) return json({ error: "Record not found" }, 404);

        const merged = { ...(existing.data as object), ...patch };

        const { data, error } = await auth.client
          .from("db_records")
          .update({ data: merged })
          .eq("id", params.recordId)
          .eq("table_id", params.tableId)
          .select()
          .single();

        if (error) return json({ error: error.message }, 400);
        return json({ record: data });
      },

      PUT: async ({ request, params }) => {
        const auth = await getAuthedClient(request);
        if ("error" in auth) return auth.error;

        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }
        const replacement =
          body && typeof body === "object" && body.data ? body.data : body;
        if (!replacement || typeof replacement !== "object")
          return json({ error: "Body must be an object" }, 400);

        const { data, error } = await auth.client
          .from("db_records")
          .update({ data: replacement })
          .eq("id", params.recordId)
          .eq("table_id", params.tableId)
          .select()
          .single();

        if (error) return json({ error: error.message }, 400);
        if (!data) return json({ error: "Record not found" }, 404);
        return json({ record: data });
      },

      DELETE: async ({ request, params }) => {
        const auth = await getAuthedClient(request);
        if ("error" in auth) return auth.error;

        const { error } = await auth.client
          .from("db_records")
          .delete()
          .eq("id", params.recordId)
          .eq("table_id", params.tableId);

        if (error) return json({ error: error.message }, 400);
        return json({ success: true });
      },
    },
  },
});
