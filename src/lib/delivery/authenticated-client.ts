import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function createAuthenticatedDeliveryClient(accessToken: string): Promise<
  | {
      client: ReturnType<typeof createClient<Database>>;
      userId: string;
    }
  | {
      error: string;
    }
> {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
    throw new Error("Backend auth environment is not configured.");
  }

  const token = accessToken.trim();
  if (!token) {
    return { error: "Unauthorized" };
  }

  const client = createClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) {
    return { error: "Unauthorized" };
  }

  return {
    client,
    userId: data.user.id,
  };
}
