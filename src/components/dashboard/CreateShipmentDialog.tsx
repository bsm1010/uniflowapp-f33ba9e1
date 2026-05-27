import { useEffect, useMemo, useState } from "react";
import { Loader2, Truck, Wand2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Order = Tables<"orders">;
type Company = { id: string; name: string };

function generateTracking(prefix = "TRK") {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString().slice(-6);
  return `${prefix}-${ts}${rand}`;
}

export function CreateShipmentDialog({
  order,
  open,
  onOpenChange,
  onCreated,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [defaultId, setDefaultId] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [tracking, setTracking] = useState("");
  const [status, setStatus] = useState("pending");
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const { data: enabled } = await supabase
        .from("store_delivery_companies")
        .select("company_id, enabled, is_default")
        .eq("store_id", user.id)
        .eq("enabled", true);
      const ids = (enabled ?? []).map((r) => r.company_id);
      if (!ids.length) {
        setCompanies([]);
        return;
      }
      const { data: comps } = await supabase
        .from("delivery_companies")
        .select("id, name")
        .in("id", ids)
        .eq("is_active", true)
        .order("name");
      setCompanies(comps ?? []);
      const def = (enabled ?? []).find((r) => r.is_default)?.company_id ?? ids[0];
      setDefaultId(def);
      setCompanyId(def);
      setTracking(generateTracking());
      setStatus("pending");
      setMode("auto");
    })();
  }, [open, user]);

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === companyId),
    [companies, companyId],
  );

  const submit = async () => {
    if (!user || !order) return;
    if (!companyId) {
      toast.error("Pick a delivery company");
      return;
    }
    const finalTracking =
      mode === "auto"
        ? generateTracking(selectedCompany?.name.slice(0, 3).toUpperCase())
        : tracking.trim();
    if (!finalTracking) {
      toast.error("Tracking number is required");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("shipments").insert({
      store_id: user.id,
      order_id: order.id,
      company_id: companyId,
      tracking_number: finalTracking,
      status: mode === "auto" ? "created" : status,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to create shipment");
      return;
    }
    toast.success(`Shipment ${finalTracking} created`);
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Create shipment
          </DialogTitle>
          <DialogDescription>
            Send order details to a delivery company and save the tracking number.
          </DialogDescription>
        </DialogHeader>

        {order && (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-mono">{order.shipping_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Wilaya</span>
              <span>{order.shipping_postal_code || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Address</span>
              <span className="text-right max-w-[60%] truncate">
                {order.shipping_city}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">
                {Number(order.total).toFixed(2)} DA
              </span>
            </div>
          </div>
        )}

        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No delivery companies enabled. Enable one in Shipping settings first.
          </p>
        ) : (
          <Tabs value={mode} onValueChange={(v) => setMode(v as "auto" | "manual")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="auto" className="gap-1.5">
                <Wand2 className="h-3.5 w-3.5" /> Automatic
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-1.5">
                <PencilLine className="h-3.5 w-3.5" /> Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="auto" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label>Delivery company</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.id === defaultId && " (default)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                A tracking number will be generated automatically and the shipment
                will be marked as <span className="font-medium">created</span>.
              </p>
            </TabsContent>

            <TabsContent value="manual" className="space-y-3 pt-3">
              <div className="space-y-1.5">
                <Label>Delivery company</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tracking number</Label>
                <Input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="e.g. YAL-123456ABCDEF"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="created">Created</SelectItem>
                    <SelectItem value="picked_up">Picked up</SelectItem>
                    <SelectItem value="in_transit">In transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || companies.length === 0 || !companyId}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create shipment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
