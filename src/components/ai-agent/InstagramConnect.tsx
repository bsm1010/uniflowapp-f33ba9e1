import { useState } from "react";
import { motion } from "framer-motion";
import { Instagram, Link2Off, Loader2, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAIAgent } from "@/hooks/use-ai-agent";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const INSTAGRAM_CLIENT_ID = import.meta.env.VITE_INSTAGRAM_CLIENT_ID ?? "";

export function InstagramConnect() {
  const { connection } = useAIAgent();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const handleConnect = async () => {
    if (!INSTAGRAM_CLIENT_ID) {
      toast.error("Instagram not configured. Set VITE_INSTAGRAM_CLIENT_ID in your environment variables.");
      return;
    }
    setConnecting(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please sign in first"); setConnecting(false); return; }
    const state = encodeURIComponent(session.access_token);
    const redirectUri = `${window.location.origin}/api/auth/instagram/callback`;
    const scope = "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish";
    const oauthUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${state}`;
    window.location.href = oauthUrl;
  };

  const startDemo = () => {
    setDemoMode(true);
  };

  const handleDisconnect = async () => {
    if (demoMode) { setDemoMode(false); return; }
    if (!user) return;
    await supabase.from("instagram_connections").delete().eq("user_id", user.id);
    toast.success("Instagram disconnected");
    window.location.reload();
  };

  const isConnected = connection?.status === "connected" || demoMode;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-0 shadow-xl overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600" />
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Instagram className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Connect Instagram</CardTitle>
            <CardDescription>
              Link your Instagram Business account to enable AI-powered customer support
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isConnected ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {(demoMode ? "D" : connection?.instagram_username?.[0])?.toUpperCase() || "I"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">@{demoMode ? "demo_store" : connection?.instagram_username}</p>
                    <p className="text-sm text-muted-foreground">{demoMode ? "Instagram Business (Demo)" : (connection?.page_name || "Instagram Business")}</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-medium text-emerald-600">Connected</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">Last Synced</p>
                    <p className="font-medium">
                      {demoMode ? "Just now" : (connection?.last_synced_at ? new Date(connection.last_synced_at).toLocaleDateString() : "Never")}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleDisconnect} className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/5">
                  <Link2Off className="h-4 w-4" /> {demoMode ? "Exit Demo Mode" : "Disconnect Instagram"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-3">
                  {["Instagram Business or Creator account", "Facebook Page connected to Instagram", "DM access permissions enabled"].map((req, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </div>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full h-12 gap-2 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 hover:from-yellow-500 hover:via-pink-600 hover:to-purple-700 text-white font-semibold shadow-lg"
                >
                  {connecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Instagram className="h-5 w-5" />}
                  Connect Instagram Business
                </Button>
                {!INSTAGRAM_CLIENT_ID && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                      <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
                    </div>
                    <Button onClick={startDemo} variant="outline" className="w-full gap-2">
                      <Sparkles className="h-4 w-4" />
                      Try Demo Mode
                    </Button>
                  </>
                )}
                <p className="text-xs text-center text-muted-foreground">
                  We only request messaging permissions. Your data stays secure.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Setup instructions */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-base">Setup Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="font-mono text-xs bg-muted rounded px-2 py-0.5 h-fit">1</span>
            <div>
              <p className="font-medium text-foreground">Create a Meta App</p>
              <p>Go to developers.facebook.com and create a new app with Instagram Messaging</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono text-xs bg-muted rounded px-2 py-0.5 h-fit">2</span>
            <div>
              <p className="font-medium text-foreground">Configure Webhook</p>
              <p>Set your webhook URL to receive Instagram DMs in real-time</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="font-mono text-xs bg-muted rounded px-2 py-0.5 h-fit">3</span>
            <div>
              <p className="font-medium text-foreground">Add Credentials</p>
              <p>Add META_APP_ID and META_APP_SECRET to your environment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
