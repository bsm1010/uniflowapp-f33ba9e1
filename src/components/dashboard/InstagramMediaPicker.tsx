import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Instagram, Loader2, Check, Image as ImageIcon, AlertCircle, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const INSTAGRAM_CLIENT_ID = import.meta.env.VITE_INSTAGRAM_CLIENT_ID;

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

  const checkConnection = async () => {
    setLoading(true);
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
      if (result.error) { toast.error(result.error); return; }
      setMedia(result.data.filter((m: InstagramMedia) => m.media_type === "IMAGE" || m.thumbnail_url));
    } catch {
      toast.error("Failed to load Instagram media");
    }
  };

  useEffect(() => { checkConnection(); }, []);

  const initiateOAuth = async () => {
    if (!INSTAGRAM_CLIENT_ID) {
      toast.error("Instagram client ID not configured. Set VITE_INSTAGRAM_CLIENT_ID in your .env");
      return;
    }
    setConnecting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please sign in first"); setConnecting(false); return; }

    const state = btoa(session.access_token);
    const redirectUri = `${window.location.origin}/api/auth/instagram/callback`;
    const oauthUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${redirectUri}&scope=user_profile,user_media&response_type=code&state=${state}`;
    window.location.href = oauthUrl;
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
        </div>
      )}
    </div>
  );
}
