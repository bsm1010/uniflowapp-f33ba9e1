import { useEffect, useState } from "react";
import { Truck, Loader2, Star, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { validateAndActivateDeliveryCompany } from "@/lib/delivery/validate.functions";

type Company = { id: string; name: string };
type StoreRow = {
  company_id: string;
  enabled: boolean;
  is_default: boolean;
  api_key: string;
  api_secret: string;
};

export function ShippingCompaniesSection() {
  const { user } = useAuth();
  const validateFn = useServerFn(validateAndActivateDeliveryCompany);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [rows, setRows] = useState<Record<string, StoreRow>>({});
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [draftKey, setDraftKey] = useState<Record<string, string>>({});
  const [draftSecret, setDraftSecret] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [validatingId, setValidatingId] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<
    Record<string, { ok: boolean; message: string } | undefined>
  >({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const [{ data: comps }, { data: store }] = await Promise.all([
        supabase
          .from("delivery_companies")
          .select("id, name")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("store_delivery_companies")
          .select("company_id, enabled, is_default, api_key, api_secret")
          .eq("store_id", user.id),
      ]);
      const list = (comps ?? []) as Company[];
      setCompanies(list);
      const map: Record<string, StoreRow> = {};
      const dk: Record<string, string> = {};
      const ds: Record<string, string> = {};
      for (const c of list) {
        map[c.id] = {
          company_id: c.id,
          enabled: false,
          is_default: false,
          api_key: "",
          api_secret: "",
        };
        dk[c.id] = "";
        ds[c.id] = "";
      }
      for (const r of (store ?? []) as StoreRow[]) {
        map[r.company_id] = { ...map[r.company_id], ...r };
        dk[r.company_id] = r.api_key ?? "";
        ds[r.company_id] = r.api_secret ?? "";
      }
      setRows(map);
      setDraftKey(dk);
      setDraftSecret(ds);
      setLoading(false);
    })();
  }, [user]);

  /** Disable a company without re-validating credentials. */
  const setEnabled = async (companyId: string, enabled: boolean) => {
    if (!user) return;
    if (enabled) {
      toast.info("Enter your API key and click Validate & Activate.");
      return;
    }
    setBusyId(companyId);
    try {
      const { error } = await supabase.from("store_delivery_companies").upsert(
        {
          store_id: user.id,
          company_id: companyId,
          enabled: false,
          is_default: false,
          api_key: rows[companyId]?.api_key ?? "",
          api_secret: rows[companyId]?.api_secret ?? "",
        },
        { onConflict: "store_id,company_id" },
      );
      if (error) throw error;
      setRows((p) => ({
        ...p,
        [companyId]: { ...p[companyId], enabled: false, is_default: false },
      }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setBusyId(null);
    }
  };

  const setAsDefault = async (companyId: string) => {
    if (!user) return;
    setBusyId(companyId);
    try {
      await supabase
        .from("store_delivery_companies")
        .update({ is_default: false })
        .eq("store_id", user.id)
        .neq("company_id", companyId);
      const { error } = await supabase
        .from("store_delivery_companies")
        .update({ is_default: true })
        .eq("store_id", user.id)
        .eq("company_id", companyId);
      if (error) throw error;
      setRows((p) => {
        const copy = { ...p };
        for (const id of Object.keys(copy)) {
          copy[id] = { ...copy[id], is_default: id === companyId };
        }
        return copy;
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to set default");
    } finally {
      setBusyId(null);
    }
  };

  const validateAndActivate = async (companyId: string) => {
    const apiKey = (draftKey[companyId] ?? "").trim();
    const apiSecret = (draftSecret[companyId] ?? "").trim();
    if (!apiKey) {
      const msg = "API key is required.";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
      toast.error(msg);
      return;
    }
    setValidatingId(companyId);
    setValidationStatus((p) => ({ ...p, [companyId]: undefined }));
    try {
      const res = await validateFn({
        data: { companyId, apiKey, apiSecret, setDefault: false },
      });
      if (!res.ok) {
        const msg = "Invalid API key. Please check and try again";
        setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
        toast.error(msg);
        return;
      }
      const msg = "API key is valid and connected successfully";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: true, message: msg } }));
      toast.success(msg);
      setRows((p) => ({
        ...p,
        [companyId]: {
          ...p[companyId],
          enabled: true,
          api_key: apiKey,
          api_secret: apiSecret,
        },
      }));
    } catch (e) {
      const msg = "Invalid API key. Please check and try again";
      setValidationStatus((p) => ({ ...p, [companyId]: { ok: false, message: msg } }));
      toast.error(e instanceof Error ? e.message : msg);
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
              Add an API key and validate it to activate a carrier.
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
              const visible = !!showKey[c.id];
              const dirty =
                (draftKey[c.id] ?? "") !== (r?.api_key ?? "") ||
                (draftSecret[c.id] ?? "") !== (r?.api_secret ?? "");
              const isValidating = validatingId === c.id;
              return (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-sm font-bold text-primary">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{c.name}</p>
                          {r?.is_default && (
                            <Badge className="gap-1 bg-amber-500/15 text-amber-600 hover:bg-amber-500/20">
                              <Star className="h-3 w-3 fill-current" />
                              Default
                            </Badge>
                          )}
                          {r?.enabled && !r?.is_default && (
                            <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">
                              <ShieldCheck className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                          {!r?.enabled && (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <AlertCircle className="h-3 w-3" />
                              Not verified
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r?.enabled
                            ? "Active for your store"
                            : "Validate an API key to activate"}
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
                        onCheckedChange={(v) => setEnabled(c.id, v)}
                      />
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <div className="relative">
                      <Input
                        type={visible ? "text" : "password"}
                        placeholder={`${c.name} API key / token`}
                        value={draftKey[c.id] ?? ""}
                        onChange={(e) => {
                          setDraftKey((p) => ({ ...p, [c.id]: e.target.value }));
                          setValidationStatus((p) => ({ ...p, [c.id]: undefined }));
                        }}
                        className="pr-10 font-mono text-sm"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowKey((p) => ({ ...p, [c.id]: !p[c.id] }))
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={visible ? "Hide key" : "Show key"}
                      >
                        {visible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <Input
                      type={visible ? "text" : "password"}
                      placeholder="API secret / ID (if required)"
                      value={draftSecret[c.id] ?? ""}
                      onChange={(e) => {
                        setDraftSecret((p) => ({ ...p, [c.id]: e.target.value }));
                        setValidationStatus((p) => ({ ...p, [c.id]: undefined }));
                      }}
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => validateAndActivate(c.id)}
                      disabled={isValidating || !(draftKey[c.id] ?? "").trim()}
                      className="gap-1.5"
                    >
                      {isValidating ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      {isValidating ? "Validating…" : "Validate API Key"}
                    </Button>
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
                          <span>Validating API key…</span>
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
