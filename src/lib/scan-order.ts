const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

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

function compressImage(file: File): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const MAX = 1024;
      let w = img.width;
      let h = img.height;
      if (w > MAX || h > MAX) {
        const ratio = Math.min(MAX / w, MAX / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      canvas.width = w;
      canvas.height = h;
      ctx?.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve({ base64, mediaType: "image/jpeg" });
    };

    img.onerror = () => reject(new Error("Failed to load image for compression"));

    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function scanOrderWithGemini(
  base64: string,
  mediaType: string,
): Promise<ScannedData> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const res = await fetch(url, {
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
    const errBody = await res.text().catch(() => "unknown");
    console.error("[scan-order] API error:", res.status, errBody);
    throw new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await res.json();
  console.log("[scan-order] Gemini response:", data);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) {
    console.error("[scan-order] No text in response:", JSON.stringify(data).slice(0, 500));
    throw new Error("Gemini returned no text. The image may be unclear.");
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("[scan-order] No JSON found in:", text.slice(0, 300));
    throw new Error("Could not parse order data from image");
  }

  try {
    return JSON.parse(jsonMatch[0]) as ScannedData;
  } catch (e) {
    console.error("[scan-order] JSON parse error:", e, jsonMatch[0].slice(0, 300));
    throw new Error("Invalid order data format");
  }
}

export { compressImage };
