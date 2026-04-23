import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
} from "../types";

const ZR_BASE_URL = "https://procolis.com/api_v1";

/**
 * Adapter for ZR Express (Procolis API).
 * Same fallback behavior as Yalidine when credentials are missing.
 */
export class ZRExpressAdapter extends BaseDeliveryAdapter {
  readonly key = "zr_express";
  readonly label = "ZR Express";

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return {
        trackingNumber: this.generateTrackingNumber("ZRE"),
        status: "created",
      };
    }

    const payload = {
      Colis: [
        {
          Tracking: input.orderId,
          TypeLivraison: "0",
          TypeColis: "0",
          Confrimee: "",
          Client: input.customerName,
          MobileA: input.customerPhone,
          MobileB: "",
          Adresse: input.address,
          IDWilaya: input.wilaya,
          Commune: input.commune ?? input.wilaya,
          Total: String(Math.round(input.totalPrice)),
          Note: input.notes ?? "",
          TProduit: input.productName ?? "Order",
          id_Externe: input.orderId,
          Source: "",
        },
      ],
    };

    const data = await this.request<{
      Colis?: Array<{ Tracking?: string; MessageRetour?: string }>;
    }>(`${ZR_BASE_URL}/add_colis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: this.credentials.apiKey,
        key: this.credentials.apiSecret ?? "",
      },
      body: JSON.stringify(payload),
    });

    const tracking = data.Colis?.[0]?.Tracking ?? this.generateTrackingNumber("ZRE");
    return { trackingNumber: tracking, status: "created", raw: data };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber, status: "in_transit" };
    }

    const data = await this.request<{
      Colis?: Array<{ Situation?: string; DateH_Action?: string }>;
    }>(`${ZR_BASE_URL}/lire`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: this.credentials.apiKey,
        key: this.credentials.apiSecret ?? "",
      },
      body: JSON.stringify({ Colis: [{ Tracking: trackingNumber }] }),
    });

    const entry = data.Colis?.[0];
    return {
      trackingNumber,
      status: mapZRStatus(entry?.Situation),
      lastUpdate: entry?.DateH_Action,
      raw: data,
    };
  }
}

function mapZRStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr")) return "delivered";
  if (s.includes("transit") || s.includes("route") || s.includes("expedi")) return "in_transit";
  if (s.includes("annul")) return "cancelled";
  if (s.includes("retour") || s.includes("echec")) return "failed";
  if (s.includes("pret") || s.includes("cree")) return "created";
  return "pending";
}
