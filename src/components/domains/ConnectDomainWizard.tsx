import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Copy, Check, Loader2, ShieldCheck, Sparkles, ArrowRight, ArrowLeft,
  AlertCircle, ExternalLink, HelpCircle, RefreshCw, Server, Wand2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { addCustomDomain, verifyCustomDomain } from "@/lib/domains/domains.functions";
import { classifyDomain, PROVIDER_GUIDES, type DnsRecord } from "@/lib/domains/dns-records";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConnected?: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_LABELS = ["Domain", "DNS Records", "Add to Provider", "Verify", "Live"];

export function ConnectDomainWizard({ open, onOpenChange, onConnected }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [domainInput, setDomainInput] = useState("");
  const [domainRow, setDomainRow] = useState<{
    id: string; domain: string; domain_type: string; dns_records: DnsRecord[]; detected_provider: string;
  } | null>(null);
  const [adding, setAdding] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const addFn = useServerFn(addCustomDomain);
  const verifyFn = useServerFn(verifyCustomDomain);

  const classified = useMemo(() => classifyDomain(domainInput), [domainInput]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1); setDomainInput(""); setDomainRow(null); setAttempts(0); setVerifyError(null);
      }, 250);
    }
  }, [open]);

  // Auto-verify polling
  useEffect(() => {
    if (step !== 4 || !domainRow) return;
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      setVerifying(true);
      try {
        const res = await verifyFn({ data: { id: domainRow.id } });
        if (cancelled) return;
        if (res.verified) {
          setStep(5);
          onConnected?.();
        } else {
          setVerifyError(res.error_message ?? null);
          setAttempts((a) => a + 1);
        }
      } catch (e) {
        setVerifyError(e instanceof Error ? e.message : "Verification failed");
      } finally {
        setVerifying(false);
      }
    };
    void tick();
    const id = setInterval(tick, 6000);
    return () => { cancelled = true; clearInterval(id); };
  }, [step, domainRow, verifyFn, onConnected]);

  const handleAdd = async () => {
    if (!classified) { toast.error("Please enter a valid domain"); return; }
    setAdding(true);
    try {
      const row = await addFn({ data: { domain: classified.domain } });
      setDomainRow(row as typeof domainRow);
      setStep(2);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add domain");
    } finally { setAdding(false); }
  };

  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden gap-0 max-h-[92vh] flex flex-col">
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-background px-6 pt-6 pb-4 border-b">
          <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,hsl(var(--primary)/.25),transparent_50%),radial-gradient(circle_at_80%_60%,hsl(var(--accent)/.2),transparent_55%)]" />
          <DialogHeader className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary/60 grid place-items-center text-primary-foreground shadow-lg">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl">Connect Custom Domain</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Bring your own domain to your storefront in minutes.</p>
              </div>
            </div>
            <StepperBar step={step} />
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && (
                <Step1
                  value={domainInput}
                  onChange={setDomainInput}
                  classified={classified}
                  onSubmit={handleAdd}
                  loading={adding}
                />
              )}
              {step === 2 && domainRow && (
                <Step2 row={domainRow} copy={copy} copied={copied} onNext={() => setStep(3)} />
              )}
              {step === 3 && domainRow && (
                <Step3 row={domainRow} onNext={() => setStep(4)} />
              )}
              {step === 4 && domainRow && (
                <Step4 verifying={verifying} attempts={attempts} error={verifyError} domain={domainRow.domain} />
              )}
              {step === 5 && domainRow && (
                <Step5 domain={domainRow.domain} onClose={() => onOpenChange(false)} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {step > 1 && step < 5 && (
          <div className="border-t px-6 py-3 flex items-center justify-between bg-muted/30">
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => (s > 1 ? ((s - 1) as Step) : s))}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <p className="text-xs text-muted-foreground">SSL is provisioned automatically once DNS is verified.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepperBar({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-2">
      {STEP_LABELS.map((label, i) => {
        const idx = (i + 1) as Step;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "h-7 w-7 rounded-full grid place-items-center text-xs font-semibold transition-all shrink-0",
              done && "bg-primary text-primary-foreground",
              active && "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
              !done && !active && "bg-muted text-muted-foreground",
            )}>
              {done ? <Check className="h-3.5 w-3.5" /> : idx}
            </div>
            <span className={cn("text-[11px] font-medium hidden sm:inline truncate", active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className={cn("h-px flex-1 transition-colors", done ? "bg-primary" : "bg-border")} />}
          </div>
        );
      })}
    </div>
  );
}

function Step1({ value, onChange, classified, onSubmit, loading }: {
  value: string; onChange: (v: string) => void; classified: ReturnType<typeof classifyDomain>;
  onSubmit: () => void; loading: boolean;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Enter your domain</h3>
        <p className="text-sm text-muted-foreground">Use a domain you already own — root, www, or subdomain.</p>
      </div>
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="store.example.com"
          className="pl-9 h-12 text-base"
          onKeyDown={(e) => { if (e.key === "Enter" && classified) onSubmit(); }}
        />
      </div>
      {value && (
        <div className={cn("rounded-lg border p-3 text-sm", classified ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5")}>
          {classified ? (
            <div className="flex items-center justify-between">
              <span className="text-foreground">Detected: <span className="font-mono font-medium">{classified.domain}</span></span>
              <Badge variant="secondary" className="capitalize">{classified.type}</Badge>
            </div>
          ) : (
            <span className="text-destructive">Not a valid domain. Example: store.com or shop.mybrand.com</span>
          )}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          { k: "Root", v: "store.com" },
          { k: "WWW", v: "www.store.com" },
          { k: "Subdomain", v: "shop.store.com" },
        ].map((x) => (
          <div key={x.k} className="rounded-lg border bg-card p-3">
            <div className="font-medium">{x.k}</div>
            <div className="text-muted-foreground font-mono">{x.v}</div>
          </div>
        ))}
      </div>
      <Button onClick={onSubmit} disabled={!classified || loading} className="w-full h-11">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </div>
  );
}

function Step2({ row, copy, copied, onNext }: {
  row: { domain: string; dns_records: DnsRecord[]; detected_provider: string };
  copy: (k: string, t: string) => void; copied: string | null; onNext: () => void;
}) {
  const provider = PROVIDER_GUIDES[row.detected_provider] ?? PROVIDER_GUIDES.other;
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Add these DNS records</h3>
          <p className="text-sm text-muted-foreground">Copy each record into your DNS provider's dashboard.</p>
        </div>
        <Badge variant="outline" className="gap-1.5" style={{ borderColor: provider.color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: provider.color }} />
          {provider.name} detected
        </Badge>
      </div>
      <div className="space-y-2.5">
        {row.dns_records.map((r, i) => {
          const key = `${r.type}-${i}`;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl border bg-card p-4 hover:border-primary/40 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Badge className="font-mono text-[10px]">{r.type}</Badge>
                <span className="text-xs text-muted-foreground">{r.description}</span>
              </div>
              <div className="grid grid-cols-12 gap-2 text-xs">
                <Field label="Name" value={r.name} copyKey={`${key}-n`} copy={copy} copied={copied} className="col-span-3" />
                <Field label="Value" value={r.value} copyKey={`${key}-v`} copy={copy} copied={copied} className="col-span-7 font-mono" />
                <Field label="TTL" value={String(r.ttl)} copyKey={`${key}-t`} copy={copy} copied={copied} className="col-span-2" />
              </div>
            </motion.div>
          );
        })}
      </div>
      <Button onClick={onNext} className="w-full h-11">I've added the records <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}

function Field({ label, value, copyKey, copy, copied, className }: {
  label: string; value: string; copyKey: string;
  copy: (k: string, t: string) => void; copied: string | null; className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <button
        type="button"
        onClick={() => copy(copyKey, value)}
        className="w-full flex items-center justify-between gap-2 rounded-md bg-muted/60 hover:bg-muted px-2 py-1.5 text-left transition-colors"
      >
        <span className="truncate">{value}</span>
        {copied === copyKey ? <Check className="h-3 w-3 text-primary shrink-0" /> : <Copy className="h-3 w-3 text-muted-foreground shrink-0" />}
      </button>
    </div>
  );
}

function Step3({ row, onNext }: { row: { detected_provider: string }; onNext: () => void }) {
  const provider = PROVIDER_GUIDES[row.detected_provider] ?? PROVIDER_GUIDES.other;
  const cards = [
    { icon: ExternalLink, title: `Open ${provider.name}`, desc: "Sign in to your domain provider dashboard." },
    { icon: Server, title: "Find DNS settings", desc: "Look for 'DNS', 'Zone Editor', or 'Manage DNS'." },
    { icon: Wand2, title: "Add the records", desc: "Paste each record exactly as shown in the previous step." },
    { icon: Check, title: "Save changes", desc: "DNS usually propagates within 1–10 minutes." },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Quick visual guide</h3>
        <p className="text-sm text-muted-foreground">Follow these 4 steps in your DNS provider.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {cards.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary grid place-items-center text-sm font-semibold">{i + 1}</div>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="font-medium text-sm">{c.title}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.desc}</div>
          </motion.div>
        ))}
      </div>
      {provider.url && (
        <a href={provider.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          Open {provider.name} dashboard <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
      <Button onClick={onNext} className="w-full h-11">Verify connection <ArrowRight className="h-4 w-4" /></Button>
    </div>
  );
}

function Step4({ verifying, attempts, error, domain }: { verifying: boolean; attempts: number; error: string | null; domain: string }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col items-center text-center py-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center">
            <Globe className="h-10 w-10 text-primary" />
          </div>
          {verifying && (
            <>
              <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
              <span className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse" />
            </>
          )}
        </div>
        <h3 className="mt-5 text-lg font-semibold">Checking DNS for {domain}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {verifying ? "Querying global DNS resolvers…" : "Waiting before next check…"}
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3" /> Attempt {attempts || 1} • auto-retry every 6s
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 flex gap-2 text-sm">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-amber-700 dark:text-amber-400">DNS not detected yet</div>
            <div className="text-xs text-muted-foreground mt-0.5">{error} Most providers take 1–10 minutes to propagate.</div>
          </div>
        </div>
      )}

      <Accordion type="single" collapsible>
        <AccordionItem value="trouble">
          <AccordionTrigger className="text-sm"><HelpCircle className="h-4 w-4 mr-2" /> Troubleshooting & FAQ</AccordionTrigger>
          <AccordionContent className="space-y-3 text-sm text-muted-foreground">
            <Faq q="How long does DNS take?" a="Usually 1–10 minutes, but can take up to 24 hours depending on your provider and TTL." />
            <Faq q="My provider isn't listed" a="Any provider works. Just look for the DNS / Zone Editor section in their dashboard." />
            <Faq q="Do I need to keep both A and TXT records?" a="Yes — the A/CNAME routes traffic, and the TXT proves you own the domain." />
            <Faq q="When does SSL turn on?" a="Automatically, within ~60 seconds after DNS verifies successfully." />
            <Faq q="Can I use Cloudflare proxy (orange cloud)?" a="Yes, but disable proxying initially so we can verify, then re-enable it." />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <div className="font-medium text-foreground text-sm">{q}</div>
      <div className="text-xs">{a}</div>
    </div>
  );
}

function Step5({ domain, onClose }: { domain: string; onClose: () => void }) {
  return (
    <div className="text-center py-4">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.6 }}
        className="mx-auto h-24 w-24 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 grid place-items-center shadow-xl shadow-emerald-500/30"
      >
        <Check className="h-12 w-12 text-white" strokeWidth={3} />
      </motion.div>
      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-5 text-2xl font-bold">
        🎉 Domain connected!
      </motion.h3>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-2 text-muted-foreground">
        <span className="font-mono text-foreground">{domain}</span> is now live with auto-SSL.
      </motion.p>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-6 grid grid-cols-3 gap-3 max-w-md mx-auto">
        {[
          { icon: Globe, label: "Domain live" },
          { icon: ShieldCheck, label: "SSL active" },
          { icon: Sparkles, label: "Store published" },
        ].map((x) => (
          <div key={x.label} className="rounded-xl border bg-card p-3">
            <x.icon className="h-5 w-5 text-emerald-500 mx-auto" />
            <div className="text-xs mt-1.5 font-medium">{x.label}</div>
          </div>
        ))}
      </motion.div>

      <Button onClick={onClose} className="mt-6 h-11 px-8">Done</Button>
    </div>
  );
}
