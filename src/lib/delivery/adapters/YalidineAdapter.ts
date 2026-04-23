import { BaseDeliveryAdapter } from "./BaseAdapter";
import type {
  CreateShipmentInput,
  CreateShipmentResult,
  TrackingResult,
} from "../types";

const YALIDINE_BASE_URL = "https://api.yalidine.app/v1";

/**
 * Adapter for the Yalidine delivery network.
 * Falls back to a locally generated tracking number when no API key is present
 * so the rest of the order flow keeps working in development / before activation.
 */
export class YalidineAdapter extends BaseDeliveryAdapter {
  readonly key = "yalidine";
  readonly label = "Yalidine";

  async createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult> {
    if (!this.hasCredentials()) {
      return {
        trackingNumber: this.generateTrackingNumber("YAL"),
        status: "created",
      };
    }

    const payload = [
      {
        order_id: input.orderId,
        firstname: input.customerName.split(" ")[0] ?? input.customerName,
        familyname: input.customerName.split(" ").slice(1).join(" ") || "-",
        contact_phone: input.customerPhone,
        address: input.address,
        to_wilaya_name: input.wilaya,
        to_commune_name: input.commune ?? input.wilaya,
        product_list: input.productName ?? "Order",
        price: Math.round(input.totalPrice),
        do_insurance: false,
        declared_value: Math.round(input.totalPrice),
        height: 10,
        width: 10,
        length: 10,
        weight: input.weight ?? 1,
        freeshipping: false,
        is_stopdesk: false,
        has_exchange: false,
      },
    ];

    const data = await this.request<{
      [orderId: string]: { tracking?: string; success?: boolean; message?: string };
    }>(`${YALIDINE_BASE_URL}/parcels/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-ID": this.credentials.apiSecret ?? "",
        "X-API-TOKEN": this.credentials.apiKey,
      },
      body: JSON.stringify(payload),
    });

    const entry = data[input.orderId];
    const tracking = entry?.tracking ?? this.generateTrackingNumber("YAL");

    return { trackingNumber: tracking, status: "created", raw: data };
  }

  async trackShipment(trackingNumber: string): Promise<TrackingResult> {
    if (!this.hasCredentials()) {
      return { trackingNumber, status: "in_transit" };
    }

    const data = await this.request<{
      status?: string;
      last_update?: string;
      history?: Array<{ status: string; date: string; center?: string }>;
    }>(`${YALIDINE_BASE_URL}/parcels/${encodeURIComponent(trackingNumber)}`, {
      method: "GET",
      headers: {
        "X-API-ID": this.credentials.apiSecret ?? "",
        "X-API-TOKEN": this.credentials.apiKey,
      },
    });

    return {
      trackingNumber,
      status: mapYalidineStatus(data.status),
      lastUpdate: data.last_update,
      history: data.history?.map((h) => ({
        status: h.status,
        date: h.date,
        location: h.center,
      })),
      raw: data,
    };
  }
}

function mapYalidineStatus(status?: string): TrackingResult["status"] {
  const s = (status ?? "").toLowerCase();
  if (s.includes("livr")) return "delivered";
  if (s.includes("transit") || s.includes("expédi") || s.includes("centre")) return "in_transit";
  if (s.includes("annul")) return "cancelled";
  if (s.includes("échec") || s.includes("retour")) return "failed";
  if (s.includes("créé") || s.includes("pret")) return "created";
  return "pending";
}
