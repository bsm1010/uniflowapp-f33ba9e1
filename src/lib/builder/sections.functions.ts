import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Schema = z.object({
  blockKey: z.string().min(1).max(100),
  brief: z.string().min(3).max(500),
  brandName: z.string().min(1).max(200),
  defaultProps: z.record(z.string(), z.unknown()),
});

/**
 * Ask Lovable AI Gateway to fill a block's defaultProps with on-brand copy.
 * Returns a new props object the editor can merge into the section instance.
 */
export const generateAISection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const sys = `You write concise, on-brand storefront section copy.
Return STRICT JSON matching the same keys & types as the provided defaults.
Keep strings under 140 chars. Never invent new keys. Never wrap in markdown.`;

    const user = `Brand: ${data.brandName}
Block: ${data.blockKey}
Brief: ${data.brief}
Defaults JSON:
${JSON.stringify(data.defaultProps, null, 2)}

Reply with the filled JSON only.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
      }),
    });

    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content?.trim() ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {};
    }
    // Only keep keys that exist in defaults to keep schema integrity.
    const safe: Record<string, unknown> = {};
    for (const k of Object.keys(data.defaultProps)) {
      if (k in parsed) safe[k] = parsed[k];
    }
    return { propsJson: JSON.stringify(safe) };
  });
