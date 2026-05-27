import { supabase } from "@/integrations/supabase/client";
import { getAdapterCtor, normalizeProviderKey } from "./registry";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  DeliveryAdapter,
  TrackingResult,
} from "./types";

/**
 * High-level facade used by UI/business code.
 * Resolves the right adapter for a given store + delivery company,
 * pulls credentials from `store_delivery_companies`, and delegates the call.
 *
 * UI components should depend on this service — never directly on adapters —
 * so swapping/extending providers stays a one-line change in registry.ts.
 */
export class DeliveryService {
  /** Build an adapter for a given store + delivery company id. */
  static async getAdapterForStore(
    storeId: string,
    companyId: string,
  ): Promise<DeliveryAdapter | null> {
    const { data: company } = await supabase
      .from("delivery_companies")
      .select("id, name, is_active")
      .eq("id", companyId)
      .maybeSingle();

    if (!company || !company.is_active) return null;

    const Ctor = getAdapterCtor(company.name);
    if (!Ctor) return null;

    const { data: link } = await supabase
      .from("store_delivery_companies")
      .select("api_key, api_secret, enabled")
      .eq("store_id", storeId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (link && link.enabled === false) return null;

    return new Ctor({
      apiKey: link?.api_key ?? "",
      apiSecret: link?.api_secret ?? "",
    });
  }

  /** Resolve the store's default delivery company id, if any. */
  static async getDefaultCompanyId(storeId: string): Promise<string | null> {
    const { data } = await supabase
      .from("store_delivery_companies")
      .select("company_id")
      .eq("store_id", storeId)
      .eq("is_default", true)
      .eq("enabled", true)
      .maybeSingle();
    return data?.company_id ?? null;
  }

  /** Create a shipment using the resolved adapter. */
  static async createShipment(
    storeId: string,
    companyId: string,
    input: CreateShipmentInput,
  ): Promise<CreateShipmentResult> {
    const adapter = await this.getAdapterForStore(storeId, companyId);
    if (!adapter) {
      throw new Error("No active delivery adapter found for this store/company.");
    }
    return adapter.createShipment(input);
  }

  /** Track a shipment using the resolved adapter. */
  static async trackShipment(
    storeId: string,
    companyId: string,
    trackingNumber: string,
  ): Promise<TrackingResult> {
    const adapter = await this.getAdapterForStore(storeId, companyId);
    if (!adapter) {
      throw new Error("No active delivery adapter found for this store/company.");
    }
    return adapter.trackShipment(trackingNumber);
  }
}

export { normalizeProviderKey };
export type { CreateShipmentInput, CreateShipmentResult, TrackingResult, DeliveryAdapter };
