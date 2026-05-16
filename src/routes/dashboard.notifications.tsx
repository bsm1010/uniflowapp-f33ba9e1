import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Bell, CheckCheck, Trash2, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, EmptyState } from "@/components/dashboard/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export const Route = createFileRoute("/dashboard/notifications")({
  component: NotificationsPage,
  head: () => ({ meta: [{ title: "Notifications — Fennecly" }] }),
});

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[] | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems(data ?? []);
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markAllRead = async () => {
    if (!items?.some((n) => !n.read)) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", user!.id).eq("read", false);
    setItems((cur) => cur?.map((n) => ({ ...n, read: true })) ?? null);
    toast.success("All marked as read");
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setItems((cur) => cur?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null);
  };

  const remove = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setItems((cur) => cur?.filter((n) => n.id !== id) ?? null);
  };

  const list = items?.filter((n) => filter === "all" || !n.read) ?? [];
  const unread = items?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        eyebrow="Workspace"
        title="Notifications"
        description="All your activity across the store, in one place."
        icon={Bell}
        gradient="from-violet-500 via-indigo-500 to-blue-500"
      />

      <div className="flex items-center justify-between mb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unread > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-primary">{unread}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {items === null ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
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
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => markRead(n.id)}>
                        <CheckCheck className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(n.id)}>
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
