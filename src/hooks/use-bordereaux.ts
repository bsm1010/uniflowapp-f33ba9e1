import { useState, useCallback } from "react";
import { DeliveryService } from "@/lib/delivery/service";
import { mergePDFs, openPDFForPrinting } from "@/lib/pdf-merge";
import { useCurrentStore } from "@/hooks/use-current-store";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type BordereauOrder = {
  id: string;
  zr_colis_id: string;
  customer_name: string;
};

export function useBordereaux() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const { currentStore } = useCurrentStore();

  const printBordereaux = useCallback(
    async (orders: BordereauOrder[]) => {
      const eligible = orders.filter((o) => !!o.zr_colis_id);

      if (eligible.length === 0) {
        toast.error(
          "No orders have been sent to ZR Express yet. Send orders to ZR Express first.",
        );
        return;
      }

      if (!currentStore?.id) {
        toast.error("No store selected.");
        return;
      }

      setLoading(true);
      setProgress({ done: 0, total: eligible.length });

      try {
        // Find the ZR Express company for this store
        const { data: link } = await supabase
          .from("store_delivery_companies")
          .select("company_id")
          .eq("store_id", currentStore.id)
          .eq("enabled", true)
          .maybeSingle();

        if (!link?.company_id) {
          toast.error("No delivery company connected.");
          setLoading(false);
          setProgress(null);
          return;
        }

        const adapter = await DeliveryService.getAdapterForStore(
          currentStore.id,
          link.company_id,
        );

        if (!adapter || !adapter.getBordereau) {
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
            const blob = await adapter.getBordereau(order.zr_colis_id);
            blobs.push(blob);
          } catch (err) {
            console.warn(`Failed to fetch bordereau for ${order.customer_name}:`, err);
            failed.push(order.customer_name);
          }
          setProgress((p) => (p ? { ...p, done: p.done + 1 } : null));
        }

        if (blobs.length === 0) {
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
        console.error("Batch bordereau error:", err);
        toast.error("Failed to generate bordereaux. Please try again.");
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    [currentStore?.id],
  );

  return { printBordereaux, loading, progress };
}
