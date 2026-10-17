import { service } from "@/modules/utils/axios/service";
import { API_ROUTES } from "@/modules/api";
import { shipmentEndpoints } from "@/modules/shipment/shipment.endpoint";
import type {
  ManagerCustomerQuery,
  ManagerExecutorAssignmentRequest,
  ManagerServiceQuery,
} from "./manager.type";
import type { ShipmentServiceStageUpdatePayload } from "@/modules/shipment/shipment.types";

const stageStatusValues: Record<string, number> = {
  notstarted: 1,
  pending: 2,
  inprogress: 3,
  completed: 4,
  blocked: 5,
  needsreview: 6,
};

export const ManagerEndpoints = {
  getDashboard: () => service.get(API_ROUTES.manager.getDashboard),
  getReportsAnalytics: () => service.get(API_ROUTES.manager.getReportsAnalytics),
  assignExecutor: (payload: ManagerExecutorAssignmentRequest) =>
    service.put(API_ROUTES.manager.assignExecutor, payload),
  updateServiceStage: (payload: ShipmentServiceStageUpdatePayload) => {
    const rawStatus = payload.status;
    const normalizedStatus = typeof rawStatus === "string"
      ? rawStatus.toLowerCase().replaceAll(/[\s_-]+/g, "")
      : "";
    const status = typeof rawStatus === "number"
      ? rawStatus
      : stageStatusValues[normalizedStatus];

    if (status === undefined || !Number.isInteger(status) || status < 1 || status > 6) {
      throw new Error("Select a valid workflow stage status before saving.");
    }

    const stageExecutionId = payload.stageExecutionId ?? payload.shipmentStageId;
    const userId = payload.userId ?? payload.UserId;
    return service.put(API_ROUTES.shipment.updateServiceStage, {
      ...payload,
      userId,
      UserId: userId,
      shipmentStageId: payload.shipmentStageId ?? stageExecutionId,
      stageExecutionId,
      status,
    });
  },
  getServiceById: (id: string | number) => {
    const serviceId = String(id).trim();
    if (!serviceId) {
      throw new Error("A service ID is required to load service details.");
    }

    return service.get(API_ROUTES.manager.getServiceById, {
      params: { serviceId },
    });
  },
  getServiceStages: (id: string | number) =>
    shipmentEndpoints.getStages({ shipmentId: id }),
  getServiceDocuments: (id: string | number) =>
    service.get(API_ROUTES.document.getServiceDocuments, { params: { serviceId: id } }),
  uploadServiceDocument: (payload: FormData) =>
    service.post(API_ROUTES.document.uploadServiceDocument, payload),
  getAllServices: (params?: ManagerServiceQuery) =>
    service.get(API_ROUTES.manager.getAllServices, { params }),
  getAllStaff: () =>
    service.get(API_ROUTES.manager.getAllStaff),
  getStaffById: (id: string | number) =>
    service.get(API_ROUTES.auth.user.getById(id)),
  getNotifications: () =>
    service.get(API_ROUTES.manager.getNotifications),
  getSupportRequests: () =>
    service.get(API_ROUTES.manager.getSupportRequests),
  getAllCustomers: (params: ManagerCustomerQuery = { page: 1, pageSize: 20 }) =>
    service.get(API_ROUTES.manager.getAllCustomers, {
      params: { ...params, page: params.page ?? 1, pageSize: params.pageSize ?? 20 },
    }),
};
