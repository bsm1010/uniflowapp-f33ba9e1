import { useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Inbox, BellOff } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string | null;
}

// ── Derive a navigation link from notification content ───────────
function resolveLink(n: Notification): string | null {
  if (n.link) return n.link;

  const msg = (n.message ?? "").toLowerCase();
  const title = (n.title ?? "").toLowerCase();

  if (msg.includes("order") || title.includes("order")) return "/dashboard/orders";
  if (msg.includes("customer") || title.includes("customer")) return "/dashboard/customers";
  if (msg.includes("shipment") || msg.includes("shipping") || title.includes("shipment")) return "/dashboard/shipments";
  if (msg.includes("stock alert") || title.includes("stock alert")) return "/dashboard/stock-alerts";
  if (msg.includes("product") || msg.includes("stock") || title.includes("stock")) return "/dashboard/products";
  if (msg.includes("payment") || title.includes("payment")) return "/dashboard/payments";
  if (msg.includes("return") || title.includes("return")) return "/dashboard/returns";

  return null;
}

// ── Play ring sound ──────────────────────────────────────────────
function playRing() {
  try {
    const AudioCtx = (window as any).AudioContext ?? (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx() as AudioContext;
    const times = [0, 0.18, 0.36];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime + t);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + t + 0.12);
      gain.gain.setValueAtTime(0.4, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.15);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.15);
    });
  } catch (_e) {
    // silently fail
  }
}

// ── Request & send browser notification ─────────────────────────
async function sendBrowserNotification(title: string, body: string, type: string) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    const icon = type === "success" ? "✅" : type === "error" ? "❌" : "🔔";
    new Notification(`${icon} ${title}`, {
      body,
      icon: "https://gyfcaoscsjazazhfozig.supabase.co/storage/v1/object/public/store-assets/email/fennecly-logo-white.png",
      badge: "https://gyfcaoscsjazazhfozig.supabase.co/storage/v1/object/public/store-assets/email/fennecly-logo-white.png",
      tag: "fennecly-notification",
    });
  }
}

async function requestPermission() {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
}

// ── Component ────────────────────────────────────────────────────
export function NotificationsBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default",
  );
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems(data ?? []);
  };

  useEffect(() => {
    if (permission === "default") {
      const timer = setTimeout(() => setShowPermissionBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [permission]);

  useEffect(() => {
    if (!user) return;
    load();

    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => [n, ...prev]);
          playRing();

          if (bellRef.current) {
            bellRef.current.classList.add("animate-bounce");
            setTimeout(() => bellRef.current?.classList.remove("animate-bounce"), 1000);
          }

          sendBrowserNotification(n.title, n.message, n.type);

          const fn =
            n.type === "success" ? toast.success
            : n.type === "error" ? toast.error
            : toast.info;
          fn(n.title, { description: n.message });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    const ids = items.filter((n) => !n.read).map((n) => n.id);
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).in("id", ids);
  };

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const handleClick = async (n: Notification) => {
    await markRead(n.id);
    const link = resolveLink(n);
    if (link) {
      setOpen(false);
      navigate({ to: link });
    }
  };

  const handleAllowNotifications = async () => {
    const result = await requestPermission();
    setPermission(result as NotificationPermission);
    setShowPermissionBanner(false);
    if (result === "granted") toast.success("Notifications enabled! 🔔");
  };

  return (
    <>
      {/* Permission Banner */}
      {showPermissionBanner && permission === "default" && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white dark:bg-zinc-900 border border-border rounded-2xl shadow-xl px-5 py-3 animate-in slide-in-from-top-2 duration-300"
          style={{ minWidth: 320 }}
        >
          <div className="h-9 w-9 rounded-xl bg-[#7C3AED]/15 flex items-center justify-center shrink-0">
            <Bell className="h-5 w-5 text-[#7C3AED]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Enable notifications</p>
            <p className="text-xs text-muted-foreground">
              Get notified for new orders and updates
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAllowNotifications}
              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-8 text-xs rounded-lg"
            >
              Allow
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPermissionBanner(false)}
              className="h-8 text-xs rounded-lg"
            >
              Later
            </Button>
          </div>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={bellRef}
            variant="ghost"
            size="icon"
            className="relative transition-transform"
          >
            {permission === "denied" ? (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unread > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] bg-primary animate-pulse">
                {unread > 9 ? "9+" : unread}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h4 className="text-sm font-semibold">Notifications</h4>
            <div className="flex items-center gap-2">
              {permission !== "granted" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAllowNotifications}
                  className="h-7 text-xs gap-1 text-[#7C3AED]"
                >
                  <Bell className="h-3.5 w-3.5" />
                  Enable
                </Button>
              )}
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllRead}
                  className="h-7 text-xs gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          {permission === "denied" && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                🔕 Browser notifications are blocked. Enable them in your browser settings.
              </p>
            </div>
          )}

          <ScrollArea className="max-h-96">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y">
                {items.map((n) => {
                  const link = resolveLink(n);
                  return (
                    <li
                      key={n.id}
                      className={`px-4 py-3 transition-colors ${
                        link ? "cursor-pointer hover:bg-muted/50" : "cursor-default hover:bg-muted/30"
                      } ${!n.read ? "bg-primary/5" : ""}`}
                      onClick={() => handleClick(n)}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-1.5 size-2 rounded-full shrink-0 ${
                            n.type === "success" ? "bg-green-500"
                            : n.type === "error" ? "bg-destructive"
                            : "bg-primary"
                          } ${n.read ? "opacity-30" : ""}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            <div className="flex items-center gap-1 shrink-0">
                              {link && (
                                <span className="text-[10px] text-primary font-medium">→</span>
                              )}
                              {n.read && (
                                <Check className="h-3 w-3 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}
