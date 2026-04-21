import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Schema = z.object({
  imageDataUrl: z.string().min(20).max(8_000_000), // base64 data URL, ~6MB max
  hint: z.string().max(300).optional().default(""),
});

const TOOL = {
  type: "function" as const,
  function: {
    name: "build_landing_page",
    description: "Build a complete Arabic product landing page from the analyzed product image.",
    parameters: {
      type: "object",
      properties: {
        productCategory: { type: "string", description: "Detected product category in Arabic" },
        hero: {
          type: "object",
          properties: {
            title: { type: "string" },
            subtitle: { type: "string" },
            ctaLabel: { type: "string" },
          },
          required: ["title", "subtitle", "ctaLabel"],
          additionalProperties: false,
        },
        product: {
          type: "object",
          properties: {
            name: { type: "string" },
            shortDescription: { type: "string" },
          },
          required: ["name", "shortDescription"],
          additionalProperties: false,
        },
        features: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
            },
            required: ["title", "description"],
            additionalProperties: false,
          },
        },
        benefits: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: { type: "string" },
        },
        testimonials: {
          type: "array",
          minItems: 2,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              quote: { type: "string" },
            },
            required: ["name", "quote"],
            additionalProperties: false,
          },
        },
        faq: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        finalCta: {
          type: "object",
          properties: {
            heading: { type: "string" },
            subheading: { type: "string" },
            buttonLabel: { type: "string" },
          },
          required: ["heading", "subheading", "buttonLabel"],
          additionalProperties: false,
        },
      },
      required: [
        "productCategory",
        "hero",
        "product",
        "features",
        "benefits",
        "testimonials",
        "faq",
        "finalCta",
      ],
      additionalProperties: false,
    },
  },
};

export type LandingPageContent = {
  productCategory: string;
  hero: { title: string; subtitle: string; ctaLabel: string };
  product: { name: string; shortDescription: string };
  features: { title: string; description: string }[];
  benefits: string[];
  testimonials: { name: string; quote: string }[];
  faq: { question: string; answer: string }[];
  finalCta: { heading: string; subheading: string; buttonLabel: string };
};

export const generateLandingPage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }): Promise<{ content: LandingPageContent }> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `أنت كاتب إعلانات محترف متخصص في إنشاء صفحات هبوط (Landing Pages) عربية للمنتجات.
- استخدم لغة تسويقية مقنعة وعاطفية، ليست ترجمة رسمية.
- جمل قصيرة ومؤثرة.
- ركّز على الفوائد والنتائج للعميل، وليس فقط المواصفات.
- اجعل المحتوى واقعي ومخصص للمنتج الظاهر في الصورة.
- أسماء الشهادات يجب أن تكون عربية حقيقية (مثل: أحمد، سارة، محمد، فاطمة، يوسف، نور).
- أعد الإجابة عبر استدعاء الأداة build_landing_page فقط.
- كل النصوص يجب أن تكون باللغة العربية الفصحى السهلة.`;

    const userText = `حلّل صورة المنتج التالية وأنشئ صفحة هبوط عربية كاملة جاهزة للبيع.${
      data.hint ? `\nملاحظة من المستخدم: ${data.hint}` : ""
    }`;

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
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "build_landing_page" } },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("تم تجاوز الحد المسموح. حاول بعد قليل.");
      if (res.status === 402) throw new Error("الرصيد غير كافٍ. يرجى إضافة رصيد.");
      throw new Error(`AI error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const toolCall = json?.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall?.function?.arguments;
    if (!args) throw new Error("لم يتم استلام محتوى من الذكاء الاصطناعي.");

    const content = JSON.parse(args) as LandingPageContent;
    return { content };
  });
