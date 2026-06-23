import { useState, useCallback } from "react";
import { mergePDFs, openPDFForPrinting } from "@/lib/pdf-merge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchBordereau } from "@/lib/delivery/fetch-bordereau.functions";

export type BordereauOrder = {
  id: string;
  zr_colis_id?: string | null;
  tracking_number?: string | null;
  customer_name: string;
};

function base64ToBlob(b64: string): Blob {
  const raw = b64.includes(",") ? b64.split(",")[1] : b64;
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: "application/pdf" });
}

export function useBordereaux() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const { user } = useAuth();

  const printBordereaux = useCallback(
    async (orders: BordereauOrder[]) => {
      const eligible = orders
        .filter((o) => o.zr_colis_id || o.tracking_number)
        .map((o) => ({
          ...o,
          colisId: o.zr_colis_id || o.tracking_number || "",
        }));

      if (eligible.length === 0) {
        toast.error(
          "No orders have been sent to ZR Express yet. Send orders to ZR Express first.",
        );
        return;
      }

      if (!user?.id) {
        toast.error("Please sign in again.");
        return;
      }

      setLoading(true);
      setProgress({ done: 0, total: eligible.length });

      try {
        const { data: session } = await supabase.auth.getSession();
        const accessToken = session.session?.access_token;
        if (!accessToken) {
          toast.error("Please sign in again.");
          setLoading(false);
          setProgress(null);
          return;
        }

        const blobs: Blob[] = [];
        const failed: string[] = [];

        for (const order of eligible) {
          try {
            const result = await fetchBordereau({ data: { accessToken, colisId: order.colisId } });
            if (result.ok) {
              blobs.push(base64ToBlob(result.pdfBase64));
            } else {
              console.error(`[useBordereaux] Server rejected bordereau for ${order.customer_name}:`, result.message);
              failed.push(order.customer_name);
            }
          } catch (err) {
            console.error(`[useBordereaux] Failed bordereau for ${order.customer_name}:`, { colisId: order.colisId, err });
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

        const merged = blobs.length === 1 ? blobs[0] : await mergePDFs(blobs);
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
        console.error("[useBordereaux] Batch bordereau error:", { err, userId: user?.id });
        toast.error("Failed to generate bordereaux. Please try again.");
      } finally {
        setLoading(false);
        setProgress(null);
      }
    },
    [user?.id],
  );

  return { printBordereaux, loading, progress };
}
