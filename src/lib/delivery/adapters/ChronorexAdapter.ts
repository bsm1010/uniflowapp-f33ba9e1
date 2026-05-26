import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const CHRONOREX_BASE_URL = "https://api.chronorex.dz/v1";

export class ChronorexAdapter extends BaseDeliveryAdapter {
  readonly key = "chronorex";
  readonly label = "Chronorex Express";

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.apiKey}`,
      "X-Account": this.credentials.apiSecret ?? "",
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "API key is required." };
    }
    try {
      await this.request<unknown>(`${CHRONOREX_BASE_URL}/auth/verify`, {
        method: "GET",
        headers: this.authHeaders(),
        timeoutMs: 10_000,
      });
      return { ok: true, message: "Chronorex credentials verified." };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      if (raw.includes("401") || raw.includes("403")) {
        return { ok: false, message: "Invalid Chronorex API key." };
      }
      if (raw.includes("timeout") || raw.includes("aborted")) {
        return { ok: false, message: "Chronorex API timed out." };
      }
      return { ok: false, message: "Could not reach Chronorex. Check your credentials." };
    }
  }

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber: this.generateTrackingNumber("CHR"), status: "created" };
    }
    const body = {
      externalRef: input.orderId,
      customer: input.customerName,
      tel: input.customerPhone,
      wilaya: input.wilaya,
      commune: input.commune ?? input.wilaya,
      adresse: input.address,
      article: input.productName ?? "Order",
      cod: Math.round(input.totalPrice),
      poids: input.weight ?? 1,
      commentaire: input.notes ?? "",
    };
    const data = await this.request<{ tracking?: string; id?: string; numero?: string }>(
      `${CHRONOREX_BASE_URL}/commandes`,
      {
        method: "POST",
        headers: this.authHeaders(),
        body: JSON.stringify(body),
      },
    );
    return {
      trackingNumber: data.tracking ?? data.numero ?? data.id ?? this.generateTrackingNumber("CHR"),
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
      historique?: Array<{ statut: string; date: string; lieu?: string }>;
    }>(`${CHRONOREX_BASE_URL}/commandes/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });
    return {
      trackingNumber,
      status: mapChronorexStatus(data.statut ?? data.status),
      lastUpdate: data.lastUpdate,
      history: data.historique?.map((h) => ({
        status: h.statut,
        date: h.date,
        location: h.lieu,
      })),
      raw: data,
    };
  }
}

function mapChronorexStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr") || s.includes("delivered")) return "delivered";
  if (s.includes("transit") || s.includes("shipped") || s.includes("expedi")) return "in_transit";
  if (s.includes("annul") || s.includes("cancelled")) return "cancelled";
  if (s.includes("failed") || s.includes("retour")) return "failed";
  if (s.includes("created") || s.includes("pret") || s.includes("pending")) return "created";
  return "pending";
}
