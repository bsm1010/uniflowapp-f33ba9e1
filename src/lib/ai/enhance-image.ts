import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { consumeCreditsServer, INSUFFICIENT_CREDITS_ERROR } from "@/lib/credits/consume-server";

const Schema = z.object({
  imageBase64: z.string().min(20), // data:image/...;base64,...
  prompt: z.string().max(500).optional().default(""),
  preset: z.enum(["studio", "lifestyle", "white-bg", "enhance"]).default("enhance"),
  accessToken: z.string().min(1),
});

const PRESET_PROMPTS: Record<string, string> = {
  studio:
    "Transform this product photo into a professional studio shot with soft diffused lighting, clean shadows, and a neutral gradient background. Keep the product identical.",
  lifestyle:
    "Place this product in a tasteful real-life lifestyle scene with natural lighting and shallow depth of field. Keep the product identical.",
  "white-bg":
    "Remove the background completely and place the product on a pure white background suitable for e-commerce listings. Keep the product identical, add a subtle natural shadow.",
  enhance:
    "Enhance this product photo: improve lighting, sharpness, color accuracy, and remove distracting background noise. Keep the product identical.",
};

export const enhanceImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const credit = await consumeCreditsServer({
      accessToken: data.accessToken,
      amount: 5,
      reason: "ai_image_enhancer",
    });
    if (!credit.ok) {
      throw new Error(
        credit.reason === "insufficient" ? INSUFFICIENT_CREDITS_ERROR : "Unauthorized",
      );
    }

    const fullPrompt =
      (PRESET_PROMPTS[data.preset] ?? PRESET_PROMPTS.enhance) +
      (data.prompt ? ` Additional instructions: ${data.prompt}` : "");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: fullPrompt },
              { type: "image_url", image_url: { url: data.imageBase64 } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI error ${res.status}: ${text}`);
    }
    const json = await res.json();
    const images: string[] =
      json?.choices?.[0]?.message?.images?.map((i: any) => i?.image_url?.url).filter(Boolean) ?? [];
    if (images.length === 0) {
      throw new Error("No image returned by the model");
    }
    return { imageUrl: images[0] };
  });
