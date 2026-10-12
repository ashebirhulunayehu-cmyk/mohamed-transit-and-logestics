import { service } from "@/modules/utils/axios/service";
import { API_ROUTES } from "@/modules/api";
import type {
  ManagerCustomerQuery,
  ManagerExecutorAssignmentRequest,
  ManagerServiceQuery,
} from "./manager.type";

export const ManagerEndpoints = {
  getDashboard: () => service.get(API_ROUTES.manager.getDashboard),
  getReportsAnalytics: () => service.get(API_ROUTES.manager.getReportsAnalytics),
  assignExecutor: (payload: ManagerExecutorAssignmentRequest) =>
    service.put(API_ROUTES.manager.assignExecutor, payload),
  getServiceById: (id: string | number) =>
    service.get(API_ROUTES.manager.getServiceById, { params: { id } }),
  getAllServices: (params?: ManagerServiceQuery) =>
    service.get(API_ROUTES.manager.getAllServices, { params }),
  getAllStaff: () =>
    service.get(API_ROUTES.manager.getAllStaff),
  getNotifications: () =>
    service.get(API_ROUTES.manager.getNotifications),
  getAllCustomers: (params?: ManagerCustomerQuery) =>
    service.get(API_ROUTES.manager.getAllCustomers, { params }),
};
