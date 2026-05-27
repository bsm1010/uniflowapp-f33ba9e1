import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
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

async function ensureTable(client: any, tableId: string, userId: string) {
  const { data, error } = await client
    .from("db_tables")
    .select("id")
    .eq("id", tableId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

export const Route = createFileRoute("/api/db/$tableId")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),

      GET: async ({ request, params }) => {
        const auth = await getAuthedClient(request);
        if ("error" in auth) return auth.error;
        const { client, userId } = auth;

        if (!(await ensureTable(client, params.tableId, userId)))
          return json({ error: "Table not found" }, 404);

        const url = new URL(request.url);
        const limit = Math.min(
          Number(url.searchParams.get("limit")) || 100,
          1000,
        );
        const offset = Number(url.searchParams.get("offset")) || 0;

        const { data, error } = await client
          .from("db_records")
          .select("id, data, position, created_at, updated_at")
          .eq("table_id", params.tableId)
          .order("position", { ascending: true })
          .range(offset, offset + limit - 1);

        if (error) return json({ error: error.message }, 400);
        return json({ records: data });
      },

      POST: async ({ request, params }) => {
        const auth = await getAuthedClient(request);
        if ("error" in auth) return auth.error;
        const { client, userId } = auth;

        if (!(await ensureTable(client, params.tableId, userId)))
          return json({ error: "Table not found" }, 404);

        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ error: "Invalid JSON body" }, 400);
        }

        const recordData =
          body && typeof body === "object" && body.data ? body.data : body;
        if (!recordData || typeof recordData !== "object")
          return json({ error: "Body must be an object or { data: {...} }" }, 400);

        const { data, error } = await client
          .from("db_records")
          .insert({
            table_id: params.tableId,
            user_id: userId,
            data: recordData,
          })
          .select()
          .single();

        if (error) return json({ error: error.message }, 400);
        return json({ record: data }, 201);
      },
    },
  },
});
