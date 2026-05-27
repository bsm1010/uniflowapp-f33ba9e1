import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAuthenticatedDeliveryClient } from "./authenticated-client";
import { pushOrderInternal } from "./push-order.functions";

const BulkInputSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  orderId: z.string().uuid(),
  companyIds: z.array(z.string().uuid()).min(1).max(20),
});

export type BulkPushResult =
  | { ok: true; results: Array<{ companyId: string; ok: boolean; message: string; trackingNumber?: string }> }
  | { ok: false; message: string };

/**
 * Push a single order to multiple delivery providers at once.
 * Each push is independent — one failure does not block the others.
 */
export const bulkPushOrderToProviders = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => BulkInputSchema.parse(input))
  .handler(async ({ data }): Promise<BulkPushResult> => {
    try {
      const auth = await createAuthenticatedDeliveryClient(data.accessToken);
      if ("error" in auth) {
        return { ok: false, message: "Your session expired. Please sign in again." };
      }
      const { client: supabase, userId } = auth;

      const results = await Promise.allSettled(
        data.companyIds.map((companyId) =>
          pushOrderInternal(supabase, userId, data.orderId, companyId),
        ),
      );

      return {
        ok: true,
        results: results.map((r, i) => {
          const companyId = data.companyIds[i];
          if (r.status === "fulfilled") {
            return { companyId, ...r.value };
          }
          return { companyId, ok: false, message: r.reason?.message ?? "Unexpected error" };
        }),
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unexpected server error.";
      return { ok: false, message: msg };
    }
  });
