import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const ZR_BASE_URL = "https://api.zrexpress.app/api/v1";

/**
 * Adapter for ZR Express (Procolis API).
 * Same fallback behavior as Yalidine when credentials are missing.
 */
export class ZRExpressAdapter extends BaseDeliveryAdapter {
  readonly key = "zr_express";
  readonly label = "ZR Express";

  private authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${(this.credentials.apiKey ?? "").trim()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "Invalid API credentials: missing secretKey (token)." };
    }
    if (!this.credentials.apiSecret || !this.credentials.apiSecret.trim()) {
      return { ok: false, message: "Invalid API credentials: missing tenantId." };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const url = `${ZR_BASE_URL}/delivery-pricing/rates`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: this.authHeaders(),
        signal: controller.signal,
      });
      const bodyText = await res.text();
      console.log("[ZRExpress] validateCredentials", {
        url,
        status: res.status,
        statusText: res.statusText,
        bodyPreview: bodyText.slice(0, 400),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            ok: false,
            message: `ZR Express rejected credentials (${res.status}): ${bodyText.slice(0, 200) || res.statusText}`,
          };
        }
        return {
          ok: false,
          message: `ZR Express ${res.status} ${res.statusText}: ${bodyText.slice(0, 200)}`,
        };
      }

      let parsed: unknown = null;
      try {
        parsed = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        return { ok: false, message: "ZR Express returned non-JSON response." };
      }

      const rows = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { data?: unknown[] } | null)?.data)
          ? (parsed as { data: unknown[] }).data
          : Array.isArray((parsed as { rates?: unknown[] } | null)?.rates)
            ? (parsed as { rates: unknown[] }).rates
            : [];

      if (!rows || rows.length === 0) {
        return { ok: false, message: "ZR Express returned no delivery rates." };
      }

      return { ok: true, message: `ZR Express connected (${rows.length} rates).` };
    } catch (e) {
      const raw = e instanceof Error ? e.message : String(e);
      console.error("[ZRExpress] validateCredentials error", raw);
      if (raw.toLowerCase().includes("aborted")) {
        return { ok: false, message: "ZR Express API timed out. Try again." };
      }
      return { ok: false, message: `ZR Express request failed: ${raw}` };
    } finally {
      clearTimeout(timer);
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
      externalId: input.orderId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      address: input.address,
      wilaya: input.wilaya,
      commune: input.commune ?? input.wilaya,
      total: Math.round(input.totalPrice),
      productName: input.productName ?? "Order",
      notes: input.notes ?? "",
    };

    const data = await this.request<{
      trackingNumber?: string;
      tracking?: string;
      data?: { trackingNumber?: string; tracking?: string };
    }>(`${ZR_BASE_URL}/parcels`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(payload),
    });

    const tracking =
      data.trackingNumber ??
      data.tracking ??
      data.data?.trackingNumber ??
      data.data?.tracking ??
      this.generateTrackingNumber("ZRE");
    return { trackingNumber: tracking, status: "created", raw: data };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber, status: "in_transit" };
    }

    const data = await this.request<{
      status?: string;
      updatedAt?: string;
      data?: { status?: string; updatedAt?: string };
    }>(`${ZR_BASE_URL}/parcels/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: this.authHeaders(),
    });

    const status = data.status ?? data.data?.status;
    const updatedAt = data.updatedAt ?? data.data?.updatedAt;
    return {
      trackingNumber,
      status: mapZRStatus(status),
      lastUpdate: updatedAt,
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
