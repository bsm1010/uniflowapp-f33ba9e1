import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  productName: z.string().min(1).max(200),
  keywords: z.string().max(500).optional().default(""),
  tone: z.enum(["professional", "playful", "luxury", "minimal"]).default("professional"),
});

export const generateDescription = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You write concise, persuasive e-commerce product descriptions. Output 2-3 short paragraphs. No markdown.",
          },
          {
            role: "user",
            content: `Product: ${data.productName}\nKeywords: ${data.keywords}\nTone: ${data.tone}\nWrite the description now.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI error ${res.status}: ${text}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content?.trim() ?? "";
    return { description: content };
  });
