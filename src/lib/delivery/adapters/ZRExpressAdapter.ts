import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const ZR_BASE_URL = "https://procolis.com/api_v1";

/**
 * Adapter for ZR Express (Procolis API).
 * Same fallback behavior as Yalidine when credentials are missing.
 */
export class ZRExpressAdapter extends BaseDeliveryAdapter {
  readonly key = "zr_express";
  readonly label = "ZR Express";

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "API token is required." };
    }
    if (!this.credentials.apiSecret || !this.credentials.apiSecret.trim()) {
      return { ok: false, message: "ZR Express requires both a token and a key." };
    }
    try {
      // `token` endpoint validates the token/key pair without side effects.
      await this.request<unknown>(`${ZR_BASE_URL}/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          token: this.credentials.apiKey,
          key: this.credentials.apiSecret,
        },
        body: JSON.stringify({}),
        timeoutMs: 10_000,
      });
      return { ok: true, message: "ZR Express credentials verified." };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const lower = raw.toLowerCase();
      if (lower.includes("401") || lower.includes("403") || lower.includes("unauthor")) {
        return { ok: false, message: "Invalid ZR Express token or key." };
      }
      if (lower.includes("aborted") || lower.includes("timeout")) {
        return { ok: false, message: "ZR Express API timed out. Try again." };
      }
      return { ok: false, message: "Could not reach ZR Express. Check your credentials." };
    }
  }

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
