import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Server-side wrapper around Gemini image → order extraction.
 *
 * The Gemini API key never leaves the server. Client code compresses the image
 * to base64 and calls this function; the previous `VITE_GEMINI_API_KEY` (which
 * was bundled into the browser) is intentionally NOT used here.
 */

export type ScannedData = {
  customer_name: string | null;
  customer_phone: string | null;
  wilaya: string | null;
  city: string | null;
  address: string | null;
  delivery_type: "domicile" | "stopdesk" | null;
  items: { product_name: string; quantity: number; unit_price: number | null }[];
  notes: string | null;
  confidence: "high" | "medium" | "low";
};

const PROMPT = `You are an order extraction assistant. Analyze this image which is likely a screenshot or photo of a customer order note, chat message, or form. The conversation may be in Arabic, French, or Algerian Darija.

Extract the following order details and return them as a JSON object:
{
  "customer_name": "string or null",
  "customer_phone": "string or null (Algerian phone number)",
  "wilaya": "string or null (Algerian wilaya name, e.g. 'Alger', 'Oran', 'Constantine')",
  "city": "string or null (commune/city name)",
  "address": "string or null (street address)",
  "delivery_type": "domicile" or "stopdesk" or null,
  "items": [
    {
      "product_name": "string",
      "quantity": number,
      "unit_price": number or null
    }
  ],
  "notes": "string or null (any special instructions)",
  "confidence": "high" or "medium" or "low"
}

Rules:
- If the image is unclear or not an order, set confidence to "low" and return empty items.
- For phone numbers, normalize to Algerian format (0xxx xx xx xx).
- For wilaya, match to one of Algeria's 58 wilayas.
- If no price is visible, set unit_price to null.
- If no delivery type is mentioned, default to "domicile".
- Return ONLY the JSON object, no markdown fencing or explanation.`;

export const scanOrderImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { base64: string; mediaType: string }) => {
    if (!input?.base64 || typeof input.base64 !== "string") {
      throw new Error("base64 image payload is required");
    }
    // Guard against abuse: ~10 MB base64 cap.
    if (input.base64.length > 14_000_000) {
      throw new Error("Image too large");
    }
    return { base64: input.base64, mediaType: input.mediaType || "image/jpeg" };
  })
  .handler(async ({ data }): Promise<ScannedData> => {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured (set GEMINI_API_KEY env var).");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    let res: Response | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inline_data: { mime_type: data.mediaType, data: data.base64 } },
                { text: PROMPT },
              ],
            },
          ],
        }),
      });
      if (res.status === 429) {
        const delay = Math.min(1000 * (attempt + 1), 5000);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      const errBody = (await res?.text().catch(() => "unknown")) ?? "unknown";
      throw new Error(`Gemini API error ${res?.status ?? 0}: ${errBody.slice(0, 200)}`);
    }

    const payload = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text) throw new Error("Gemini returned no text. The image may be unclear.");

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Could not parse order data from image");
    try {
      return JSON.parse(jsonMatch[0]) as ScannedData;
    } catch {
      throw new Error("Invalid order data format");
    }
  });
