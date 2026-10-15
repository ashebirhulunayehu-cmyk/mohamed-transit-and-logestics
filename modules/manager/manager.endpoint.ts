import { service } from "@/modules/utils/axios/service";
import { API_ROUTES } from "@/modules/api";
import type {
  ManagerCustomerQuery,
  ManagerExecutorAssignmentRequest,
  ManagerServiceQuery,
} from "./manager.type";
import type { ShipmentServiceStageUpdatePayload } from "@/modules/shipment/shipment.types";

export const ManagerEndpoints = {
  getDashboard: () => service.get(API_ROUTES.manager.getDashboard),
  getReportsAnalytics: () => service.get(API_ROUTES.manager.getReportsAnalytics),
  assignExecutor: (payload: ManagerExecutorAssignmentRequest) =>
    service.put(API_ROUTES.manager.assignExecutor, payload),
  updateServiceStage: (payload: ShipmentServiceStageUpdatePayload) =>
    service.put(API_ROUTES.shipment.updateServiceStage, payload),
  getServiceById: (id: string | number) => {
    const serviceId = String(id).trim();
    if (!serviceId) {
      throw new Error("A service ID is required to load service details.");
    }

    return service.get(API_ROUTES.manager.getServiceById, {
      params: { id: serviceId, serviceId },
    });
  },
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
