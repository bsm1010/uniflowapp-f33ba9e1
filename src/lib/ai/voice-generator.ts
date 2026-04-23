import { createServerFn } from "@tanstack/react-start";

export const generateVoice = createServerFn({ method: "POST" })
  .inputValidator((input: { text: string; voiceId?: string }) => {
    if (!input || typeof input.text !== "string" || !input.text.trim()) {
      throw new Error("Text is required");
    }
    if (input.text.length > 5000) {
      throw new Error("Text must be 5000 characters or less");
    }
    return {
      text: input.text.trim(),
      voiceId: input.voiceId || "JBFqnCBsd6RMkjVDRZzb",
    };
  })
  .handler(async ({ data }) => {
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
