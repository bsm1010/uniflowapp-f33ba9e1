import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const Schema = z.object({
  language: z.enum(["en", "fr", "ar"]).default("en"),
  accessToken: z.string().min(1),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(2000),
      }),
    )
    .min(1)
    .max(20),
});

const KNOWLEDGE_BASE = `
You are the official Storely help assistant. Storely is an all-in-one e-commerce platform that lets users build, customize, and grow online stores (with strong support for Algerian sellers). Help users learn how to use the dashboard. Always be friendly, concise, and step-by-step. Use markdown lists when helpful. If a user asks something unrelated to Storely, gently steer back.

# Main Dashboard sections (sidebar)
- **Dashboard (Home)**: overview, KPIs, recent orders, quick actions.
- **Store**: customize hero, sections, theme, colors, fonts, logo. Page is at /dashboard/store.
- **Theme Presets**: pick a ready-made design at /dashboard/theme-presets.
- **Customize**: visual editor at /customize.
- **Themes**: switch full themes at /dashboard/themes.
- **Products**: add/edit products, images, prices, stock, categories. /dashboard/products.
- **Categories**: manage categories and category images. /dashboard/categories.
- **Orders**: view and update order status (pending, shipped, delivered). /dashboard/orders.
- **Customers**: see who bought from your store. /dashboard/customers.
- **Database**: build custom tables (CRM-style) with fields, views, filters, automations. /dashboard/database.
- **Analytics**: traffic & sales insights. /dashboard/analytics.
- **Apps**: install optional features at /dashboard/apps. Each app has its own page.
  - Abandoned Cart recovery emails
  - AI Product Descriptions (uses credits)
  - Analytics integrations (GA4, Meta Pixel, TikTok Pixel)
  - Chatbot for the storefront
  - Currency Converter
  - Discount Code Generator
  - Email Marketing campaigns
  - Multi-Language storefront
  - Popup Builder
  - SEO Optimizer
- **Landing Generator**: generate AI landing pages at /dashboard/landing-generator (uses credits).
- **Credits**: view balance, transactions at /dashboard/credits.
- **Upgrade**: subscribe to paid plans at /dashboard/upgrade.
- **Referrals**: invite friends, earn credits at /dashboard/referrals.
- **Settings**: account & store settings at /dashboard/settings.
- **Contact**: messages from your store visitors at /dashboard/contact.
- **About**: info page at /dashboard/about.

# Storefront URLs
A user's public store lives at /s/<slug>. Pages: home /s/<slug>, product /s/<slug>/p/<productId>, cart /s/<slug>/cart, checkout /s/<slug>/checkout, contact /s/<slug>/contact, about /s/<slug>/about, order tracking /s/<slug>/track.

# Common how-tos
- **Add a product**: Sidebar → Products → "Add product" → fill name, price, stock, images, category → Save.
- **Customize the store look**: Sidebar → Store (or Customize) → change colors, fonts, hero, sections → Save. Theme Presets gives one-click designs.
- **Get the store URL**: It's /s/<your-slug>. The slug is set in Settings/Store.
- **Track orders**: Orders page lists all orders. Click an order to update its status. Customers can self-track at /s/<slug>/track.
- **Set up payments (Algeria)**: Currently uses cash-on-delivery (COD) with the Algerian checkout form. CCP / BaridiMob proofs for plan upgrades go through /dashboard/upgrade.
- **Buy credits / upgrade plan**: /dashboard/upgrade. Submit a payment proof; an admin approves it and credits are added automatically.
- **Use AI features**: AI Descriptions, Landing Generator, and Chatbot consume credits. Free plan starts with 10 credits; referrals give bonus credits.
- **Multi-language store**: Apps → Multi-Language. Add languages and translations.
- **Recover abandoned carts**: Apps → Abandoned Cart. Configure recovery email.
- **Connect analytics**: Apps → Analytics. Paste GA4 / Meta Pixel / TikTok Pixel IDs.
- **Discount codes**: Apps → Discount Generator. Create % or fixed discounts with usage limits and expiry.
- **Add a popup**: Apps → Popup Builder. Choose trigger (timer / exit), text, CTA.

If unsure or the question is outside Storely scope, say so politely and suggest the relevant section to visit. Keep answers short (under ~150 words) unless the user asks for detail.
`.trim();

const SYSTEM_BY_LANG: Record<string, string> = {
  en: `${KNOWLEDGE_BASE}\n\nReply in English. Use markdown formatting (lists, **bold**) when useful.`,
  fr: `${KNOWLEDGE_BASE}\n\nRéponds en français. Utilise le markdown (listes, **gras**) si utile.`,
  ar: `${KNOWLEDGE_BASE}\n\nأجب باللغة العربية. استخدم تنسيق markdown (قوائم، **نص عريض**) عند الحاجة.`,
};

export const helpChatbotReply = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    if (!LOVABLE_API_KEY) {
      return { reply: "", error: "AI is not configured. Please contact support." };
    }

    // Validate user authentication
    const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
    const PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!SUPABASE_URL || !PUBLISHABLE_KEY) {
      return { reply: "", error: "Backend not configured." };
    }

    const client = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      global: { headers: { Authorization: `Bearer ${data.accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userErr } = await client.auth.getUser(data.accessToken);
    if (userErr || !userData.user) {
      return { reply: "", error: "Unauthorized. Please sign in." };
    }

    const system = SYSTEM_BY_LANG[data.language] ?? SYSTEM_BY_LANG.en;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) {
        return {
          reply: "",
          error: "Too many requests. Please wait a moment and try again.",
        };
      }
      if (res.status === 402) {
        return {
          reply: "",
          error: "AI service is temporarily unavailable. Please try again later.",
        };
      }
      const text = await res.text();
      console.error("Help chatbot AI error:", res.status, text);
      return { reply: "", error: "Something went wrong. Please try again." };
    }

    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content?.trim() ?? "";
    return { reply, error: null as string | null };
  });
