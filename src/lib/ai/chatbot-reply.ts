import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  storeSlug: z.string().min(1).max(100),
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
