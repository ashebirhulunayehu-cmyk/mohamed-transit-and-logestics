import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export const DashboardEndpoints = {
  view: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.dashboard.view, { params }),
  viewSort: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.dashboard.viewSort, { params }),
  organization: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.dashboard.organization, { params }),
  organizationSort: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.dashboard.organizationSort, { params }),
};
