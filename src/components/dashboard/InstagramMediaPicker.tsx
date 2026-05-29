import { useEffect, useMemo, useState } from "react";
import { Instagram, Loader2, Check, Image as ImageIcon, AlertCircle, LogIn, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const INSTAGRAM_CLIENT_ID = import.meta.env.VITE_INSTAGRAM_CLIENT_ID || "1874901709839127";

interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  timestamp: string;
}

interface Props {
  onSelect: (urls: string[]) => void;
  onClose: () => void;
}

export function InstagramMediaPicker({ onSelect, onClose }: Props) {
  const [connected, setConnected] = useState(false);
  const [media, setMedia] = useState<InstagramMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkConnection = async () => {
    setLoading(true);
    setError(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data } = await supabase
      .from("instagram_connections")
      .select("id, instagram_username")
      .eq("user_id", session.user.id)
      .eq("status", "connected")
      .maybeSingle();

    if (data) {
      setConnected(true);
      await fetchMedia(session.access_token);
    }
    setLoading(false);
  };

  const fetchMedia = async (token: string) => {
    try {
      const res = await fetch("/api/auth/instagram/media", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      if (result.error) { setError(result.error); return; }
      setMedia(result.data.filter((m: InstagramMedia) => m.media_type === "IMAGE" || m.thumbnail_url));
    } catch {
      setError("Failed to load Instagram media");
    }
  };

  useEffect(() => { checkConnection(); }, []);

  const initiateOAuth = async () => {
    setError(null);

    if (!INSTAGRAM_CLIENT_ID) {
      setError("Instagram API not configured. The store owner needs to set VITE_INSTAGRAM_CLIENT_ID in their environment variables.");
      return;
    }

    setConnecting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Please sign in first"); setConnecting(false); return; }

    try {
      const state = encodeURIComponent(session.access_token);
      const redirectUri = `${window.location.origin}/api/auth/instagram/callback`;
      const oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=${state}`;
      window.location.href = oauthUrl;
    } catch (e) {
      setError("Failed to start Instagram authentication. Please try again.");
      setConnecting(false);
    }
  };

  const DEMO_MEDIA: InstagramMedia[] = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: `demo_${i + 1}`,
      media_type: "IMAGE" as const,
      media_url: `https://picsum.photos/seed/fennec-demo${i + 1}/400/400`,
      thumbnail_url: `https://picsum.photos/seed/fennec-demo${i + 1}/200/200`,
      caption: ["Product shot", "Lifestyle", "Detail view", "Packaging", "On model", "BTS", "Flat lay", "Group shot", "Feature close-up", "Outdoors", "Studio", "Angle"][i],
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    })), []);

  const startDemo = () => {
    setError(null);
    setMedia(DEMO_MEDIA);
    setConnected(true);
    setLoading(false);
  };

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmSelection = () => {
    const urls = media
      .filter((m) => selected.has(m.id))
      .map((m) => m.media_url);
    if (urls.length === 0) { toast.error("Select at least one image"); return; }
    onSelect(urls);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-700">
            <p className="font-medium mb-1">Instagram not configured</p>
            <p>To enable Instagram photo import, create an app at developers.facebook.com and add the App ID to your environment as <code className="bg-amber-500/10 px-1 rounded">VITE_INSTAGRAM_CLIENT_ID</code>.</p>
            <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1.5 text-amber-600 hover:text-amber-700 underline font-medium">
              Open Meta Developer Console <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : connected ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Select photos from Instagram to add to your product
            </p>
            {selected.size > 0 && (
              <Button size="sm" onClick={confirmSelection}>
                <Check className="h-4 w-4 mr-1" />
                Add {selected.size} photo{selected.size > 1 ? "s" : ""}
              </Button>
            )}
          </div>
          {media.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <p className="text-sm">No photos found on your Instagram account</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto p-1">
              {media.map((item) => {
                const imgUrl = item.thumbnail_url || item.media_url;
                const isSelected = selected.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleSelected(item.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-purple-500 ring-2 ring-purple-500/30"
                        : "border-border hover:border-purple-300"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={item.caption || ""}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
            <Instagram className="h-6 w-6 text-white" />
          </div>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            Connect your Instagram account to import your post photos into products
          </p>
          <Button onClick={initiateOAuth} disabled={connecting} className="gap-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 text-white hover:opacity-90">
            {connecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Connect Instagram
          </Button>
          {!INSTAGRAM_CLIENT_ID && (
            <>
              <span className="text-xs text-muted-foreground">or</span>
              <Button onClick={startDemo} variant="outline" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Try Demo Mode
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
