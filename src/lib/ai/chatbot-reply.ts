import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const Schema = z.object({
  storeSlug: z.string().min(1).max(100),
  storeOwnerId: z.string().uuid(),
  knowledgeBase: z.string().max(8000).default(""),
  storeName: z.string().max(200).default(""),
  model: z.string().min(1).max(100).default("google/gemini-2.5-flash"),
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

    // Public endpoint: deduct from store owner using service role
    const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (SUPABASE_URL && SERVICE_KEY) {
      const admin = createClient(SUPABASE_URL, SERVICE_KEY);
      const { data: profile } = await admin
        .from("profiles")
        .select("credits, plan")
        .eq("id", data.storeOwnerId)
        .maybeSingle();
      const isUnlimited = profile?.plan === "business";
      if (!isUnlimited) {
        if (!profile || (profile.credits ?? 0) < 1) {
          return { reply: "عذراً، خدمة المساعد غير متاحة حالياً. يرجى التواصل مع المتجر مباشرة." };
        }
        await admin
          .from("profiles")
          .update({ credits: (profile.credits ?? 0) - 1 })
          .eq("id", data.storeOwnerId);
        await admin.from("credit_transactions").insert({
          user_id: data.storeOwnerId,
          amount: -1,
          reason: "chatbot_reply",
          metadata: { store_slug: data.storeSlug },
        });
      } else {
        await admin.from("credit_transactions").insert({
          user_id: data.storeOwnerId,
          amount: 0,
          reason: "chatbot_reply",
          metadata: { store_slug: data.storeSlug, unlimited: true },
        });
      }
    }

    const system = `You are a friendly customer support assistant for the online store "${data.storeName || data.storeSlug}". Answer questions concisely and helpfully. Use the following store knowledge when relevant:\n\n${data.knowledgeBase || "(no extra knowledge provided)"}\n\nIf you don't know an answer, say so politely and suggest contacting the store.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: data.model,
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
