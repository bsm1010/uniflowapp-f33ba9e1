const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

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

export async function scanOrderWithGemini(
  base64: string,
  mediaType: string,
): Promise<ScannedData> {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: mediaType || "image/jpeg",
                data: base64,
              },
            },
            { text: PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Could not parse order data from image");
  }

  return JSON.parse(jsonMatch[0]) as ScannedData;
}
