import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { consumeCreditsServer, INSUFFICIENT_CREDITS_ERROR } from "@/lib/credits/consume-server";

const Schema = z.object({
  productName: z.string().min(1).max(200),
  productDescription: z.string().max(2000).optional().default(""),
  audience: z.string().max(300).optional().default(""),
  platform: z.enum(["facebook", "instagram", "tiktok", "google"]).default("facebook"),
  tone: z.enum(["urgent", "playful", "luxury", "professional"]).default("urgent"),
  accessToken: z.string().min(1),
});

export const generateAd = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const credit = await consumeCreditsServer({
      accessToken: data.accessToken,
      amount: 3,
      reason: "ai_ad_generator",
    });
    if (!credit.ok) {
      throw new Error(
        credit.reason === "insufficient" ? INSUFFICIENT_CREDITS_ERROR : "Unauthorized",
      );
    }

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
              "You write high-converting e-commerce ads. Return JSON with keys: headline (max 60 chars), primary_text (max 220 chars), description (max 90 chars), cta (2-4 words), hashtags (array of 5 strings without #). No markdown, only valid JSON.",
          },
          {
            role: "user",
            content: `Platform: ${data.platform}\nTone: ${data.tone}\nProduct: ${data.productName}\nDescription: ${data.productDescription}\nAudience: ${data.audience}\nWrite the ad as JSON now.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI error ${res.status}: ${text}`);
    }
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content?.trim() ?? "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
    let ad: {
      headline: string;
      primary_text: string;
      description: string;
      cta: string;
      hashtags: string[];
    };
    try {
      ad = JSON.parse(cleaned);
    } catch {
      ad = {
        headline: data.productName,
        primary_text: cleaned,
        description: "",
        cta: "Shop Now",
        hashtags: [],
      };
    }
    return { ad };
  });
