import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export type DocumentQueryParams = Record<string, unknown>;

export interface DocumentActionPayload {
  documentId?: string | number;
  id?: string | number;
  serviceId?: string;
  serviceStageId?: string | number;
  isVerified?: boolean;
  notes?: string;
  verificationNotes?: string;
  verifiedByUserId?: string | number;
  file?: File | Blob | string;
  description?: string;
  expiryDate?: string | Date;
  documentIds?: Array<string | number>;
  ids?: Array<string | number>;
}

const normalizeDocumentIds = (
  payload?: Array<string | number> | DocumentActionPayload | FormData
): Array<string | number> => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload instanceof FormData) {
    const raw = payload.getAll("documentIds").flatMap((value) =>
      value === null || value === undefined || String(value).trim() === ""
        ? []
        : [String(value)]
    );
    return raw.length ? raw.map((value) => Number(value) || value) : [];
  }

  if (payload && typeof payload === "object") {
    const ids = Array.isArray(payload.documentIds)
      ? payload.documentIds
      : Array.isArray(payload.ids)
        ? payload.ids
        : [];

    return ids;
  }

  return [];
};

export const documentEndpoints = {
  uploadServiceDocument: (payload: FormData | DocumentActionPayload) =>
    service.post(API_ROUTES.document.uploadServiceDocument, payload),

  getServiceDocuments: (params?: DocumentQueryParams) =>
    service.get(API_ROUTES.document.getServiceDocuments, { params }),

  deleteDocument: (id: string | number) =>
    service.delete(API_ROUTES.document.deleteDocument, {
      data: { id, documentId: id },
    }),

  deleteStageTransportDocument: (id: string | number) =>
    service.delete(API_ROUTES.shipment.deleteStageTransportDocument(id)),

  verifyDocument: (payload: DocumentActionPayload) =>
    service.post(API_ROUTES.document.verifyDocument, payload),

  downloadDocument: (documentId: string | number, params?: DocumentQueryParams) =>
    service.get(API_ROUTES.document.downloadDocument, {
      params: { documentId, ...params },
    }),

  downloadDocuments: (payload: Array<string | number> | DocumentActionPayload | FormData) =>
    service.post(API_ROUTES.document.downloadDocuments, normalizeDocumentIds(payload)),
};

export const uploadServiceDocument = (payload: FormData | DocumentActionPayload) =>
  documentEndpoints.uploadServiceDocument(payload);

export const getServiceDocuments = (params?: DocumentQueryParams) =>
  documentEndpoints.getServiceDocuments(params);

export const deleteDocument = (id: string | number) =>
  documentEndpoints.deleteDocument(id);

export const deleteStageTransportDocument = (id: string | number) =>
  documentEndpoints.deleteStageTransportDocument(id);

export const verifyDocument = (payload: DocumentActionPayload) =>
  documentEndpoints.verifyDocument(payload);

export const downloadDocument = (documentId: string | number, params?: DocumentQueryParams) =>
  documentEndpoints.downloadDocument(documentId, params);

export const downloadDocuments = (
  payload: Array<string | number> | DocumentActionPayload | FormData
) => documentEndpoints.downloadDocuments(payload);
