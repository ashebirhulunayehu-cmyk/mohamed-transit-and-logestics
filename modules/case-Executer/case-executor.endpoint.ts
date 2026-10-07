import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export const CaseExecutorEndpoints = {
  getDashboard: () =>
    service.get<unknown>(API_ROUTES.caseExecutor.getDashboard),
  getAssignedServiceById: (id: string | number) =>
    service.get<unknown>(API_ROUTES.caseExecutor.getAssignedServiceById, {
      params: { Id: id },
    }),
};