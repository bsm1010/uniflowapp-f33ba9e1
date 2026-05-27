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
    const token = (this.credentials.apiKey ?? "").trim();
    const tenant = (this.credentials.apiSecret ?? "").trim();
    return {
      Authorization: `Bearer ${token}`,
      "X-Tenant": tenant,
      "X-Api-Key": token,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "Invalid API credentials: missing secretKey (token)." };
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

    const dt = (input.deliveryType ?? "").toLowerCase();
    const deliveryType =
      dt === "stopdesk" || dt === "stop-desk" || dt === "stop_desk" || dt === "pickup-point"
        ? "stop-desk"
        : "home";

    const body = {
      customerName: input.customerName,
      phone: input.customerPhone,
      wilaya: input.wilaya,
      commune: input.commune ?? input.wilaya,
      address: input.address,
      productName: input.productName ?? "Order",
      price: Math.round(input.totalPrice),
      deliveryType,
      externalId: input.orderId,
      notes: input.notes ?? "",
    };

    const url = `${ZR_BASE_URL}/parcels`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // non-JSON
    }
    console.log("[ZRExpress] createShipment", {
      url,
      status: res.status,
      bodyPreview: text.slice(0, 500),
    });
    if (!res.ok) {
      throw new Error(
        `ZR Express ${res.status}: ${text.slice(0, 300) || res.statusText}`,
      );
    }

    const inner = (data.data ?? data) as Record<string, unknown>;
    const tracking =
      pickStr(data, ["trackingNumber", "tracking", "tracking_number", "id"]) ||
      pickStr(inner, ["trackingNumber", "tracking", "tracking_number", "id"]) ||
      this.generateTrackingNumber("ZRE");
    return { trackingNumber: tracking, status: "created", raw: data };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber, status: "in_transit" };
    }

    const url = `${ZR_BASE_URL}/parcels/${encodeURIComponent(trackingNumber)}`;
    const res = await fetch(url, { method: "GET", headers: this.authHeaders() });
    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      // ignore
    }
    if (!res.ok) {
      throw new Error(
        `ZR Express ${res.status}: ${text.slice(0, 300) || res.statusText}`,
      );
    }
    const inner = (data.data ?? data) as Record<string, unknown>;
    const stateObj = (inner.state ?? inner.status ?? {}) as Record<string, unknown>;
    const statusRaw =
      pickStr(inner, ["status"]) ||
      pickStr(stateObj, ["name", "description", "label"]);
    const updatedAt =
      pickStr(inner, ["updatedAt", "updated_at", "lastUpdate"]) || undefined;

    const historyRaw =
      (inner.history as unknown[]) ??
      (inner.events as unknown[]) ??
      (inner.timeline as unknown[]) ??
      [];
    const history = Array.isArray(historyRaw)
      ? historyRaw
          .map((h) => {
            const e = (h ?? {}) as Record<string, unknown>;
            const st = (e.state ?? {}) as Record<string, unknown>;
            return {
              status:
                pickStr(e, ["status", "name", "label", "description"]) ||
                pickStr(st, ["name", "description"]),
              date:
                pickStr(e, ["date", "createdAt", "created_at", "at", "timestamp"]) ||
                "",
              location: pickStr(e, ["location", "city", "wilaya"]) || undefined,
            };
          })
          .filter((h) => h.status || h.date)
      : [];

    return {
      trackingNumber,
      status: mapZRStatus(statusRaw),
      lastUpdate: updatedAt,
      history,
      raw: data,
    };
  }
}

function pickStr(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return "";
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
