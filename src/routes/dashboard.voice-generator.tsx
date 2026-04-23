import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mic, Download } from "lucide-react";
import { toast } from "sonner";
import { generateVoice } from "@/lib/ai/voice-generator";
import { PageHeader } from "@/components/dashboard/PageHeader";

export const Route = createFileRoute("/dashboard/voice-generator")({
  component: VoiceGeneratorPage,
  head: () => ({
    meta: [{ title: "AI Voice Generator — Storely" }],
  }),
});

const VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George (Warm, British)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Soft, American)" },
  { id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger (Confident)" },
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura (Upbeat)" },
  { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie (Casual)" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam (Articulate)" },
  { id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice (Clear, British)" },
  { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda (Friendly)" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian (Deep)" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily (Warm)" },
];

function VoiceGeneratorPage() {
  const generate = useServerFn(generateVoice);
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(VOICES[0].id);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error("Please enter some text first");
      return;
    }
    setLoading(true);
    setAudioUrl(null);
    try {
      const res = await generate({ data: { text, voiceId } });
      if (res.error || !res.audio) {
        toast.error(res.error || "Failed to generate voice");
        return;
      }
      setAudioUrl(`data:audio/mpeg;base64,${res.audio}`);
      toast.success("Voice generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while generating audio");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="AI Voice Generator"
        description="Convert any text into natural sounding speech using AI."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Generator
          </CardTitle>
          <CardDescription>
            Type or paste your text, choose a voice, and generate audio in seconds.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tts-text">Enter text to convert to speech</Label>
            <Textarea
              id="tts-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Hello! Welcome to my store. Today we have amazing offers just for you..."
              rows={8}
              maxLength={5000}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-end">
              {text.length} / 5000
            </p>
          </div>

          <div className="space-y-2">
            <Label>Voice style</Label>
            <Select value={voiceId} onValueChange={setVoiceId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Generate Voice
              </>
            )}
          </Button>

          {audioUrl && (
            <div className="space-y-3 pt-3 border-t">
              <Label>Your generated audio</Label>
              <audio
                key={audioUrl}
                src={audioUrl}
                controls
                autoPlay
                className="w-full"
              />
              <Button asChild variant="outline" size="sm">
                <a href={audioUrl} download="voice.mp3">
                  <Download className="h-4 w-4" />
                  Download MP3
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
