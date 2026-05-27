import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const GUEPEX_BASE_URL = "https://api.guepex.dz/v1";

export class GuepexAdapter extends BaseDeliveryAdapter {
  readonly key = "guepex";
  readonly label = "Guepex";

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.apiKey}`,
      "X-Tenant": this.credentials.apiSecret ?? "",
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "API key is required." };
    }
    try {
      await this.request<unknown>(`${GUEPEX_BASE_URL}/ping`, {
        method: "GET",
        headers: this.authHeaders(),
        timeoutMs: 10_000,
      });
      return { ok: true, message: "Guepex credentials verified." };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.includes("401") || raw.includes("403")) {
        return { ok: false, message: "Invalid Guepex API key." };
      }
      if (raw.includes("timeout") || raw.includes("aborted")) {
        return { ok: false, message: "Guepex API timed out." };
      }
      return { ok: false, message: "Could not reach Guepex. Check your credentials." };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber: this.generateTrackingNumber("GPX"), status: "created" };
    }
    const body = {
      reference: input.orderId,
      client: input.customerName,
      phone: input.customerPhone,
      wilaya: input.wilaya,
      city: input.commune ?? input.wilaya,
      address: input.address,
      description: input.productName ?? "Order",
      amount: Math.round(input.totalPrice),
      weight: input.weight ?? 1,
      note: input.notes ?? "",
    };
    const data = await this.request<{ tracking?: string; id?: string }>(
      `${GUEPEX_BASE_URL}/shipments`,
      {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return {
      trackingNumber: data.tracking ?? data.id ?? this.generateTrackingNumber("GPX"),
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
    }>(`${GUEPEX_BASE_URL}/shipments/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return {
      trackingNumber,
      status: mapGuepexStatus(data.status),
      lastUpdate: data.lastUpdate,
      history: data.history,
      raw: data,
    };
  }
}

function mapGuepexStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr") || s.includes("delivered")) return "delivered";
  if (s.includes("transit") || s.includes("shipped")) return "in_transit";
  if (s.includes("annul") || s.includes("cancelled")) return "cancelled";
  if (s.includes("failed") || s.includes("retour")) return "failed";
  return "pending";
}
