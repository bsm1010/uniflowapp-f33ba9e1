import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ReplySchema = z.object({
  conversationId: z.string().uuid(),
  customerMessage: z.string().min(1).max(5000),
});

export const generateAIReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReplySchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    // Fetch AI settings
    const { data: settings } = await supabase
      .from("ai_agent_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    // Fetch conversation history (last 20 messages)
    const { data: history } = await supabase
      .from("ig_messages")
      .select("sender_type, content, is_ai_generated")
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: false })
      .limit(20);

    const reversedHistory = (history ?? []).reverse();

    // Fetch store products for context
    const { data: products } = await supabase
      .from("products")
      .select("name, price, stock, category, description")
      .eq("user_id", userId)
      .limit(50);

    // Fetch store settings
    const { data: storeSettings } = await supabase
      .from("store_settings")
      .select("store_name, currency, contact_phone")
      .eq("user_id", userId)
      .maybeSingle();

    const personality = settings?.personality ?? "friendly";
    const tone = settings?.tone ?? "casual";
    const darijaLevel = settings?.darija_level ?? "medium";
    const customInstructions = settings?.custom_instructions ?? "";
    const faqEntries = (settings?.faq_entries as any[]) ?? [];
    const forbiddenWords = settings?.forbidden_words ?? [];
    const storeName = storeSettings?.store_name ?? "Our Store";
    const currency = storeSettings?.currency ?? "DZD";

    const productList = (products ?? [])
      .map((p) => `- ${p.name}: ${p.price} ${currency} (stock: ${p.stock}) [${p.category ?? "general"}]`)
      .join("\n");

    const faqText = faqEntries
      .map((f: any) => `Q: ${f.question}\nA: ${f.answer}`)
      .join("\n\n");

    const systemPrompt = `You are a friendly AI sales assistant for "${storeName}".

PERSONALITY: ${personality}, ${tone}
LANGUAGE: You understand and speak Algerian Darija (level: ${darijaLevel}), Arabic, French, English, and Arabizi.
- Arabizi examples: "ch7al" = how much, "wach" = what/is, "3andkom" = do you have, "disponible" = available
- Reply in the SAME language the customer uses. If they use Darija, reply in Darija.
- Sound natural, human, like a real Algerian seller. Use emojis sparingly (👌, ✅, 🔥).

STORE PRODUCTS:
${productList || "(no products loaded)"}

FAQs:
${faqText || "(no FAQs)"}

${customInstructions ? `CUSTOM INSTRUCTIONS:\n${customInstructions}` : ""}

${forbiddenWords.length ? `NEVER use these words: ${forbiddenWords.join(", ")}` : ""}

RULES:
- Answer product questions with real data (price, stock, availability).
- If you don't know, say so politely and suggest contacting the store.
- If the customer seems angry, frustrated, or the issue is complex (refund, complaint), suggest human takeover by ending with [HUMAN_TAKEOVER].
- Keep replies concise (1-3 sentences max).
- Never invent products or prices that aren't in the product list.`;

    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...reversedHistory.map((m) => ({
        role: (m.sender_type === "customer" ? "user" : "assistant") as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: data.customerMessage },
    ];

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("AI reply error:", res.status, text);
      throw new Error(`AI error ${res.status}`);
    }

    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() ?? "";
    const suggestHumanTakeover = reply.includes("[HUMAN_TAKEOVER]");
    const cleanReply = reply.replace("[HUMAN_TAKEOVER]", "").trim();

    return { reply: cleanReply, suggestHumanTakeover };
  });

export const sendMerchantMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ conversationId: z.string().uuid(), content: z.string().min(1).max(5000) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase.from("ig_messages").insert({
      conversation_id: data.conversationId,
      user_id: userId,
      sender_type: "merchant",
      content: data.content,
      message_type: "text",
      is_ai_generated: false,
    });

    if (error) throw error;

    await supabase
      .from("ig_conversations")
      .update({ last_message_text: data.content, last_message_at: new Date().toISOString() })
      .eq("id", data.conversationId);

    return { ok: true };
  });

export const toggleConversationMode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ conversationId: z.string().uuid(), mode: z.enum(["ai", "human"]) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("ig_conversations")
      .update({ mode: data.mode })
      .eq("id", data.conversationId);
    if (error) throw error;
    return { ok: true };
  });

export const testAIReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ testMessage: z.string().min(1).max(2000) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const { data: settings } = await supabase
      .from("ai_agent_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: products } = await supabase
      .from("products")
      .select("name, price, stock, category")
      .eq("user_id", userId)
      .limit(20);

    const { data: storeSettings } = await supabase
      .from("store_settings")
      .select("store_name, currency")
      .eq("user_id", userId)
      .maybeSingle();

    const productList = (products ?? [])
      .map((p) => `- ${p.name}: ${p.price} ${storeSettings?.currency ?? "DZD"} (stock: ${p.stock})`)
      .join("\n");

    const systemPrompt = `You are a ${settings?.personality ?? "friendly"} AI sales assistant for "${storeSettings?.store_name ?? "Store"}".
Tone: ${settings?.tone ?? "casual"}. Language: auto-detect. You understand Darija, Arabic, French, English, Arabizi.
Products: ${productList || "(none)"}
${settings?.custom_instructions ?? ""}
Keep replies concise.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: data.testMessage },
        ],
      }),
    });

    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const json = await res.json();
    return { reply: json?.choices?.[0]?.message?.content?.trim() ?? "" };
  });
