import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Mic,
  Download,
  Play,
  Pause,
  Trash2,
  History,
  Sparkles,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { generateVoice } from "@/lib/ai/voice-generator";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/voice-generator")({
  component: VoiceGeneratorPage,
  head: () => ({
    meta: [{ title: "AI Voice Generator — Storely" }],
  }),
});

type VoicePreset = {
  id: string;
  name: string;
  tag: string;
  description: string;
  accent: string;
  gradient: string;
};

const VOICE_PRESETS: VoicePreset[] = [
  {
    id: "JBFqnCBsd6RMkjVDRZzb",
    name: "George",
    tag: "Male · Warm",
    description: "Deep, British, reassuring",
    accent: "British",
    gradient: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    tag: "Female · Soft",
    description: "Soft, American, friendly",
    accent: "American",
    gradient: "from-pink-500/20 to-rose-500/20",
  },
  {
    id: "nPczCjzI2devNBz1zQrb",
    name: "Brian",
    tag: "Male · Deep",
    description: "Deep, authoritative tone",
    accent: "American",
    gradient: "from-slate-600/20 to-zinc-700/20",
  },
  {
    id: "FGY2WhTYpPnrIDTdsKH5",
    name: "Laura",
    tag: "Female · Upbeat",
    description: "Energetic, friendly, bright",
    accent: "American",
    gradient: "from-amber-400/20 to-orange-500/20",
  },
  {
    id: "IKne3meq5aSn9XLyUdCD",
    name: "Charlie",
    tag: "Male · Casual",
    description: "Relaxed, conversational",
    accent: "Australian",
    gradient: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: "Xb7hH8MSUJpSbSDYk0k2",
    name: "Alice",
    tag: "Female · Clear",
    description: "Crisp, professional, British",
    accent: "British",
    gradient: "from-violet-500/20 to-purple-500/20",
  },
];

type HistoryItem = {
  id: string;
  text: string;
  voiceName: string;
  voiceId: string;
  audioUrl: string;
  createdAt: number;
};

const HISTORY_KEY = "voice-generator-history";
const MAX_HISTORY = 10;

function VoiceGeneratorPage() {
  const generate = useServerFn(generateVoice);
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(VOICE_PRESETS[0].id);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Load history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const saveHistory = (items: HistoryItem[]) => {
    setHistory(items);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
    } catch {}
  };

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
      const url = `data:audio/mpeg;base64,${res.audio}`;
      setAudioUrl(url);
      const preset = VOICE_PRESETS.find((v) => v.id === voiceId);
      const item: HistoryItem = {
        id: crypto.randomUUID(),
        text: text.trim(),
        voiceName: preset?.name ?? "Voice",
        voiceId,
        audioUrl: url,
        createdAt: Date.now(),
      };
      saveHistory([item, ...history].slice(0, MAX_HISTORY));
      toast.success("Voice generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while generating audio");
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = (id: string, url: string) => {
    const current = audioRefs.current[id];
    if (!current) return;
    Object.entries(audioRefs.current).forEach(([key, el]) => {
      if (key !== id && el) {
        el.pause();
        el.currentTime = 0;
      }
    });
    if (playingId === id && !current.paused) {
      current.pause();
      setPlayingId(null);
    } else {
      current.play();
      setPlayingId(id);
    }
  };

  const removeFromHistory = (id: string) => {
    saveHistory(history.filter((h) => h.id !== id));
  };

  const clearHistory = () => {
    saveHistory([]);
    toast.success("History cleared");
  };

  const selectedPreset = VOICE_PRESETS.find((v) => v.id === voiceId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="AI Voice Generator"
        description="Convert any text into natural sounding speech using AI."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main generator */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Voice Generator
                  </CardTitle>
                  <CardDescription className="mt-1.5">
                    Type your text, pick a voice, and generate studio-quality audio.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Text input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tts-text" className="text-sm font-medium">
                    Your text
                  </Label>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {text.length} / 5000
                  </span>
                </div>
                <Textarea
                  id="tts-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Hello! Welcome to my store. Today we have amazing offers just for you..."
                  rows={7}
                  maxLength={5000}
                  className="resize-none border-border/70 focus-visible:ring-1"
                />
              </div>

              {/* Voice presets */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Choose a voice</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {VOICE_PRESETS.map((preset) => {
                    const active = preset.id === voiceId;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setVoiceId(preset.id)}
                        className={cn(
                          "group relative text-left rounded-xl border p-3 transition-all",
                          "hover:border-primary/50 hover:shadow-sm",
                          active
                            ? "border-primary ring-2 ring-primary/20 bg-gradient-to-br " +
                                preset.gradient
                            : "border-border/60 bg-card",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-sm truncate">
                                {preset.name}
                              </span>
                              {active && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {preset.tag}
                            </p>
                          </div>
                          <Volume2
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 transition-colors",
                              active ? "text-primary" : "text-muted-foreground/60",
                            )}
                          />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1">
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settings row */}
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3">
                <div className="space-y-0.5">
                  <Label htmlFor="autoplay" className="text-sm font-medium cursor-pointer">
                    Auto-play after generation
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Start playback as soon as audio is ready
                  </p>
                </div>
                <Switch id="autoplay" checked={autoPlay} onCheckedChange={setAutoPlay} />
              </div>

              {/* Generate button */}
              <Button
                onClick={handleGenerate}
                disabled={loading || !text.trim()}
                className="w-full h-11"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating with {selectedPreset?.name}...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Generate Voice
                  </>
                )}
              </Button>

              {/* Waveform / output */}
              {(loading || audioUrl) && (
                <div className="rounded-xl border border-border/60 bg-gradient-to-br from-muted/40 to-muted/10 p-5 space-y-4">
                  {loading ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Generating audio...
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {selectedPreset?.name}
                        </Badge>
                      </div>
                      <Waveform animating />
                    </>
                  ) : audioUrl ? (
                    <>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Your audio is ready</Label>
                        <Badge variant="secondary" className="text-[10px]">
                          {selectedPreset?.name}
                        </Badge>
                      </div>
                      <Waveform animating={false} />
                      <audio
                        key={audioUrl}
                        src={audioUrl}
                        controls
                        autoPlay={autoPlay}
                        className="w-full"
                      />
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <a href={audioUrl} download={`voice-${Date.now()}.mp3`}>
                            <Download className="h-3.5 w-3.5" />
                            Download MP3
                          </a>
                        </Button>
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* History sidebar */}
        <Card className="border-border/60 shadow-sm h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-muted-foreground" />
                History
              </CardTitle>
              {history.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                >
                  Clear all
                </Button>
              )}
            </div>
            <CardDescription className="text-xs">
              Your last {MAX_HISTORY} generated clips
            </CardDescription>
          </CardHeader>
          <CardContent className="px-3">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Mic className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium">No clips yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generated audio will appear here
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[480px] pr-2">
                <div className="space-y-2">
                  {history.map((item) => {
                    const isPlaying = playingId === item.id;
                    return (
                      <div
                        key={item.id}
                        className="group rounded-lg border border-border/60 bg-card hover:bg-muted/40 transition-colors p-3"
                      >
                        <div className="flex items-start gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 shrink-0 rounded-full"
                            onClick={() => togglePlay(item.id, item.audioUrl)}
                          >
                            {isPlaying ? (
                              <Pause className="h-3.5 w-3.5" />
                            ) : (
                              <Play className="h-3.5 w-3.5 ml-0.5" />
                            )}
                          </Button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-medium">{item.voiceName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                · {formatTime(item.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.text}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button asChild variant="ghost" size="sm" className="h-7 text-xs flex-1">
                            <a href={item.audioUrl} download={`voice-${item.id}.mp3`}>
                              <Download className="h-3 w-3" />
                              Download
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromHistory(item.id)}
                            className="h-7 text-xs text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <audio
                          ref={(el) => {
                            audioRefs.current[item.id] = el;
                          }}
                          src={item.audioUrl}
                          onEnded={() => setPlayingId(null)}
                          className="hidden"
                        />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Waveform({ animating }: { animating: boolean }) {
  const bars = 48;
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20;
        return (
          <span
            key={i}
            className={cn(
              "w-[3px] rounded-full bg-gradient-to-t from-primary/60 to-primary",
              animating && "animate-pulse",
            )}
            style={{
              height: `${animating ? Math.max(8, baseHeight) : Math.max(6, baseHeight * 0.6)}%`,
              animationDelay: `${i * 40}ms`,
              animationDuration: `${600 + (i % 5) * 120}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

function formatTime(ts: number) {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}
