/**
 * Service to fetch delivery tariffs from the ZR Express (Procolis) API.
 *
 * The Procolis `/tarification` endpoint returns per-wilaya pricing with both
 * domicile (home delivery) and stopdesk prices. We normalize that response
 * into a flat list of { wilaya, city, delivery_type, price } rows so the
 * rest of the app can treat it the same as manual tariffs.
 */

const ZR_BASE_URL = "https://api.zrexpress.app/api/v1";

export interface ZRTariffRow {
  wilaya: string;
  city: string;
  delivery_type: "domicile" | "stopdesk";
  price: number;
}

export interface FetchZRTariffsResult {
  success: boolean;
  message: string;
  tariffs: ZRTariffRow[];
}

/** Raw shape returned by ZR Express (legacy Procolis + new platform). */
interface ZRDeliveryPriceEntry {
  deliveryType?: string;
  price?: number | string;
  discountedPrice?: number | string | null;
}
interface ZRTariffApiEntry {
  IDWilaya?: number | string;
  Wilaya?: string;
  Commune?: string;
  TarifLivraison?: number | string;
  TarifStopDesk?: number | string;
  Domicile?: number | string;
  StopDesk?: number | string;
  // Legacy new-platform fields:
  toWilayaId?: number | string;
  toWilayaName?: string;
  homeDeliveryPrice?: number | string;
  stopDeskPrice?: number | string;
  // Current api.zrexpress.app shape:
  toTerritoryId?: string;
  toTerritoryName?: string;
  toTerritoryLevel?: string;
  deliveryPrices?: ZRDeliveryPriceEntry[];
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Fetch tariffs from ZR Express.
 *
 * @param apiKey   ZR Express token (header `token`)
 * @param tenantId ZR Express key   (header `key`)
 */
export async function fetchZRTariffs(
  apiKey: string,
  _tenantId?: string,
): Promise<FetchZRTariffsResult> {
  if (!apiKey?.trim()) {
    return {
      success: false,
      message: "Missing ZR Express credentials (Bearer token).",
      tariffs: [],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const headers = {
    Authorization: `Bearer ${apiKey.trim()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  } as Record<string, string>;


  const url = `${ZR_BASE_URL}/delivery-pricing/rates`;

  let json: unknown = null;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    const bodyText = await res.text();
    console.log("[ZRExpress] fetchTariffs", {
      url,
      status: res.status,
      statusText: res.statusText,
      bodyPreview: bodyText.slice(0, 400),
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        return {
          success: false,
          message: `ZR Express rejected credentials (${res.status}).`,
          tariffs: [],
        };
      }
      return {
        success: false,
        message: `ZR Express ${res.status} ${res.statusText}: ${bodyText.slice(0, 200)}`,
        tariffs: [],
      };
    }
    try {
      json = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      return { success: false, message: "ZR Express returned non-JSON response.", tariffs: [] };
    }

    const rows: ZRTariffApiEntry[] = Array.isArray(json)
      ? (json as ZRTariffApiEntry[])
      : Array.isArray((json as { data?: ZRTariffApiEntry[] }).data)
        ? (json as { data: ZRTariffApiEntry[] }).data
        : Array.isArray((json as { rates?: ZRTariffApiEntry[] }).rates)
          ? (json as { rates: ZRTariffApiEntry[] }).rates
          : [];

    const tariffs: ZRTariffRow[] = [];
    for (const entry of rows) {
      const wilaya = String(
        entry.Wilaya ?? entry.toWilayaName ?? entry.IDWilaya ?? entry.toWilayaId ?? "",
      ).trim();
      if (!wilaya) continue;
      const city = String(entry.Commune ?? entry.toWilayaName ?? "").trim();

      const domicile = toNumber(
        entry.TarifLivraison ?? entry.Domicile ?? entry.homeDeliveryPrice,
      );
      const stopdesk = toNumber(
        entry.TarifStopDesk ?? entry.StopDesk ?? entry.stopDeskPrice,
      );

      if (domicile > 0) {
        tariffs.push({ wilaya, city, delivery_type: "domicile", price: domicile });
      }
      if (stopdesk > 0) {
        tariffs.push({ wilaya, city, delivery_type: "stopdesk", price: stopdesk });
      }
    }

    return {
      success: true,
      message: `Fetched ${tariffs.length} tariff rows from ZR Express.`,
      tariffs,
    };
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    const lower = raw.toLowerCase();
    if (lower.includes("aborted") || lower.includes("timeout")) {
      return { success: false, message: "ZR Express API timed out.", tariffs: [] };
    }
    return { success: false, message: "Failed to fetch ZR Express tariffs.", tariffs: [] };
  } finally {
    clearTimeout(timeout);
  }
}
