import { createClient } from "@supabase/supabase-js";

/**
 * Server-side helper: consume credits for an authenticated user.
 * Returns { ok: true } on success, { ok: false, reason } when insufficient or unauthorized.
 * Throws only on configuration / network errors.
 */
export async function consumeCreditsServer(opts: {
  accessToken: string;
  amount: number;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true } | { ok: false; reason: "insufficient" | "unauthorized" }> {
  const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const PUBLISHABLE_KEY =
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
    throw new Error("Supabase env not configured for credits");
  }

  const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${opts.accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await client.auth.getUser(opts.accessToken);
  if (userErr || !userData.user) {
    return { ok: false, reason: "unauthorized" };
  }

  const { data, error } = await client.rpc("consume_credits", {
    _amount: opts.amount,
    _reason: opts.reason,
    _metadata: opts.metadata ?? {},
  });

  if (error) {
    if (error.message?.toLowerCase().includes("not authenticated")) {
      return { ok: false, reason: "unauthorized" };
    }
    throw new Error(error.message);
  }

  if (data === false) {
    return { ok: false, reason: "insufficient" };
  }

  return { ok: true };
}

export const INSUFFICIENT_CREDITS_ERROR = "INSUFFICIENT_CREDITS";
