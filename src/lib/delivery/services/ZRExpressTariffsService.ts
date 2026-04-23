/**
 * Service to fetch delivery tariffs from the ZR Express (Procolis) API.
 *
 * The Procolis `/tarification` endpoint returns per-wilaya pricing with both
 * domicile (home delivery) and stopdesk prices. We normalize that response
 * into a flat list of { wilaya, city, delivery_type, price } rows so the
 * rest of the app can treat it the same as manual tariffs.
 */

const ZR_BASE_URL = "https://procolis.com/api_v1";

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

/** Raw shape returned by Procolis — only the fields we actually consume. */
interface ZRTariffApiEntry {
  IDWilaya?: number | string;
  Wilaya?: string;
  Commune?: string;
  TarifLivraison?: number | string;
  TarifStopDesk?: number | string;
  // Some payloads use alternative casings; keep them optional.
  Domicile?: number | string;
  StopDesk?: number | string;
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
  tenantId: string,
): Promise<FetchZRTariffsResult> {
  if (!apiKey?.trim() || !tenantId?.trim()) {
    return {
      success: false,
      message: "Missing ZR Express credentials (token / key).",
      tariffs: [],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const res = await fetch(`${ZR_BASE_URL}/tarification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        token: apiKey.trim(),
        key: tenantId.trim(),
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        success: false,
        message: `ZR Express API error (${res.status})`,
        tariffs: [],
      };
    }

    const json = (await res.json()) as ZRTariffApiEntry[] | { Tarifs?: ZRTariffApiEntry[] };
    const rows: ZRTariffApiEntry[] = Array.isArray(json) ? json : (json.Tarifs ?? []);

    const tariffs: ZRTariffRow[] = [];
    for (const entry of rows) {
      const wilaya = String(entry.Wilaya ?? entry.IDWilaya ?? "").trim();
      if (!wilaya) continue;
      const city = String(entry.Commune ?? "").trim();

      const domicile = toNumber(entry.TarifLivraison ?? entry.Domicile);
      const stopdesk = toNumber(entry.TarifStopDesk ?? entry.StopDesk);

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
