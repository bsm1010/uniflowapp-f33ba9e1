import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const DHD_BASE_URL = "https://api.dhd-dz.com/v1";

export class DHDAdapter extends BaseDeliveryAdapter {
  readonly key = "dhd";
  readonly label = "DHD Livraison Express";

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.apiKey}`,
      "X-Store-Id": this.credentials.apiSecret ?? "",
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "API key is required." };
    }
    try {
      await this.request<unknown>(`${DHD_BASE_URL}/auth/check`, {
        method: "GET",
        headers: this.authHeaders(),
        timeoutMs: 10_000,
      });
      return { ok: true, message: "DHD credentials verified." };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.includes("401") || raw.includes("403")) {
        return { ok: false, message: "Invalid DHD API key." };
      }
      if (raw.includes("timeout") || raw.includes("aborted")) {
        return { ok: false, message: "DHD API timed out." };
      }
      return { ok: false, message: "Could not reach DHD. Check your credentials." };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber: this.generateTrackingNumber("DHD"), status: "created" };
    }
    const body = {
      orderId: input.orderId,
      clientName: input.customerName,
      phone: input.customerPhone,
      wilaya: input.wilaya,
      commune: input.commune ?? input.wilaya,
      adresse: input.address,
      produit: input.productName ?? "Order",
      montant: Math.round(input.totalPrice),
      poids: input.weight ?? 1,
      remarque: input.notes ?? "",
    };
    const data = await this.request<{ trackingNumber?: string; id?: string }>(
      `${DHD_BASE_URL}/shipments`,
      {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return {
      trackingNumber: data.trackingNumber ?? data.id ?? this.generateTrackingNumber("DHD"),
      status: "created",
      raw: data,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber, status: "in_transit" };
    }
    const data = await this.request<{
      statut?: string;
      lastUpdate?: string;
      history?: Array<{ status: string; date: string; location?: string }>;
    }>(`${DHD_BASE_URL}/shipments/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return {
      trackingNumber,
      status: mapDHDStatus(data.statut ?? data.status),
      lastUpdate: data.lastUpdate,
      history: data.history,
      raw: data,
    };
  }
}

function mapDHDStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr") || s.includes("delivered")) return "delivered";
  if (s.includes("transit") || s.includes("shipped") || s.includes("expedi")) return "in_transit";
  if (s.includes("annul") || s.includes("cancelled")) return "cancelled";
  if (s.includes("echec") || s.includes("failed") || s.includes("retour")) return "failed";
  if (s.includes("pret") || s.includes("created") || s.includes("pending")) return "created";
  return "pending";
}
