import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { consumeCreditsServer, INSUFFICIENT_CREDITS_ERROR } from "@/lib/credits/consume-server";

const Schema = z.object({
  imageDataUrl: z.string().min(20).max(8_000_000), // base64 data URL, ~6MB max
  hint: z.string().max(300).optional().default(""),
  accessToken: z.string().min(1),
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

    const credit = await consumeCreditsServer({
      accessToken: data.accessToken,
      amount: 5,
      reason: "ai_landing_page",
    });
    if (!credit.ok) {
      throw new Error(credit.reason === "insufficient" ? INSUFFICIENT_CREDITS_ERROR : "Unauthorized");
    }

    const systemPrompt = `أنت كاتب إعلانات (Copywriter) محترف لأكبر متاجر التجارة الإلكترونية العربية مثل نمشي، نون، وجولي شيك. مهمتك إنشاء صفحة هبوط عربية تبيع فعلاً.

قواعد الكتابة الإلزامية:
- حلّل صورة المنتج بدقة: نوعه، فئته، الجمهور المستهدف، ومناسبات استخدامه.
- إذا كانت الصورة غير واضحة أو غامضة، خذ افتراضاً ذكياً منطقياً (مثل: لون، فئة سعرية، استخدام شائع) واستمر بثقة دون ذكر أنك "افترضت".
- اكتب بلهجة عربية عصرية وبسيطة، قريبة من القارئ، وليست فصحى رسمية أو ترجمة آلية.
- استخدم جمل قصيرة، إيقاع سريع، وكلمات قوية تحرّك المشاعر (مثل: "تخيّل"، "الآن"، "أخيراً"، "بدون عناء").
- ركّز على النتيجة والشعور الذي سيحصل عليه العميل، وليس على المواصفات التقنية فقط.
- ادمج عناصر إقناع مثبتة: الندرة، الإثبات الاجتماعي، حل مشكلة، تحويل الاعتراضات.
- أسماء الشهادات يجب أن تكون عربية حقيقية ومتنوعة (أحمد، سارة، يوسف، فاطمة، نور، خالد، ليلى، محمد).
- الشهادات يجب أن تبدو حقيقية: ذكر تجربة محددة، تفصيل صغير، ونتيجة ملموسة.
- زر الـ CTA يجب أن يكون فعلاً مباشراً (مثل: "اطلبه الآن"، "احجز نسختك"، "اشتري بسعر العرض").
- لا تستخدم كليشيهات مكررة مثل "منتج رائع" أو "جودة عالية" بدون سياق.

استخدم الأداة build_landing_page فقط لإرجاع الإجابة.`;

    const userText = `هذه صورة منتج. حلّلها بصرياً بدقة، ثم أنشئ صفحة هبوط عربية كاملة عالية التحويل بأسلوب أكبر متاجر الإيكومرس العربية.${
      data.hint ? `\nملاحظة من المستخدم (استخدمها كموجّه إضافي): ${data.hint}` : ""
    }\nإذا لم تكن متأكداً من المنتج، اتخذ قراراً ذكياً واستمر بثقة.`;

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
