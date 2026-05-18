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
      return { ok: false, message: "Invalid API credentials: missing secretKey (token)." };
    }
    if (!this.credentials.apiSecret || !this.credentials.apiSecret.trim()) {
      return { ok: false, message: "Invalid API credentials: missing tenantId." };
    }

    const token = this.credentials.apiKey.trim();
    const tenantId = this.credentials.apiSecret.trim();
    const url = `${ZR_BASE_URL}/tarification`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);

    try {
      // Procolis /tarification requires POST. Send both `key` and `id` headers
      // (different Procolis docs name the tenant header differently).
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          token,
          key: tenantId,
          id: tenantId,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      const bodyText = await res.text();
      console.log("[ZRExpress] validateCredentials response", {
        url,
        method: "POST",
        status: res.status,
        statusText: res.statusText,
        bodyPreview: bodyText.slice(0, 500),
      });

      if (!res.ok) {
        return {
          ok: false,
          message: `ZR Express API error (${res.status} ${res.statusText}): ${bodyText.slice(0, 200) || "no body"}`,
        };
      }

      let parsed: unknown = null;
      try {
        parsed = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        return {
          ok: false,
          message: "ZR Express returned a non-JSON response. Verify your credentials are correct.",
        };
      }

      const rows = Array.isArray(parsed)
        ? parsed
        : Array.isArray((parsed as { Tarifs?: unknown[] } | null)?.Tarifs)
          ? (parsed as { Tarifs: unknown[] }).Tarifs
          : null;

      if (!rows || rows.length === 0) {
        return {
          ok: false,
          message: "ZR Express responded but returned no tariffs. Verify your account is active.",
        };
      }

      return { ok: true, message: `ZR Express connected (${rows.length} tariffs available).` };
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
        id: this.credentials.apiSecret ?? "",
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
