import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { consumeCreditsServer, INSUFFICIENT_CREDITS_ERROR } from "@/lib/credits/consume-server";

const Schema = z.object({
  prompt: z.string().min(1).max(2000),
  actionLabel: z.string().max(100),
  accessToken: z.string().min(1),
});

export const copilotAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const credit = await consumeCreditsServer({
      accessToken: data.accessToken,
      amount: 1,
      reason: "ai_copilot",
    });
    if (!credit.ok) {
      throw new Error(credit.reason === "insufficient" ? INSUFFICIENT_CREDITS_ERROR : "Unauthorized");
    }

    const systemPrompt = `You are Fennecly Copilot, an expert e-commerce AI assistant embedded inside the Fennecly dashboard. You help store owners with concise, actionable advice. 

Rules:
- Keep responses under 200 words unless the user asks for more detail
- Use bullet points for lists
- Be specific and actionable, not generic
- Never mention you're an AI
- Use natural, conversational language
- When giving templates or examples, format them clearly`;

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
          { role: "user", content: `[Action: ${data.actionLabel}]\n${data.prompt}` },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI error ${res.status}: ${text}`);
    }
    const json = await res.json();
    const content = json?.choices?.[0]?.message?.content?.trim() ?? "";
    return { response: content };
  });
