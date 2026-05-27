import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { consumeCreditsServer, INSUFFICIENT_CREDITS_ERROR } from "@/lib/credits/consume-server";

const ALLOWED_VOICE_IDS = new Set([
  "JBFqnCBsd6RMkjVDRZzb",
  "21m00Tcm4TlvDq8ikWAM",
  "AZnzlk1XvdvUeBnXmlld",
  "EXAVITQu4vr4xnSDxMaL",
  "ErXwobaYiN019PkySvjV",
  "MF3mGyEYCl7XYWbV9V6O",
  "TxGEqnHWrfWFTfGW9XjX",
  "VR6AewLTigWG4xSOukaG",
  "pNInz6obpgDQGcFmaJgB",
  "yoZ06aMxZJJ28mfd3POQ",
]);

const Schema = z.object({
  text: z.string().min(1).max(5000),
  voiceId: z.string().regex(/^[a-zA-Z0-9]+$/).optional().default("JBFqnCBsd6RMkjVDRZzb"),
  accessToken: z.string().min(1),
});

export const generateVoice = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => Schema.parse(input))
  .handler(async ({ data }) => {
    // Authenticate and consume credits
    const credit = await consumeCreditsServer({
      accessToken: data.accessToken,
      amount: 3,
      reason: "voice_generation",
    });
    if (!credit.ok) {
      return {
        audio: null,
        error: credit.reason === "insufficient" ? INSUFFICIENT_CREDITS_ERROR : "Unauthorized",
      };
    }

    // Validate voiceId against allowlist
    if (!ALLOWED_VOICE_IDS.has(data.voiceId)) {
      return { audio: null, error: "Invalid voice ID" };
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return { audio: null, error: "ELEVENLABS_API_KEY is not configured" };
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${data.voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: data.text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
              speed: 1.0,
            },
          }),
        },
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("ElevenLabs TTS error:", response.status, errText);
        return { audio: null, error: `Voice generation failed (${response.status})` };
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return { audio: base64, error: null };
    } catch (err) {
      console.error("Voice generation failed:", err);
      return { audio: null, error: "Voice generation service is unavailable" };
    }
  });
