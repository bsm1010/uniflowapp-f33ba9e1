import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PixelSettings() {
  const { user } = useAuth();
  const [metaPixelId, setMetaPixelId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("stores")
        .select("meta_pixel_id, tiktok_pixel_id")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setMetaPixelId(data.meta_pixel_id || "");
        setTiktokPixelId(data.tiktok_pixel_id || "");
      }
    };
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("stores")
      .update({
        meta_pixel_id: metaPixelId.trim() || null,
        tiktok_pixel_id: tiktokPixelId.trim() || null,
      })
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sauvegardé ✓", description: "Vos pixels ont été mis à jour." });
    }
  };

  return (
    <Card className="border border-white/10 bg-white/5 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-white text-lg">Pixels de suivi</CardTitle>
        <CardDescription className="text-white/60">
          Connectez vos pixels Meta et TikTok pour suivre les conversions de votre boutique.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Meta Pixel */}
        <div className="space-y-2">
          <Label className="text-white/80 flex items-center gap-2">
            <span className="text-blue-400 font-bold">f</span> Meta Pixel ID
          </Label>
          <Input
            placeholder="Ex: 1234567890123456"
            value={metaPixelId}
            onChange={(e) => setMetaPixelId(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-white/40">
            Trouvez votre Pixel ID dans{" "}
            
              href="https://business.facebook.com/events_manager"
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 underline"
            >
              Meta Events Manager
            </a>
          </p>
        </div>

        {/* TikTok Pixel */}
        <div className="space-y-2">
          <Label className="text-white/80 flex items-center gap-2">
            <span className="font-bold">🎵</span> TikTok Pixel ID
          </Label>
          <Input
            placeholder="Ex: CXXXXXXXXXXXXXXX"
            value={tiktokPixelId}
            onChange={(e) => setTiktokPixelId(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
          />
          <p className="text-xs text-white/40">
            Trouvez votre Pixel dans{" "}
            
              href="https://ads.tiktok.com/i18n/events_manager"
              target="_blank"
              rel="noreferrer"
              className="text-pink-400 underline"
            >
              TikTok Events Manager
            </a>
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          {loading ? "Sauvegarde..." : "Sauvegarder les pixels"}
        </Button>
      </CardContent>
    </Card>
  );
}
