import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const ANDERSON_BASE_URL = "https://api.andersondz.com/v1";

export class AndersonAdapter extends BaseDeliveryAdapter {
  readonly key = "anderson";
  readonly label = "Anderson E-commerce Logistics";

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
      await this.request<unknown>(`${ANDERSON_BASE_URL}/auth/verify`, {
        method: "GET",
        headers: this.authHeaders(),
        timeoutMs: 10_000,
      });
      return { ok: true, message: "Anderson credentials verified." };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const lower = raw.toLowerCase();
      if (lower.includes("401") || lower.includes("403") || lower.includes("unauthor")) {
        return { ok: false, message: "Invalid Anderson API key." };
      }
      if (lower.includes("aborted") || lower.includes("timeout")) {
        return { ok: false, message: "Anderson API timed out." };
      }
      return { ok: false, message: "Could not reach Anderson. Check your credentials." };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber: this.generateTrackingNumber("AND"), status: "created" };
    }
    const body = {
      orderRef: input.orderId,
      customerName: input.customerName,
      phone: input.customerPhone,
      wilaya: input.wilaya,
      commune: input.commune ?? input.wilaya,
      address: input.address,
      product: input.productName ?? "Order",
      amount: Math.round(input.totalPrice),
      weight: input.weight ?? 1,
      notes: input.notes ?? "",
    };
    const data = await this.request<{ trackingNumber?: string; id?: string }>(
      `${ANDERSON_BASE_URL}/shipments`,
      {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return {
      trackingNumber: data.trackingNumber ?? data.id ?? this.generateTrackingNumber("AND"),
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
    }>(`${ANDERSON_BASE_URL}/shipments/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return {
      trackingNumber,
      status: mapAndersonStatus(data.status),
      lastUpdate: data.lastUpdate,
      history: data.history,
      raw: data,
    };
  }
}

function mapAndersonStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr") || s.includes("delivered")) return "delivered";
  if (s.includes("transit") || s.includes("shipped")) return "in_transit";
  if (s.includes("cancelled") || s.includes("annul")) return "cancelled";
  if (s.includes("failed") || s.includes("retour") || s.includes("echec")) return "failed";
  if (s.includes("pending") || s.includes("pret") || s.includes("created")) return "created";
  return "pending";
}
