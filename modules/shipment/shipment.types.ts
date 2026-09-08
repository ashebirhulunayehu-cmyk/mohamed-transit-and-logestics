export type ShipmentParams = Record<string, unknown>;

export type ShipmentPayload = Record<string, unknown>;

export type ShipmentDocumentPayload =
  | FormData
  | {
      shipmentId?: string | number;
      id?: string | number;
      documentName?: string;
      [key: string]: unknown;
    };

export interface ShipmentRecord {
  id?: string | number;
  importerId?: string | number;
  serviceId?: string | number;
  status?: string;
  serviceStage?: string;
  stageName?: string;
  transportName?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface ShipmentApiResponse<T = unknown> {
  statusCode?: number;
  error?: boolean;
  errors?: string[];
  message?: string;
  response?: {
    data?: T;
  } | T;
}
