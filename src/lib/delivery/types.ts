// Shared types for the delivery integration layer.
// Every provider adapter must conform to the DeliveryAdapter interface
// so the service layer can treat them interchangeably.

export type ShipmentStatus =
  | "pending"
  | "created"
  | "in_transit"
  | "delivered"
  | "failed"
  | "cancelled";

export interface DeliveryCredentials {
  apiKey: string;
  apiSecret?: string;
}

export interface CreateShipmentInput {
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  wilaya: string;
  commune?: string;
  address: string;
  productName?: string;
  totalPrice: number;
  weight?: number;
  notes?: string;
}

export interface CreateShipmentResult {
  trackingNumber: string;
  status: ShipmentStatus;
  labelUrl?: string;
  raw?: unknown;
}

export interface TrackingResult {
  trackingNumber: string;
  status: ShipmentStatus;
  lastUpdate?: string;
  history?: Array<{ status: string; date: string; location?: string }>;
  raw?: unknown;
}

export interface ValidationResult {
  ok: boolean;
  message: string;
}

export interface DeliveryAdapter {
  /** Stable provider key matching delivery_companies.name (lowercased). */
  readonly key: string;
  /** Human-friendly label. */
  readonly label: string;

  /**
   * Validate the credentials by issuing a lightweight authenticated request
   * against the provider. Returns ok=false with a human-friendly message on
   * any auth/permission/transport error.
   */
  validateCredentials(): Promise<ValidationResult>;

  createShipment(input: CreateShipmentInput): Promise<CreateShipmentResult>;
  trackShipment(trackingNumber: string): Promise<TrackingResult>;
  cancelShipment?(trackingNumber: string): Promise<boolean>;
}
