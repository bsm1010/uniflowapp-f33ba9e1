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

  async validateCredentials(): Promise<ValidationResult> {
    if (!this.hasCredentials()) {
      return { ok: false, message: "Invalid API credentials: missing secretKey (token)." };
    }
    if (!this.credentials.apiSecret || !this.credentials.apiSecret.trim()) {
      return { ok: false, message: "Invalid API credentials: missing tenantId." };
    }

    const token = this.credentials.apiKey.trim();
    const tenantId = this.credentials.apiSecret.trim();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);

    // Per ZR Express NEW docs (docs.zrexpress.app), auth uses TWO separate
    // headers: X-Tenant + X-Api-Key. We also send `token`/`id`/`key` for
    // backward compatibility with the legacy Procolis API.
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Tenant": tenantId,
      "X-Api-Key": token,
      token,
      key: tenantId,
      id: tenantId,
    } as Record<string, string>;

    // Probe candidate tariff endpoints in order. Stop on the first 2xx with rows.
    const attempts: Array<{ url: string; method: "GET" | "POST" }> = [
      { url: `${ZR_BASE_URL}/delivery-pricing/rates`, method: "GET" },
      { url: `${ZR_BASE_URL}/tarification`, method: "POST" },
      { url: `${ZR_BASE_URL}/tarification`, method: "GET" },
      { url: `${ZR_BASE_URL}/tarifs`, method: "POST" },
    ];

    let lastErr = "";
    try {
      for (const attempt of attempts) {
        try {
          const res = await fetch(attempt.url, {
            method: attempt.method,
            headers,
            body: attempt.method === "POST" ? JSON.stringify({}) : undefined,
            signal: controller.signal,
          });
          const bodyText = await res.text();
          console.log("[ZRExpress] validateCredentials attempt", {
            url: attempt.url,
            method: attempt.method,
            status: res.status,
            statusText: res.statusText,
            bodyPreview: bodyText.slice(0, 400),
          });

          if (!res.ok) {
            lastErr = `${attempt.method} ${attempt.url} → ${res.status} ${res.statusText}: ${bodyText.slice(0, 160)}`;
            // 401/403 = bad credentials, no point trying other endpoints
            if (res.status === 401 || res.status === 403) {
              return {
                ok: false,
                message: `ZR Express rejected credentials (${res.status}): ${bodyText.slice(0, 200) || res.statusText}`,
              };
            }
            continue;
          }

          let parsed: unknown = null;
          try {
            parsed = bodyText ? JSON.parse(bodyText) : null;
          } catch {
            lastErr = `${attempt.url} returned non-JSON`;
            continue;
          }

          const rows = Array.isArray(parsed)
            ? parsed
            : Array.isArray((parsed as { data?: unknown[] } | null)?.data)
              ? (parsed as { data: unknown[] }).data
              : Array.isArray((parsed as { Tarifs?: unknown[] } | null)?.Tarifs)
                ? (parsed as { Tarifs: unknown[] }).Tarifs
                : Array.isArray((parsed as { rates?: unknown[] } | null)?.rates)
                  ? (parsed as { rates: unknown[] }).rates
                  : null;

          if (!rows || rows.length === 0) {
            lastErr = `${attempt.url} returned no rows`;
            continue;
          }

          return {
            ok: true,
            message: `ZR Express connected via ${attempt.url} (${rows.length} rates).`,
          };
        } catch (e) {
          lastErr = e instanceof Error ? e.message : String(e);
          if (lastErr.toLowerCase().includes("aborted")) throw e;
        }
      }
      return {
        ok: false,
        message: `ZR Express: no tariff endpoint responded. Last error: ${lastErr || "unknown"}`,
      };
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
    }>(`${ZR_BASE_URL}/colis`, {
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
    }>(`${ZR_BASE_URL}/colis/${encodeURIComponent(trackingNumber)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: this.credentials.apiKey,
        key: this.credentials.apiSecret ?? "",
        id: this.credentials.apiSecret ?? "",
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
