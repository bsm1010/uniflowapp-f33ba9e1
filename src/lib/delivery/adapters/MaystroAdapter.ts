import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const MAYSTRO_BASE_URL = "https://api.maystro.dz/v1";

export class MaystroAdapter extends BaseDeliveryAdapter {
  readonly key = "maystro";
  readonly label = "Maystro Delivery";

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.apiKey}`,
      "X-Tenant-Id": this.credentials.apiSecret ?? "",
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "API key is required." };
    }
    try {
      await this.request<unknown>(`${MAYSTRO_BASE_URL}/me`, {
        method: "GET",
        headers: this.authHeaders(),
        timeoutMs: 10_000,
      });
      return { ok: true, message: "Maystro Delivery credentials verified." };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      const lower = raw.toLowerCase();
      if (lower.includes("401") || lower.includes("403") || lower.includes("unauthor")) {
        return { ok: false, message: "Invalid Maystro API key." };
      }
      if (lower.includes("aborted") || lower.includes("timeout")) {
        return { ok: false, message: "Maystro API timed out. Try again." };
      }
      return { ok: false, message: "Could not reach Maystro. Check your credentials." };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber: this.generateTrackingNumber("MAY"), status: "created" };
    }
    const body = {
      externalId: input.orderId,
      customerName: input.customerName,
      phone: input.customerPhone,
      wilaya: input.wilaya,
      commune: input.commune ?? input.wilaya,
      address: input.address,
      productName: input.productName ?? "Order",
      price: Math.round(input.totalPrice),
      weight: input.weight ?? 1,
      notes: input.notes ?? "",
    };
    const data = await this.request<{ trackingNumber?: string; tracking?: string; id?: string }>(
      `${MAYSTRO_BASE_URL}/shipments`,
      {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return {
      trackingNumber: data.trackingNumber ?? data.tracking ?? data.id ?? this.generateTrackingNumber("MAY"),
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
    }>(`${MAYSTRO_BASE_URL}/shipments/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return {
      trackingNumber,
      status: mapMaystroStatus(data.status),
      lastUpdate: data.lastUpdate,
      history: data.history,
      raw: data,
    };
  }
}

function mapMaystroStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr") || s.includes("delivered")) return "delivered";
  if (s.includes("transit") || s.includes("expedi") || s.includes("shipped")) return "in_transit";
  if (s.includes("annul") || s.includes("cancelled")) return "cancelled";
  if (s.includes("echec") || s.includes("failed") || s.includes("retour")) return "failed";
  if (s.includes("pret") || s.includes("created") || s.includes("pending")) return "created";
  return "pending";
}
