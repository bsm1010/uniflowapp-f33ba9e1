import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/hooks/instagram")({
  server: {
    handlers: {
      // Webhook verification (GET)
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;
        if (!VERIFY_TOKEN) {
          return new Response("Webhook verify token not configured", { status: 500 });
        }

        if (mode === "subscribe" && token === VERIFY_TOKEN) {
          return new Response(challenge || "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      // Webhook events (POST)
      POST: async ({ request }) => {
        const META_APP_SECRET = process.env.META_APP_SECRET;
        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;

        if (!SUPABASE_URL || !SERVICE_KEY) {
          return new Response("Backend not configured", { status: 500 });
        }

        const body = await request.text();

        // Verify signature if META_APP_SECRET is configured
        if (META_APP_SECRET) {
          const signature = request.headers.get("x-hub-signature-256");
          if (signature) {
            const expected = "sha256=" + createHmac("sha256", META_APP_SECRET).update(body).digest("hex");
            if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
              return new Response("Invalid signature", { status: 401 });
            }
          }
        }

        const payload = JSON.parse(body);
        const admin = createClient(SUPABASE_URL, SERVICE_KEY);

        // Process Instagram messaging events
        if (payload.object === "instagram") {
          for (const entry of payload.entry ?? []) {
            for (const messaging of entry.messaging ?? []) {
              const senderId = messaging.sender?.id;
              const recipientId = messaging.recipient?.id;
              const messageData = messaging.message;

              if (!senderId || !recipientId || !messageData) continue;

              // Find the store owner by their Instagram page/user ID
              const { data: connection } = await admin
                .from("instagram_connections")
                .select("user_id, instagram_user_id")
                .eq("instagram_user_id", recipientId)
                .eq("status", "connected")
                .maybeSingle();

              if (!connection) continue;

              const userId = connection.user_id;

              // Find or create conversation
              let { data: conversation } = await admin
                .from("ig_conversations")
                .select("*")
                .eq("user_id", userId)
                .eq("customer_instagram_id", senderId)
                .maybeSingle();

              if (!conversation) {
                const { data: newConv } = await admin
                  .from("ig_conversations")
                  .insert({
                    user_id: userId,
                    customer_instagram_id: senderId,
                    customer_username: senderId,
                    customer_name: senderId,
                    status: "active",
                    mode: "ai",
                  })
                  .select()
                  .single();
                conversation = newConv;
              }

              if (!conversation) continue;

              const isVoice = messageData.attachments?.some(
                (a: any) => a.type === "audio"
              );

              // Save the incoming message
              await admin.from("ig_messages").insert({
                conversation_id: conversation.id,
                user_id: userId,
                instagram_message_id: messageData.mid,
                sender_type: "customer",
                content: messageData.text || (isVoice ? "[Voice Message]" : "[Attachment]"),
                message_type: isVoice ? "voice" : "text",
                voice_audio_url: isVoice ? messageData.attachments[0]?.payload?.url : null,
                attachments: messageData.attachments ?? [],
              });

              // Update conversation
              await admin
                .from("ig_conversations")
                .update({
                  last_message_text: messageData.text || "[Attachment]",
                  last_message_at: new Date().toISOString(),
                  unread_count: (conversation.unread_count ?? 0) + 1,
                })
                .eq("id", conversation.id);

              // If AI mode, generate and send reply
              if (conversation.mode === "ai" && LOVABLE_API_KEY) {
                try {
                  // Fetch AI settings
                  const { data: settings } = await admin
                    .from("ai_agent_settings")
                    .select("*")
                    .eq("user_id", userId)
                    .maybeSingle();

                  if (settings && !settings.enabled) continue;
                  if (settings && !settings.auto_reply) continue;

                  // Fetch products
                  const { data: products } = await admin
                    .from("products")
                    .select("name, price, stock, category")
                    .eq("user_id", userId)
                    .limit(50);

                  const { data: storeSettings } = await admin
                    .from("store_settings")
                    .select("store_name, currency")
                    .eq("user_id", userId)
                    .maybeSingle();

                  const productList = (products ?? [])
                    .map((p) => `- ${p.name}: ${p.price} ${storeSettings?.currency ?? "DZD"} (stock: ${p.stock})`)
                    .join("\n");

                  // Fetch last messages for context
                  const { data: history } = await admin
                    .from("ig_messages")
                    .select("sender_type, content")
                    .eq("conversation_id", conversation.id)
                    .order("created_at", { ascending: false })
                    .limit(10);

                  const reversedHistory = (history ?? []).reverse();

                  const systemPrompt = `You are a friendly AI sales assistant for "${storeSettings?.store_name ?? "Store"}".
Personality: ${settings?.personality ?? "friendly"}, Tone: ${settings?.tone ?? "casual"}.
You understand Darija, Arabic, French, English, and Arabizi. Reply in the same language the customer uses.
Products: ${productList || "(none)"}
${settings?.custom_instructions ?? ""}
Keep replies concise (1-3 sentences). Sound human and natural.`;

                  const messages = [
                    { role: "system", content: systemPrompt },
                    ...reversedHistory.map((m) => ({
                      role: m.sender_type === "customer" ? "user" : "assistant",
                      content: m.content,
                    })),
                  ];

                  const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${LOVABLE_API_KEY}`,
                    },
                    body: JSON.stringify({
                      model: "google/gemini-2.5-flash",
                      messages,
                    }),
                  });

                  if (aiRes.ok) {
                    const aiJson = await aiRes.json();
                    const aiReply = aiJson?.choices?.[0]?.message?.content?.trim() ?? "";

                    if (aiReply) {
                      // Save AI reply
                      await admin.from("ig_messages").insert({
                        conversation_id: conversation.id,
                        user_id: userId,
                        sender_type: "ai",
                        content: aiReply.replace("[HUMAN_TAKEOVER]", "").trim(),
                        message_type: "text",
                        is_ai_generated: true,
                      });

                      await admin
                        .from("ig_conversations")
                        .update({
                          last_message_text: aiReply.substring(0, 200),
                          last_message_at: new Date().toISOString(),
                        })
                        .eq("id", conversation.id);

                      // If AI suggests human takeover
                      if (aiReply.includes("[HUMAN_TAKEOVER]")) {
                        await admin
                          .from("ig_conversations")
                          .update({ mode: "human" })
                          .eq("id", conversation.id);
                      }

                      // TODO: Send reply back via Instagram Send API
                      // This requires META_PAGE_ACCESS_TOKEN and calling
                      // POST https://graph.instagram.com/v21.0/me/messages
                    }
                  }
                } catch (err) {
                  console.error("AI reply error:", err);
                }
              }
            }
          }
        }

        return new Response("EVENT_RECEIVED", { status: 200 });
      },
    },
  },
});
