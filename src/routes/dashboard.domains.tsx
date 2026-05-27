import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Globe, Plus, Trash2, ShieldCheck, Loader2, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConnectDomainWizard } from "@/components/domains/ConnectDomainWizard";
import { listCustomDomains, removeCustomDomain, verifyCustomDomain } from "@/lib/domains/domains.functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/domains")({
  component: DomainsPage,
});

type DomainRow = {
  id: string; domain: string; domain_type: string; status: string;
  ssl_active: boolean; detected_provider: string | null; created_at: string;
  error_message: string | null;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
  verifying: { label: "Verifying", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  verified: { label: "Active", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  failed: { label: "Failed", cls: "bg-destructive/15 text-destructive" },
};

function DomainsPage() {
  const [open, setOpen] = useState(false);
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const listFn = useServerFn(listCustomDomains);
  const verifyFn = useServerFn(verifyCustomDomain);
  const removeFn = useServerFn(removeCustomDomain);

  const refresh = async () => {
    try {
      const rows = await listFn();
      setDomains(rows as unknown as DomainRow[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load domains");
    } finally { setLoading(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const recheck = async (id: string) => {
    setBusyId(id);
    try {
      const r = await verifyFn({ data: { id } });
      toast[r.verified ? "success" : "info"](r.verified ? "Domain verified!" : "Still propagating…");
      await refresh();
    } finally { setBusyId(null); }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this domain?")) return;
    setBusyId(id);
    try { await removeFn({ data: { id } }); await refresh(); }
    finally { setBusyId(null); }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Domains</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect your own domain to your storefront with auto-SSL.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Connect Domain
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Your domains</CardTitle>
          <CardDescription>All custom domains connected to your store.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 grid place-items-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : domains.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto h-14 w-14 rounded-full bg-muted grid place-items-center mb-3">
                <Globe className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium">No domains connected yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Connect Domain" to add your first one.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {domains.map((d) => {
                const meta = STATUS_META[d.status] ?? STATUS_META.pending;
                return (
                  <li key={d.id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center shrink-0">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-medium truncate">{d.domain}</span>
                        <Badge variant="secondary" className="capitalize text-[10px]">{d.domain_type}</Badge>
                        <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full", meta.cls)}>{meta.label}</span>
                        {d.ssl_active && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> SSL
                          </span>
                        )}
                      </div>
                      {d.error_message && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> {d.error_message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {d.status === "verified" && (
                        <a href={`https://${d.domain}`} target="_blank" rel="noreferrer" className="inline-flex">
                          <Button variant="ghost" size="icon"><ExternalLink className="h-4 w-4" /></Button>
                        </a>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => recheck(d.id)} disabled={busyId === d.id}>
                        {busyId === d.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(d.id)} disabled={busyId === d.id}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <ConnectDomainWizard open={open} onOpenChange={setOpen} onConnected={refresh} />
    </div>
  );
}
