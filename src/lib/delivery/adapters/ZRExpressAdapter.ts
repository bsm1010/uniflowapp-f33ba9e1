import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
  ValidationResult,
} from "../types";

const ZR_BASE_URL = "https://api.zrexpress.app/api/v1";

interface Territory {
  id: string;
  code: number;
  name: string;
  level: string; // "wilaya" | "commune"
  parentId: string | null;
}

/**
 * Adapter for ZR Express (new platform — api.zrexpress.app).
 * Resolves wilaya/commune names to territory UUIDs before creating parcels.
 */
export class ZRExpressAdapter extends BaseDeliveryAdapter {
  readonly key = "zr_express";
  readonly label = "ZR Express";

  /** In-memory territory cache (fetched once per adapter instance). */
  private territoryCache: Territory[] | null = null;

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

  /** Fetch all territories from ZRExpress (cached per adapter instance). */
  private async fetchTerritories(): Promise<Territory[]> {
    if (this.territoryCache) return this.territoryCache;
    const res = await fetch(`${ZR_BASE_URL}/territories/search`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify({ pageNumber: 1, pageSize: 5000, orderBy: ["code asc"] }),
    });
    if (!res.ok) throw new Error(`Failed to fetch ZRExpress territories: ${res.status}`);
    const data = await res.json();
    const items = (data.items ?? []) as Territory[];
    this.territoryCache = items;
    return items;
  }

  /** Find a territory by name (case-insensitive) and optional level/parentId. */
  private findTerritory(
    territories: Territory[],
    name: string,
    level?: string,
    parentId?: string | null,
  ): Territory | undefined {
    const lower = name.toLowerCase().trim();
    return territories.find((t) => {
      const nameMatch = t.name.toLowerCase().trim() === lower || String(t.code) === lower;
      const levelMatch = !level || t.level === level;
      const parentMatch = parentId === undefined || t.parentId === parentId;
      return nameMatch && levelMatch && parentMatch;
    });
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

  /** Normalize Algerian phone to international format (+213XXXXXXXXX). */
  private normalizePhone(raw: string): string {
    const digits = raw.replace(/[^\d+]/g, "");
    if (digits.startsWith("+")) return digits;
    if (digits.startsWith("00")) return "+" + digits.slice(2);
    if (digits.startsWith("0")) return "+213" + digits.slice(1);
    if (digits.startsWith("213")) return "+" + digits;
    return "+213" + digits;
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
        ? "pickup-point"
        : "home";

    const items = input.items ?? [
      {
        productName: input.productName ?? "Order",
        quantity: 1,
        unitPrice: Math.round(input.totalPrice),
      },
    ];

    // Resolve territory UUIDs from names.
    const territories = await this.fetchTerritories();
    const wilaya = this.findTerritory(territories, input.wilaya, "wilaya");
    if (!wilaya) {
      throw new Error(
        `ZR Express: wilaya "${input.wilaya}" not found. Check the shipping address.`,
      );
    }
    const commune = this.findTerritory(
      territories,
      input.commune ?? input.wilaya,
      "commune",
      wilaya.id,
    );
    if (!commune) {
      throw new Error(
        `ZR Express: commune "${input.commune ?? input.wilaya}" not found in ${wilaya.name}.`,
      );
    }

    const body = {
      customer: {
        customerId: crypto.randomUUID(),
        name: input.customerName,
        phone: {
          number1: this.normalizePhone(input.customerPhone),
        },
      },
      deliveryAddress: {
        cityTerritoryId: wilaya.id,
        districtTerritoryId: commune.id,
        street: input.address,
      },
      orderedProducts: items.map((it) => ({
        productName: it.productName,
        unitPrice: Math.round(it.unitPrice),
        quantity: it.quantity,
        stockType: "none",
      })),
      amount: Math.round(input.totalPrice),
      description: items.map((it) => `${it.productName} x${it.quantity}`).join(", "),
      deliveryType,
      externalId: input.orderId,
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
      throw new Error(`ZR Express ${res.status}: ${text.slice(0, 300) || res.statusText}`);
    }

    const tracking = (data.id as string) || this.generateTrackingNumber("ZRE");
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
    console.log("[ZRExpress] trackShipment response", {
      url,
      status: res.status,
      bodyPreview: text.slice(0, 800),
    });
    if (!res.ok) {
      throw new Error(`ZR Express ${res.status}: ${text.slice(0, 300) || res.statusText}`);
    }

    // Unwrap: API may return { data: { ... } } or just the object directly.
    const inner = (data.data ?? data) as Record<string, unknown>;

    // Extract the main status — try many possible field names.
    const stateObj = (inner.state ?? inner.status ?? {}) as Record<string, unknown>;
    const statusRaw =
      pickStr(inner, ["status", "currentStatus", "currentState"]) ||
      pickStr(stateObj, ["name", "description", "label", "status"]);
    const updatedAt =
      pickStr(inner, ["updatedAt", "updated_at", "lastUpdate", "modifiedAt"]) || undefined;

    // Extract history/events — try every possible key the API might use.
    const historyRaw = findArrayField(inner, [
      "history",
      "events",
      "timeline",
      "trackingEvents",
      "statusHistory",
      "statuses",
      "tracking",
      "updates",
      "activity",
      "eventList",
      "statusHistoryList",
    ]);

    console.log("[ZRExpress] trackShipment parsed", {
      statusRaw,
      historyLength: historyRaw.length,
      innerKeys: Object.keys(inner),
    });

    const history = Array.isArray(historyRaw)
      ? historyRaw
          .map((h) => {
            const e = (h ?? {}) as Record<string, unknown>;
            const st = (e.state ?? e.statusObj ?? {}) as Record<string, unknown>;
            const statusText =
              pickStr(e, [
                "status",
                "name",
                "label",
                "description",
                "statusText",
                "event",
                "action",
              ]) || pickStr(st, ["name", "description", "label"]);
            const dateText = pickStr(e, [
              "date",
              "createdAt",
              "created_at",
              "at",
              "timestamp",
              "eventDate",
              "statusDate",
              "modifiedAt",
            ]);
            const locText = pickStr(e, ["location", "address", "place"]) || undefined;
            const cityText = pickStr(e, ["city", "commune", "cityName"]) || undefined;
            const wilayaText = pickStr(e, ["wilaya", "wilayaName", "state", "region"]) || undefined;
            return {
              status: statusText,
              date: dateText || "",
              location: locText,
              city: cityText,
              wilaya: wilayaText,
            };
          })
          .filter((h) => h.status || h.date)
      : [];

    return {
      trackingNumber,
      status: mapZRStatus(statusRaw),
      rawStatus: statusRaw || undefined,
      lastUpdate: updatedAt,
      history,
      raw: data,
    };
  }

  /**
   * Fetch a bordereau (shipping label PDF) for a single colis.
   * Proxied through Supabase Edge Function to avoid CORS issues.
   */
  async getBordereau(colisId: string): Promise<Blob> {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error("Not authenticated");

    const storeId = this.credentials.storeId;
    if (!storeId) throw new Error("Store ID not available for bordereau request");

    console.log("[ZRExpressAdapter] getBordereau via edge function:", { colisId, storeId });

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-bordereau`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ colisId, storeId }),
      },
    );

    console.log("[ZRExpressAdapter] edge function response:", response.status, response.headers.get("content-type"));

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(`Bordereau proxy error: ${err.error}`);
    }

    return await response.blob();
  }

  /**
   * Fetch bordereaux for multiple colis IDs in parallel.
   * Logs warnings for individual failures but continues the batch.
   */
  async getBordereaux(colisIds: string[]): Promise<Blob[]> {
    const results = await Promise.allSettled(
      colisIds.map((id) => this.getBordereau(id)),
    );

    const blobs: Blob[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") {
        blobs.push(r.value);
      } else {
        console.warn(`[ZRExpress] Bordereau failed for colis ${colisIds[i]}:`, r.reason);
      }
    }
    return blobs;
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

/** Search for the first array among the given keys, including one level deep. */
function findArrayField(obj: Record<string, unknown>, keys: string[]): unknown[] {
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  // One level deeper: e.g. data.events might be under data.result.events
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested = v as Record<string, unknown>;
      for (const k2 of keys) {
        if (Array.isArray(nested[k2])) return nested[k2] as unknown[];
      }
    }
  }
  return [];
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

/**
 * Try to extract a PDF Blob from various possible API response shapes.
 * Handles direct PDF responses, base64-encoded data, and URL references.
 */
async function extractPDFFromResponseAsync(body: Record<string, unknown>): Promise<Blob | null> {
  // 1. Direct URL field — fetch the PDF
  const urlField = pickStr(body, ["url", "pdf", "pdfUrl", "bordereauUrl", "labelUrl", "fileUrl"]);
  if (urlField && (urlField.startsWith("http://") || urlField.startsWith("https://"))) {
    try {
      const res = await fetch(urlField, { signal: AbortSignal.timeout(30_000) });
      if (res.ok) return await res.blob();
    } catch { /* ignore */ }
  }

  // 2. Base64-encoded PDF
  const b64Field = pickStr(body, ["base64", "data", "content", "pdfBase64", "file"]);
  if (b64Field && b64Field.length > 100) {
    try {
      const raw = b64Field.includes(",") ? b64Field.split(",")[1] : b64Field;
      const binary = atob(raw);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Blob([bytes], { type: "application/pdf" });
    } catch { /* not valid base64 */ }
  }

  // 3. Nested data array with url/pdf fields
  const items = Array.isArray(body.data) ? body.data : Array.isArray(body.items) ? body.items : null;
  if (items && items.length > 0) {
    const first = items[0] as Record<string, unknown>;
    const nestedUrl = pickStr(first, ["url", "pdf", "pdfUrl", "bordereauUrl"]);
    if (nestedUrl && (nestedUrl.startsWith("http://") || nestedUrl.startsWith("https://"))) {
      try {
        const res = await fetch(nestedUrl, { signal: AbortSignal.timeout(30_000) });
        if (res.ok) return await res.blob();
      } catch { /* ignore */ }
    }
    const nestedB64 = pickStr(first, ["base64", "data", "content"]);
    if (nestedB64 && nestedB64.length > 100) {
      try {
        const raw = nestedB64.includes(",") ? nestedB64.split(",")[1] : nestedB64;
        const binary = atob(raw);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new Blob([bytes], { type: "application/pdf" });
      } catch { /* ignore */ }
    }
  }

  return null;
}
