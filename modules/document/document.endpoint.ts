import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export type DocumentQueryParams = Record<string, unknown>;

export interface DocumentActionPayload {
  documentId?: string | number;
  id?: string | number;
  serviceId?: string;
  isVerified?: boolean;
  notes?: string;
  documentIds?: Array<string | number>;
  ids?: Array<string | number>;
}

export const documentEndpoints = {
  uploadServiceDocument: (payload: FormData | DocumentActionPayload) =>
    service.post(API_ROUTES.document.uploadServiceDocument, payload),

  getServiceDocuments: (params?: DocumentQueryParams) =>
    service.get(API_ROUTES.document.getServiceDocuments, { params }),

  deleteDocument: (id: string | number) =>
    service.delete(API_ROUTES.document.deleteDocument, {
      data: { id, documentId: id },
    }),

  verifyDocument: (payload: DocumentActionPayload) =>
    service.post(API_ROUTES.document.verifyDocument, payload),

  downloadDocument: (documentId: string | number, params?: DocumentQueryParams) =>
    service.get(API_ROUTES.document.downloadDocument, {
      params: { documentId, ...params },
    }),

  downloadDocuments: (payload: FormData | DocumentActionPayload) =>
    service.post(API_ROUTES.document.downloadDocuments, payload),
};

export const uploadServiceDocument = (payload: FormData | DocumentActionPayload) =>
  documentEndpoints.uploadServiceDocument(payload);

export const getServiceDocuments = (params?: DocumentQueryParams) =>
  documentEndpoints.getServiceDocuments(params);

export const deleteDocument = (id: string | number) =>
  documentEndpoints.deleteDocument(id);

export const verifyDocument = (payload: DocumentActionPayload) =>
  documentEndpoints.verifyDocument(payload);

export const downloadDocument = (documentId: string | number, params?: DocumentQueryParams) =>
  documentEndpoints.downloadDocument(documentId, params);

export const downloadDocuments = (payload: FormData | DocumentActionPayload) =>
  documentEndpoints.downloadDocuments(payload);
