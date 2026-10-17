import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";
import type {
  CaseExecutorBlockStageRequest,
  CaseExecutorRiskLevelRequest,
  CaseExecutorShipmentStatusRequest,
  CaseExecutorShipmentUpdateRequest,
  CaseExecutorStageCommentRequest,
  CaseExecutorStageStatusRequest,
} from "./case-Executer.type";

export const CaseExecutorEndpoints = {
  getDashboard: () =>
    service.get<unknown>(API_ROUTES.caseExecutor.getDashboard),
  getAssignedServices: () =>
      service.get<unknown>(API_ROUTES.caseExecutor.getAssignedServices),
  getServiceDocuments: (serviceId: string | number) =>
      service.get<unknown>(API_ROUTES.document.getServiceDocuments, {
        params: { serviceId },
        validateStatus: (status) => (status >= 200 && status < 300) || status === 400,
      }),
  uploadAssignedServiceDocument: (payload: FormData) =>
    service.post<unknown>(API_ROUTES.document.uploadServiceDocument, payload),
  deleteAssignedDocument: (documentId: string | number, source: "service" | "stage") =>
    service.delete<unknown>(API_ROUTES.caseExecutor.deleteAssignedDocument, {
      params: { documentId, source },
    }),
  verifyAssignedDocument: (payload: { documentId: string | number; source: "service" | "stage" }) =>
    service.put<unknown>(API_ROUTES.caseExecutor.verifyAssignedDocument, payload),
  downloadAssignedDocument: (
    documentId: string | number,
    source: "service" | "stage",
  ): Promise<unknown> => {
    const id = String(documentId).trim();
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      throw new Error("A valid document ID is required.");
    }

    if (source === "service") {
      return service.get<unknown>(API_ROUTES.document.downloadDocument, {
        params: { documentId: Number(id) },
        responseType: "blob",
        validateStatus: (status) => status === 200,
      });
    }

    return service.get<unknown>(API_ROUTES.caseExecutor.downloadStageDocument, {
      params: { documentId: Number(id) },
      responseType: "blob",
      validateStatus: (status) => status === 200,
    });
  },
  downloadAssignedDocuments: (
    documentIds: Array<string | number>,
  ): Promise<unknown> => {
    const ids = documentIds.map((value) => String(value).trim());
    if (
      !ids.length ||
      ids.some((id) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
    ) {
      throw new Error("Select valid documents to download.");
    }

    return service.post<unknown>(
      API_ROUTES.document.downloadDocuments,
      ids.map(Number),
      { responseType: "blob", validateStatus: (status) => status === 200 },
    );
  },
  getAssignedServiceById: (id: string | number): Promise<unknown> =>
    service.get<unknown>(API_ROUTES.caseExecutor.getAssignedServiceById, {
      params: { Id: id },
    }),
  getServiceStages: (shipmentId: string | number): Promise<unknown> =>
    service.get<unknown>(API_ROUTES.shipment.getStages, {
      params: { shipmentId },
    }),
  getMyActivity: () =>
    service.get<unknown>(API_ROUTES.caseExecutor.getMyActivity),
  uploadStageDocument: (payload: FormData) =>
    service.post<unknown>(API_ROUTES.caseExecutor.uploadStageDocument, payload),
  addStageComment: (payload: CaseExecutorStageCommentRequest) =>
    service.post<unknown>(API_ROUTES.caseExecutor.addStageComment, payload),
  setRiskLevel: (payload: CaseExecutorRiskLevelRequest) =>
    service.put<unknown>(API_ROUTES.caseExecutor.setRiskLevel, payload),
  blockStage: (payload: CaseExecutorBlockStageRequest) =>
    service.put<unknown>(API_ROUTES.caseExecutor.blockStage, payload),
  updateAssignedStageStatus: (payload: CaseExecutorStageStatusRequest) =>
    service.put<unknown>(API_ROUTES.caseExecutor.updateAssignedStageStatus, payload),
  updateShipment: (payload: CaseExecutorShipmentUpdateRequest) =>
    service.put<unknown>(API_ROUTES.shipment.update, payload),
  updateShipmentStatus: (id: string | number, payload: CaseExecutorShipmentStatusRequest) =>
    service.put<unknown>(API_ROUTES.shipment.updateStatus(id), payload),
  downloadStageDocument: (documentId: string | number): Promise<unknown> => {
    const id = String(documentId).trim();
    if (!/^[1-9]\d*$/.test(id)) {
      throw new Error("A valid stage document ID is required.");
    }
    return service.get<unknown>(API_ROUTES.caseExecutor.downloadStageDocument, {
      params: { documentId },
      responseType: "blob",
      validateStatus: (status) => status === 200,
    });
  },
  downloadStageDocuments: (documentIds: Array<string | number>): Promise<unknown> => {
    const ids = documentIds.map((value) => String(value).trim());
    if (!ids.length || ids.some((id) => !/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))) {
      throw new Error("Valid stage document IDs are required.");
    }
    return service.post<unknown>(
      API_ROUTES.caseExecutor.downloadStageDocuments,
      ids.map(Number),
      { responseType: "blob", validateStatus: (status) => status === 200 },
    );
  },
};