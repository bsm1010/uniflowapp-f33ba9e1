import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Bell,
  CheckCheck,
  Trash2,
  Inbox,
  Settings,
  AlertTriangle,
  Send,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentStore } from "@/hooks/use-current-store";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  createTelegramLinkToken,
  getTelegramStatus,
  disconnectTelegram,
} from "@/lib/telegram-link.functions";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export const Route = createFileRoute("/dashboard/notifications/")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — Fennecly" }] }),
});

const TELEGRAM_BOT_USERNAME = "FenneclyBOT";

function NotificationsPage() {
  const { user } = useAuth();
  const { currentStore } = useCurrentStore();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error: dbErr } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (dbErr) throw dbErr;
      setItems(data ?? []);
      setError(false);
    } catch {
      setItems([]);
      setError(true);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    load();
    const channel = supabase
      .channel(`notif-page-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  const markAllRead = async () => {
    if (!items?.some((n) => !n.read) || !user) return;
    try {
      const { error: dbErr } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);
      if (dbErr) throw dbErr;
      setItems((cur) => cur?.map((n) => ({ ...n, read: true })) ?? null);
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const markRead = async (id: string) => {
    try {
      const { error: dbErr } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (dbErr) throw dbErr;
      setItems((cur) => cur?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  const remove = async (id: string) => {
    try {
      const { error: dbErr } = await supabase.from("notifications").delete().eq("id", id);
      if (dbErr) throw dbErr;
      setItems((cur) => cur?.filter((n) => n.id !== id) ?? null);
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  const list = items?.filter((n) => filter === "all" || !n.read) ?? [];
  const unread = items?.filter((n) => !n.read).length ?? 0;

  /* ── Telegram card ── */
  const [telegramConnected, setTelegramConnected] = useState(false);
  const [linking, setLinking] = useState(false);
  const generateLinkToken = useServerFn(createTelegramLinkToken);
  const fetchTelegramStatus = useServerFn(getTelegramStatus);
  const callDisconnectTelegram = useServerFn(disconnectTelegram);

  useEffect(() => {
    if (!currentStore?.id) return;
    fetchTelegramStatus({ data: { storeId: currentStore.id } })
      .then((r) => setTelegramConnected(!!r?.connected))
      .catch(() => setTelegramConnected(false));
  }, [currentStore?.id, fetchTelegramStatus]);

  const handleDisconnectTelegram = async () => {
    if (!currentStore?.id) return;
    try {
      await callDisconnectTelegram({ data: { storeId: currentStore.id } });
      setTelegramConnected(false);
      toast.success("Telegram disconnected");
    } catch {
      toast.error("Failed to disconnect");
    }
  };

  const handleConnectTelegram = async () => {
    if (!currentStore?.id) {
      toast.error("Store not loaded yet.");
      return;
    }
    setLinking(true);
    try {
      const { token } = await generateLinkToken({ data: { storeId: currentStore.id } });
      const url = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${token}`;
      window.open(url, "_blank");
      toast.success("Press Start in Telegram to finish linking (link valid 15 min).");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create link");
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="All your activity across the store, in one place."
        icon={Bell}
        gradient="from-violet-500 via-indigo-500 to-blue-500"
      />

      {/* Telegram Card */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-[#229ED9]" />
                Telegram notifications
              </CardTitle>
              <CardDescription className="mt-1">
                {telegramConnected
                  ? "Your store is connected. You'll receive order alerts on Telegram."
                  : "Get instant order notifications in your Telegram app."}
              </CardDescription>
            </div>
            {telegramConnected ? (
              <Button variant="outline" size="sm" onClick={handleDisconnectTelegram}>
                Disconnect
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-[#229ED9] hover:bg-[#1a8bbf] text-white"
                onClick={handleConnectTelegram}
                disabled={!currentStore?.id || linking}
              >
                <ExternalLink className="h-4 w-4 mr-1.5" />
                {linking ? "Preparing…" : "Connect Telegram"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {telegramConnected ? (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Connected — new orders will be sent to your Telegram.
            </div>
          ) : (
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                Click <strong>Connect Telegram</strong> above
              </li>
              <li>
                Telegram opens — press <strong>Start</strong> in the bot chat
              </li>
              <li>Come back here — status updates automatically</li>
            </ol>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unread > 0 && <Badge className="ml-2 h-5 px-1.5 bg-primary">{unread}</Badge>}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/dashboard/notifications/settings" })}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive font-medium">Failed to load notifications.</p>
            <Button variant="outline" size="sm" onClick={load}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : list.length === 0 ? (
        <EmptyState icon={Inbox} title="Nothing to see" description="You're all caught up." />
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-0">
            <ul className="divide-y">
              {list.map((n) => (
                <li
                  key={n.id}
                  className={`px-4 py-3 hover:bg-muted/30 flex items-start gap-3 ${
                    !n.read ? "bg-primary/5" : ""
                  }`}
                >
                  <span
                    className={`mt-2 size-2 rounded-full shrink-0 ${
                      n.type === "success"
                        ? "bg-emerald-500"
                        : n.type === "error"
                          ? "bg-rose-500"
                          : "bg-primary"
                    } ${n.read ? "opacity-30" : ""}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!n.read && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => markRead(n.id)}
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => remove(n.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
