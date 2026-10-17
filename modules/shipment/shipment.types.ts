export type ShipmentParams = Record<string, unknown>;

export type ShipmentPayload = Record<string, unknown>;

export interface ShipmentServiceStageUpdatePayload {
  stageExecutionId?: string | number | null;
  shipmentStageId?: string | number | null;
  shipmentId?: string | number | null;
  userId?: string | number | null;
  UserId?: string | number | null;
  status?: string | number | null;
  notes?: string | null;
  [key: string]: unknown;
}

export interface StageTransportUpdatePayload {
  id: string;
  serviceStageId: string;
  fullName: string;
  licenceDocument: string;
  licenceDocumentImage?: File | null;
  phoneNumber: string;
  plateNumber: string;
  productAmount: string;
}

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
  trackingNumber?: string;
  importerId?: string | number;
  serviceId?: string | number;
  description?: string;
  itemDescription?: string;
  countryOfOrigin?: string;
  routeCategory?: string;
  serviceType?: string;
  taxCategory?: string;
  riskLevel?: string;
  mode?: string;
  assignedHub?: string;
  status?: string;
  origin?: string;
  destination?: string;
  serviceStage?: string;
  stageName?: string;
  transportName?: string;
  createAt?: string;
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
