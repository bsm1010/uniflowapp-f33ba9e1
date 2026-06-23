import { useState, useCallback } from "react";
import { DeliveryService } from "@/lib/delivery/service";
import { mergePDFs, openPDFForPrinting } from "@/lib/pdf-merge";
import { useCurrentStore } from "@/hooks/use-current-store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BordereauOrder = {
  id: string;
  zr_colis_id?: string | null;
  tracking_number?: string | null;
  customer_name: string;
};

export function useBordereaux() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const { currentStore } = useCurrentStore();
  const { user } = useAuth();

  const printBordereaux = useCallback(
    async (orders: BordereauOrder[]) => {
      // Use zr_colis_id if available, otherwise fall back to tracking_number
      const eligible = orders
        .filter((o) => o.zr_colis_id || o.tracking_number)
        .map((o) => ({
          ...o,
          colisId: o.zr_colis_id || o.tracking_number || "",
        }));

      if (eligible.length === 0) {
        console.error("[useBordereaux] No eligible orders:", { orders });
        toast.error(
          "No orders have been sent to ZR Express yet. Send orders to ZR Express first.",
        );
        return;
      }

      if (!currentStore?.id || !user?.id) {
        console.error("[useBordereaux] No store or user selected");
        toast.error("No store selected.");
        return;
      }

      setLoading(true);
      setProgress({ done: 0, total: eligible.length });

      try {
        // Find ZR Express link for this store via join with delivery_companies
        // Note: store_delivery_companies.store_id references the user ID, not the store UUID
        const { data: link } = await supabase
          .from("store_delivery_companies")
          .select("company_id, delivery_companies!inner(name)")
          .eq("store_id", user.id)
          .eq("enabled", true)
          .maybeSingle();

        const companyName = (link as any)?.delivery_companies?.name as string | undefined;
        if (!link?.company_id || !companyName) {
          console.error("[useBordereaux] No enabled delivery company linked to store:", { userId: user.id, storeId: currentStore.id });
          toast.error("No delivery company connected to your store.");
          setLoading(false);
          setProgress(null);
          return;
        }

        if (!companyName.toLowerCase().includes("zr") || !companyName.toLowerCase().includes("express")) {
          console.error("[useBordereaux] Default company is not ZR Express:", { companyName, companyId: link.company_id });
          toast.error("ZR Express is required for bordereau printing. Set it as your delivery company.");
          setLoading(false);
          setProgress(null);
          return;
        }

        const adapter = await DeliveryService.getAdapterForStore(
          user.id,
          link.company_id,
        );

        if (!adapter || !adapter.getBordereau) {
          console.error("[useBordereaux] Adapter has no getBordereau method:", { adapterKey: adapter?.key, companyId: link.company_id });
          toast.error("This delivery provider does not support bordereau printing.");
          setLoading(false);
          setProgress(null);
          return;
        }

        // Fetch bordereaux with progress tracking
        const blobs: Blob[] = [];
        const failed: string[] = [];

        for (const order of eligible) {
          try {
            const blob = await adapter.getBordereau(order.colisId);
            blobs.push(blob);
          } catch (err) {
            console.error(`[useBordereaux] Failed bordereau for ${order.customer_name}:`, { colisId: order.colisId, err });
            failed.push(order.customer_name);
          }
          setProgress((p) => (p ? { ...p, done: p.done + 1 } : null));
        }

        if (blobs.length === 0) {
          console.error("[useBordereaux] All bordereau fetches failed:", { eligible, failed });
          toast.error(
            "Could not fetch any bordereaux from ZR Express. Check your API connection.",
          );
          return;
        }

        // Merge all PDFs into one
        const merged = blobs.length === 1 ? blobs[0] : await mergePDFs(blobs);

        // Open for printing
        openPDFForPrinting(merged);

        if (failed.length > 0) {
          toast.warning(
            `Printed ${blobs.length} bordereaux. Failed for: ${failed.join(", ")}`,
          );
        } else {
          toast.success(
            `${blobs.length} bordereau${blobs.length > 1 ? "x" : ""} ready to print`,
          );
        }
      } catch (err) {
        console.error("[useBordereaux] Batch bordereau error:", { err, orders: eligible, userId: user?.id, storeId: currentStore?.id });
        toast.error("Failed to generate bordereaux. Please try again.");
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    [currentStore?.id, user?.id],
  );

  return { printBordereaux, loading, progress };
}
