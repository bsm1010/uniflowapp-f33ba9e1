import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const SHERPA_BASE_URL = "https://api.sherpa.dz/v1";

export class SherpaAdapter extends BaseDeliveryAdapter {
  readonly key = "sherpa";
  readonly label = "Sherpa";

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.apiKey}`,
      "X-API-Key": this.credentials.apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "API key is required." };
    }
    try {
      await this.request<unknown>(`${SHERPA_BASE_URL}/ping`, {
        method: "GET",
        headers: this.authHeaders(),
        timeoutMs: 10_000,
      });
      return { ok: true, message: "Sherpa credentials verified." };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const lower = raw.toLowerCase();
      if (lower.includes("401") || lower.includes("403") || lower.includes("unauthor")) {
        return { ok: false, message: "Invalid Sherpa API key." };
      }
      if (lower.includes("aborted") || lower.includes("timeout")) {
        return { ok: false, message: "Sherpa API timed out. Try again." };
      }
      return { ok: false, message: "Could not reach Sherpa. Check your credentials." };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber: this.generateTrackingNumber("SHR"), status: "created" };
    }
    const body = {
      reference: input.orderId,
      clientName: input.customerName,
      phone: input.customerPhone,
      wilaya: input.wilaya,
      city: input.commune ?? input.wilaya,
      address: input.address,
      product: input.productName ?? "Order",
      amount: Math.round(input.totalPrice),
      weight: input.weight ?? 1,
      notes: input.notes ?? "",
    };
    const data = await this.request<{ tracking?: string; id?: string }>(
      `${SHERPA_BASE_URL}/shipments`,
      {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return {
      trackingNumber: data.tracking ?? data.id ?? this.generateTrackingNumber("SHR"),
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
      updatedAt?: string;
      history?: Array<{ status: string; date: string; location?: string }>;
    }>(`${SHERPA_BASE_URL}/shipments/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return {
      trackingNumber,
      status: mapSherpaStatus(data.status),
      lastUpdate: data.updatedAt,
      history: data.history,
      raw: data,
    };
  }
}

function mapSherpaStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr") || s.includes("delivered")) return "delivered";
  if (s.includes("transit") || s.includes("expedi") || s.includes("shipped")) return "in_transit";
  if (s.includes("annul") || s.includes("cancelled")) return "cancelled";
  if (s.includes("echec") || s.includes("failed") || s.includes("retour")) return "failed";
  return "pending";
}
