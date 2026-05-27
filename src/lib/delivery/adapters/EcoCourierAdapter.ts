import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const ECO_BASE_URL = "https://api.ecocourier.dz/v1";

export class EcoCourierAdapter extends BaseDeliveryAdapter {
  readonly key = "eco_courier";
  readonly label = "Eco Courier";

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.apiKey}`,
      "X-Api-Secret": this.credentials.apiSecret ?? "",
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "API key is required." };
    }
    try {
      await this.request<unknown>(`${ECO_BASE_URL}/auth/verify`, {
        method: "GET",
        headers: this.authHeaders(),
        timeoutMs: 10_000,
      });
      return { ok: true, message: "Eco Courier credentials verified." };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const lower = raw.toLowerCase();
      if (lower.includes("401") || lower.includes("403") || lower.includes("unauthor")) {
        return { ok: false, message: "Invalid Eco Courier API key." };
      }
      if (lower.includes("aborted") || lower.includes("timeout")) {
        return { ok: false, message: "Eco Courier API timed out. Try again." };
      }
      return { ok: false, message: "Could not reach Eco Courier. Check your credentials." };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber: this.generateTrackingNumber("ECO"), status: "created" };
    }
    const body = {
      orderRef: input.orderId,
      customer: input.customerName,
      phone: input.customerPhone,
      wilaya: input.wilaya,
      commune: input.commune ?? input.wilaya,
      address: input.address,
      description: input.productName ?? "Order",
      codAmount: Math.round(input.totalPrice),
      weight: input.weight ?? 1,
      note: input.notes ?? "",
    };
    const data = await this.request<{ trackingNumber?: string; id?: string }>(
      `${ECO_BASE_URL}/shipments`,
      {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return {
      trackingNumber: data.trackingNumber ?? data.id ?? this.generateTrackingNumber("ECO"),
      status: "created",
      raw: data,
    };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber, status: "in_transit" };
    }
    const data = await this.request<{
      status?: string;
      lastUpdate?: string;
      history?: Array<{ status: string; date: string; location?: string }>;
    }>(`${ECO_BASE_URL}/shipments/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return {
      trackingNumber,
      status: mapEcoStatus(data.status),
      lastUpdate: data.lastUpdate,
      history: data.history,
      raw: data,
    };
  }
}

function mapEcoStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr") || s.includes("delivered")) return "delivered";
  if (s.includes("transit") || s.includes("expedi") || s.includes("shipped")) return "in_transit";
  if (s.includes("annul") || s.includes("cancelled")) return "cancelled";
  if (s.includes("echec") || s.includes("failed") || s.includes("retour")) return "failed";
  if (s.includes("pret") || s.includes("created") || s.includes("pending")) return "created";
  return "pending";
}
