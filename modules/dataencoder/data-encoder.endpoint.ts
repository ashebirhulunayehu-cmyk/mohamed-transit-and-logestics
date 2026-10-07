import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export const DataEncoderEndpoints = {
  // GET /api/v1/DataEncoder/GetDashboard
  getDashboard: () =>
    service.get(API_ROUTES.dataEncoder.getDashboard),

  // GET /api/v1/DataEncoder/GetAllCustomers/{recordStatus}
  getAllCustomers: (recordStatus = "1") =>
    service.get(
      `${API_ROUTES.dataEncoder.getAllCustomers}/${encodeURIComponent(recordStatus)}`
    ),

  // POST /api/v1/DataEncoder/CreateCustomer
  createCustomer: (payload: Record<string, unknown>) =>
    service.post(API_ROUTES.dataEncoder.createCustomer, payload),

  // PUT /api/v1/DataEncoder/UpdateCustomer
  updateCustomer: (payload: Record<string, unknown>) =>
    service.put(API_ROUTES.dataEncoder.updateCustomer, payload),

  // POST /api/v1/DataEncoder/Create%20services
  createService: (payload: Record<string, unknown>) =>
    service.post(API_ROUTES.dataEncoder.createService, payload),

  // PUT /api/v1/DataEncoder/services/{id}/service-type
  updateServiceType: (
    id: number | string,
    payload: Record<string, unknown>
  ) =>
    service.put(API_ROUTES.dataEncoder.updateServiceType(id), payload),

  // POST /api/v1/DataEncoder/services/{id}/documents
  uploadServiceDocuments: (
    id: number | string,
    payload: unknown
  ) =>
    service.post(API_ROUTES.dataEncoder.uploadServiceDocuments(id), payload),

  // POST /api/v1/DataEncoder/services/{id}/submit
  submitService: (
    id: number | string,
    payload?: unknown
  ) =>
    service.post(API_ROUTES.dataEncoder.submitService(id), payload),

  // GET /api/v1/DataEncoder/services
  getServices: () => service.get(API_ROUTES.dataEncoder.services),

  // GET /api/v1/Document/GetServiceDocuments?serviceId={id}
  getServiceDocuments: (serviceId: number | string) =>
    service.get(API_ROUTES.document.getServiceDocuments, {
      params: { serviceId },
    }),

  // GET /api/v1/Document/DownloadDocument?documentId={id}
  downloadDocument: (documentId: number | string) =>
    service.get(API_ROUTES.document.downloadDocument, {
      params: { documentId },
      responseType: "blob",
    }),

  // POST /api/v1/Document/VerifyDocument
  verifyDocument: (payload: {
    documentId: number | string;
    isVerified: boolean;
    notes?: string;
    verificationNotes?: string;
    verifiedByUserId?: number | string;
  }) => service.post(API_ROUTES.document.verifyDocument, payload),
};