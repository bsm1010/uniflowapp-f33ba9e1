import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Schema = z.object({
  storeSlug: z.string().min(1).max(100),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(30),
});

export const chatbotReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Backend not configured");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Fetch store settings server-side to get trusted storeOwnerId
    const { data: storeSettings } = await admin
      .from("store_settings")
      .select("user_id, store_name")
      .eq("slug", data.storeSlug)
      .maybeSingle();

    if (!storeSettings?.user_id) {
      return { reply: "Store not found." };
    }

    const storeOwnerId = storeSettings.user_id;
    const storeName = storeSettings.store_name ?? data.storeSlug;

    // Fetch chatbot settings server-side to get trusted model
    const { data: chatbotSettings } = await admin
      .from("chatbot_settings")
      .select("ai_model, knowledge_base, enabled")
      .eq("user_id", storeOwnerId)
      .maybeSingle();

    if (chatbotSettings && !chatbotSettings.enabled) {
      return { reply: "Chatbot is not enabled for this store." };
    }

    const model = chatbotSettings?.ai_model || "google/gemini-2.5-flash";
    const knowledgeBase = chatbotSettings?.knowledge_base || "";

    // Deduct credits
    const { data: profile } = await admin
      .from("profiles")
      .select("credits, plan")
      .eq("id", storeOwnerId)
      .maybeSingle();

    const isUnlimited = profile?.plan === "business";
    if (!isUnlimited) {
      if (!profile || (profile.credits ?? 0) < 1) {
        return { reply: "عذراً، خدمة المساعد غير متاحة حالياً. يرجى التواصل مع المتجر مباشرة." };
      }
      await admin
        .from("profiles")
        .update({ credits: (profile.credits ?? 0) - 1 })
        .eq("id", storeOwnerId);
      await admin.from("credit_transactions").insert({
        user_id: storeOwnerId,
        amount: -1,
        reason: "chatbot_reply",
        metadata: { store_slug: data.storeSlug },
      });
    } else {
      await admin.from("credit_transactions").insert({
        user_id: storeOwnerId,
        amount: 0,
        reason: "chatbot_reply",
        metadata: { store_slug: data.storeSlug, unlimited: true },
      });
    }

    const system = `You are a friendly customer support assistant for the online store "${storeName}". Answer questions concisely and helpfully. Use the following store knowledge when relevant:\n\n${knowledgeBase || "(no extra knowledge provided)"}\n\nIf you don't know an answer, say so politely and suggest contacting the store.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI error ${res.status}: ${text}`);
    }
    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() ?? "";
    return { reply };
  });
