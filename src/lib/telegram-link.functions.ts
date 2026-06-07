import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { randomBytes } from "crypto";

/**
 * Generate a short-lived (15 min) one-time token for linking a Telegram
 * chat to a store. The token is stored on the store row and verified by
 * the Telegram /start webhook. Only the authenticated owner of the store
 * can request a token, preventing notification-hijack via guessable IDs.
 */
export const createTelegramLinkToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => {
    if (!input?.storeId || typeof input.storeId !== "string") {
      throw new Error("storeId is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Verify the caller owns the store (RLS will also enforce this).
    const { data: store, error: ownErr } = await supabase
      .from("stores")
      .select("id, owner_id")
      .eq("id", data.storeId)
      .maybeSingle();
    if (ownErr || !store || store.owner_id !== userId) {
      throw new Error("Store not found or not owned by current user");
    }

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: updErr } = await supabase
      .from("stores")
      .update({
        telegram_link_token: token,
        telegram_link_token_expires_at: expiresAt,
      })
      .eq("id", data.storeId);

    if (updErr) {
      throw new Error("Could not generate link token");
    }

    return { token, expiresAt };
  });

/**
 * Read whether a store currently has Telegram connected. Returns only a
 * boolean — the chat id is server-only.
 */
export const getTelegramStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => {
    if (!input?.storeId || typeof input.storeId !== "string") {
      throw new Error("storeId is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("owner_id, telegram_chat_id")
      .eq("id", data.storeId)
      .maybeSingle();
    if (!store || store.owner_id !== userId) {
      throw new Error("Store not found or not owned by current user");
    }
    return { connected: !!store.telegram_chat_id };
  });

/**
 * Disconnect Telegram by clearing telegram_chat_id on the owner's store.
 */
export const disconnectTelegram = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { storeId: string }) => {
    if (!input?.storeId || typeof input.storeId !== "string") {
      throw new Error("storeId is required");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { data: store } = await supabaseAdmin
      .from("stores")
      .select("owner_id")
      .eq("id", data.storeId)
      .maybeSingle();
    if (!store || store.owner_id !== userId) {
      throw new Error("Store not found or not owned by current user");
    }
    const { error } = await supabaseAdmin
      .from("stores")
      .update({ telegram_chat_id: null })
      .eq("id", data.storeId);
    if (error) throw new Error("Failed to disconnect Telegram");
    return { ok: true };
  });
