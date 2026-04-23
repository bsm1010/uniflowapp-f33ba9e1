import { useEffect, useState } from "react";
import { Truck, Loader2, Star, ShieldCheck, AlertCircle, CheckCircle2, XCircle, Lock, Plug, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { validateAndActivateDeliveryCompany } from "@/lib/delivery/validate.functions";
import {
  listStoreDeliveryCompanies,
  setStoreDeliveryCompanyDefault,
  setStoreDeliveryCompanyEnabled,
  type StoreCompanyView,
} from "@/lib/delivery/store-companies.functions";
import zrExpressLogo from "@/assets/zrexpress-logo.png";
import yalidineLogo from "@/assets/yalidine-logo.png";

type Company = { id: string; name: string };

/** Map a company name to a logo asset (normalized: lowercase, no spaces/dashes). */
const COMPANY_LOGOS: Record<string, string> = {
  zrexpress: zrExpressLogo,
  zr_express: zrExpressLogo,
  yalidine: yalidineLogo,
  yalidine_express: yalidineLogo,
};

function getCompanyLogo(name: string): string | undefined {
  const key = name.toLowerCase().trim().replace(/[\s-]+/g, "_").replace(/_/g, "");
  return COMPANY_LOGOS[key] ?? COMPANY_LOGOS[name.toLowerCase().trim().replace(/[\s-]+/g, "_")];
}

/**
 * Secrets-safe shipping companies UI.
 *
 * Raw API keys/secrets are never sent to the browser. The list endpoint returns
 * only metadata (`has_key`, `key_tail`); enabling/disabling and setting default
 * are done via dedicated server functions so the client never holds credentials.
 */
export function ShippingCompaniesSection() {
  const { user, session } = useAuth();
  const validateFn = useServerFn(validateAndActivateDeliveryCompany);
  const listFn = useServerFn(listStoreDeliveryCompanies);
  const setEnabledFn = useServerFn(setStoreDeliveryCompanyEnabled);
  const setDefaultFn = useServerFn(setStoreDeliveryCompanyDefault);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [rows, setRows] = useState<Record<string, StoreCompanyView>>({});
  const [draftJson, setDraftJson] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    Record<string, { ok: boolean; message: string } | undefined>
  >({});

  useEffect(() => {
    if (!user || !session?.access_token) return;
    (async () => {
      setLoading(true);
      try {
        const [{ data: comps }, listed] = await Promise.all([
          supabase
            .from("delivery_companies")
            .select("id, name")
            .eq("is_active", true)
            .order("name"),
          listFn({ data: { accessToken: session.access_token } }),
        ]);
        const list = (comps ?? []) as Company[];
        setCompanies(list);
        const map: Record<string, StoreCompanyView> = {};
        for (const c of list) {
          map[c.id] = {
            company_id: c.id,
            enabled: false,
            is_default: false,
            has_key: false,
            has_secret: false,
            key_tail: "",
          };
        }
        for (const r of listed.rows) map[r.company_id] = r;
        setRows(map);
      } catch {
        toast.error("Failed to load shipping companies.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user, session?.access_token, listFn]);

  const setEnabled = async (companyId: string, enabled: boolean) => {
    if (!session?.access_token) {
      toast.error("Please sign in again.");
      return;
    }
    setBusyId(companyId);
    try {
      const res = await setEnabledFn({ data: { accessToken: session.access_token, companyId, enabled } });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setRows((p) => ({
        ...p,
        [companyId]: {
          ...p[companyId],
          enabled,
          is_default: enabled ? p[companyId]?.is_default : false,
        },
      }));
    } catch {
      toast.error("Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const setAsDefault = async (companyId: string) => {
    if (!session?.access_token) {
      toast.error("Please sign in again.");
      return;
    }
    setBusyId(companyId);
    try {
      const res = await setDefaultFn({ data: { accessToken: session.access_token, companyId } });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      setRows((p) => {
        const copy = { ...p };
        for (const id of Object.keys(copy)) {
          copy[id] = { ...copy[id], is_default: id === companyId };
        }
        return copy;
      });
    } catch {
      toast.error("Failed to set default");
    } finally {
      setBusyId(null);
    }
  };

  const connect = async (companyId: string) => {
    const raw = (draftJson[companyId] ?? "").trim();
    if (!raw) {
      const msg = "Please paste your API credentials as JSON.";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
      toast.error(msg);
      return;
    }
    let apiKey = "";
    let apiSecret = "";
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const msg = "Invalid JSON format. Please paste valid credentials.";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
      toast.error(msg);
      return;
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      const msg = "Invalid JSON format. Please paste valid credentials.";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
      toast.error(msg);
      return;
    }
    // Expected format: { secretKey, tenantId, createdAt?, expireInDays? }
    const obj = parsed as Record<string, unknown>;
    const sk = obj.secretKey;
    const tid = obj.tenantId;
    if (typeof sk !== "string" || !sk.trim() || typeof tid !== "string" || !tid.trim()) {
      const msg = "Missing required fields (secretKey or tenantId)";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
      toast.error(msg);
      return;
    }
    apiKey = sk.trim();
    apiSecret = tid.trim();
    if (!user || !session?.access_token) {
      const msg = "Please sign in again to connect.";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
      toast.error(msg);
      return;
    }
    setValidatingId(companyId);
    setValidationStatus((p) => ({ ...p, [companyId]: undefined }));
    try {
      const res = await validateFn({
        data: {
          accessToken: session.access_token,
          companyId,
          apiKey,
          apiSecret,
          setDefault: false,
        },
      });
      if (!res.ok) {
        const msg = res.message || "Could not connect. Check your credentials and try again.";
        setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
        toast.error(msg);
        return;
      }
      const msg = "Connected successfully.";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: true, message: msg } }));
      toast.success(msg);
      setRows((p) => ({
        ...p,
        [companyId]: {
          ...p[companyId],
          enabled: true,
          has_key: true,
          has_secret: !!apiSecret,
          key_tail: apiKey.slice(-4),
        },
      }));
      setDraftJson((p) => ({ ...p, [companyId]: "" }));
    } catch {
      const msg = "Could not connect. Check your credentials and try again.";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
      toast.error(msg);
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold leading-none">Shipping Companies</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              API keys are stored securely on the server. Only the last 4 characters are shown.
            </p>
          </div>
        </div>
        <Badge variant="secondary">{companies.length} available</Badge>
      </div>

      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : companies.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            No shipping companies available yet.
          </div>
        ) : (
          <ul className="divide-y">
            {companies.map((c) => {
              const r = rows[c.id];
              const draftJsonRaw = (draftJson[c.id] ?? "").trim();
              const draftHasJson = draftJsonRaw.length > 0;
              const status = validationStatus[c.id];
              const isValidating = validatingId === c.id;
              // Connection state: error > connecting > connected > not_connected
              const connState: "not_connected" | "connecting" | "connected" | "error" =
                isValidating
                  ? "connecting"
                  : status
                    ? status.ok
                      ? "connected"
                      : "error"
                    : r?.has_key && !draftHasJson
                      ? "connected"
                      : "not_connected";
              const canEnable = connState === "connected";
              const textareaBorder =
                connState === "error"
                  ? "border-destructive/70 focus-visible:ring-destructive/40"
                  : connState === "connected" && draftHasJson
                    ? "border-emerald-500/60 focus-visible:ring-emerald-500/40"
                    : "";

              return (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const logo = getCompanyLogo(c.name);
                        return logo ? (
                          <img
                            src={logo}
                            alt={`${c.name} logo`}
                            className="h-10 w-10 rounded-md border bg-background object-contain"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-sm font-bold text-primary">
                            {c.name.charAt(0)}
                          </div>
                        );
                      })()}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{c.name}</p>
                          {r?.is_default && (
                            <Badge className="gap-1 bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">
                              <Star className="h-3 w-3 fill-current" />
                              Default
                            </Badge>
                          )}
                          {connState === "connected" && (
                            <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">
                              <PlugZap className="h-3 w-3" />
                              Connected
                            </Badge>
                          )}
                          {connState === "connecting" && (
                            <Badge className="gap-1 bg-sky-500/15 text-sky-600 hover:bg-sky-500/20">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Connecting…
                            </Badge>
                          )}
                          {connState === "error" && (
                            <Badge className="gap-1 bg-destructive/15 text-destructive hover:bg-destructive/20">
                              <XCircle className="h-3 w-3" />
                              Error
                            </Badge>
                          )}
                          {connState === "not_connected" && (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <AlertCircle className="h-3 w-3" />
                              Not connected
                            </Badge>
                          )}
                          {r?.has_key && (
                            <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                              <Lock className="h-3 w-3" />
                              ••••{r.key_tail}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r?.enabled
                            ? "Active for your store"
                            : canEnable
                              ? "Connected — toggle to enable"
                              : "Paste your API credentials and click Connect"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {busyId === c.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant={r?.is_default ? "secondary" : "outline"}
                        disabled={!r?.enabled || r?.is_default}
                        onClick={() => setAsDefault(c.id)}
                        className="gap-1.5"
                      >
                        <Star
                          className={`h-3.5 w-3.5 ${r?.is_default ? "fill-current" : ""}`}
                        />
                        {r?.is_default ? "Default" : "Set default"}
                      </Button>
                      <Switch
                        checked={!!r?.enabled}
                        disabled={!r?.enabled && !canEnable}
                        onCheckedChange={(v) => setEnabled(c.id, v)}
                        aria-label={
                          !r?.enabled && !canEnable
                            ? "Validate API key first"
                            : "Toggle company"
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <label
                      htmlFor={`creds-${c.id}`}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <Lock className="h-3 w-3" />
                      Paste your API credentials (JSON)
                    </label>
                    <Textarea
                      id={`creds-${c.id}`}
                      placeholder={`{\n  "secretKey": "...",\n  "tenantId": "...",\n  "createdAt": "...",\n  "expireInDays": 365\n}`}
                      autoComplete="off"
                      spellCheck={false}
                      rows={5}
                      value={draftJson[c.id] ?? ""}
                      onChange={(e) => {
                        setDraftJson((p) => ({ ...p, [c.id]: e.target.value }));
                        setValidationStatus((p) => ({ ...p, [c.id]: undefined }));
                      }}
                      className={`font-mono text-xs leading-relaxed transition-colors ${textareaBorder}`}
                    />
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] text-muted-foreground">
                        Stored encrypted on the server. Only the last 4 chars are shown.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => connect(c.id)}
                        disabled={isValidating || !draftHasJson}
                        className="gap-1.5"
                      >
                        {isValidating ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Plug className="h-3.5 w-3.5" />
                        )}
                        {isValidating ? "Connecting…" : r?.has_key ? "Reconnect" : "Connect"}
                      </Button>
                    </div>
                  </div>

                  {(isValidating || validationStatus[c.id]) && (
                    <div
                      role="status"
                      aria-live="polite"
                      className={`mt-3 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                        isValidating
                          ? "border-border bg-muted/40 text-muted-foreground"
                          : validationStatus[c.id]?.ok
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "border-destructive/30 bg-destructive/10 text-destructive"
                      }`}
                    >
                      {isValidating ? (
                        <>
                          <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin" />
                          <span>Connecting…</span>
                        </>
                      ) : validationStatus[c.id]?.ok ? (
                        <>
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{validationStatus[c.id]?.message}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{validationStatus[c.id]?.message}</span>
                        </>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
