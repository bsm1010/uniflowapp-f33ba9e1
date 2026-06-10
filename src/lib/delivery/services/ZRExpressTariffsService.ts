/**
 * Service to fetch delivery tariffs from the ZR Express (Procolis) API.
 *
 * The Procolis `/tarification` endpoint returns per-wilaya pricing with both
 * domicile (home delivery) and stopdesk prices. We normalize that response
 * into a flat list of { wilaya, city, delivery_type, price } rows so the
 * rest of the app can treat it the same as manual tariffs.
 *
 * When `toTerritoryLevel === "wilaya"`, the entry covers the entire wilaya
 * and we expand it to every city from our local ALGERIA_GEO lookup.
 */

import { ALGERIA_GEO } from "@/lib/algeriaWilayas";

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
  deliveryType?: string | null;
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

/** Normalize a wilaya/territory name so we can fuzzy-match it against ALGERIA_GEO. */
function normalizeWilayaName(raw: string): string {
  const s = raw.toLowerCase().trim()
    .replace(/[''`]/g, "'")
    .replace(/[\s-]+/g, " ");
  return s;
}

/** Find a matching wilaya entry from our local geo data, or null. */
function findWilayaEntry(rawName: string) {
  const norm = normalizeWilayaName(rawName);
  return (
    ALGERIA_GEO.find((e) => normalizeWilayaName(e.wilaya) === norm) ??
    ALGERIA_GEO.find((e) => normalizeWilayaName(e.wilaya).startsWith(norm) || norm.startsWith(normalizeWilayaName(e.wilaya))) ??
    null
  );
}

/**
 * Extract domicile and stopdesk prices from an entry's deliveryPrices array.
 * Handles multiple deliveryType naming conventions from the ZR API.
 */
function extractDeliveryPrices(entry: ZRTariffApiEntry): {
  domicile: number;
  stopdesk: number;
} {
  let domicile = toNumber(entry.TarifLivraison ?? entry.Domicile ?? entry.homeDeliveryPrice);
  let stopdesk = toNumber(entry.TarifStopDesk ?? entry.StopDesk ?? entry.stopDeskPrice);

  const prices = entry.deliveryPrices ?? [];
  for (const dp of prices) {
    const t = (dp.deliveryType ?? "").toLowerCase();
    const price = toNumber(dp.discountedPrice ?? dp.price);
    if (price <= 0) continue;
    if (
      t === "home" ||
      t.includes("domicile") ||
      t === "home-delivery" ||
      t === "homedelivery" ||
      t === "delivery"
    ) {
      domicile = price;
    } else if (
      t === "pickup-point" ||
      t.includes("stop") ||
      t.includes("desk") ||
      t === "pickup" ||
      t === "pickuppoint"
    ) {
      stopdesk = price;
    }
  }

  return { domicile, stopdesk };
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

  const token = apiKey.trim();
  const tenant = (_tenantId ?? "").trim();
  const headers = {
    Authorization: `Bearer ${token}`,
    "X-Tenant": tenant,
    "X-Api-Key": token,
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
        : Array.isArray((json as { items?: ZRTariffApiEntry[] }).items)
          ? (json as { items: ZRTariffApiEntry[] }).items
          : Array.isArray((json as { rates?: ZRTariffApiEntry[] }).rates)
            ? (json as { rates: ZRTariffApiEntry[] }).rates
            : [];

    const tariffs: ZRTariffRow[] = [];
    for (const entry of rows) {
      const wilaya = String(
        entry.Wilaya ??
          entry.toTerritoryName ??
          entry.toWilayaName ??
          entry.IDWilaya ??
          entry.toTerritoryId ??
          entry.toWilayaId ??
          "",
      ).trim();
      if (!wilaya) continue;

      const { domicile, stopdesk } = extractDeliveryPrices(entry);

      // The API returns entries at either wilaya or commune level.
      // For commune-level entries, `toTerritoryLevel === "commune"` and
      // `Commune` gives us the city name directly.
      // For wilaya-level entries (`toTerritoryLevel === "wilaya"` or missing),
      // we expand to every city in that wilaya using our local geo data.
      const isCommuneLevel =
        (entry.toTerritoryLevel ?? "").toLowerCase() === "commune" &&
        entry.Commune;

      if (isCommuneLevel && entry.Commune) {
        // City-level entry: use the commune name directly.
        const city = String(entry.Commune).trim();
        if (domicile > 0) tariffs.push({ wilaya, city, delivery_type: "domicile", price: domicile });
        if (stopdesk > 0) tariffs.push({ wilaya, city, delivery_type: "stopdesk", price: stopdesk });
      } else {
        // Wilaya-level entry: expand to all cities in the wilaya.
        const entry_ = findWilayaEntry(wilaya);
        const cities = entry_?.cities ?? [];
        if (cities.length === 0) {
          // Fallback: if we can't find the wilaya in our geo data,
          // still create a single row with just the wilaya name as city
          // so the price isn't lost.
          if (domicile > 0) tariffs.push({ wilaya, city: "", delivery_type: "domicile", price: domicile });
          if (stopdesk > 0) tariffs.push({ wilaya, city: "", delivery_type: "stopdesk", price: stopdesk });
        } else {
          for (const city of cities) {
            if (domicile > 0) tariffs.push({ wilaya, city, delivery_type: "domicile", price: domicile });
            if (stopdesk > 0) tariffs.push({ wilaya, city, delivery_type: "stopdesk", price: stopdesk });
          }
        }
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
