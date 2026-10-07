import { create } from "zustand";
import { DashboardEndpoints } from "./dashboard.endpoint";
import type { DashboardApiEnvelope, DashboardList, DashboardValue } from "./dashboard.type";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const unwrapResponse = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  if ("data" in value && value.data !== undefined) {
    return unwrapResponse(value.data);
  }

  if ("payload" in value && value.payload !== undefined) {
    return unwrapResponse(value.payload);
  }

  if ("response" in value && value.response !== undefined) {
    return unwrapResponse(value.response);
  }

  return value;
};

const normalizeList = (value: unknown): DashboardList => {
  const unwrapped = unwrapResponse(value);

  if (Array.isArray(unwrapped)) {
    return unwrapped.filter(isRecord) as DashboardList;
  }

  if (isRecord(unwrapped) && Array.isArray(unwrapped.data)) {
    return unwrapped.data.filter(isRecord) as DashboardList;
  }

  if (isRecord(unwrapped) && Array.isArray(unwrapped.payload)) {
    return unwrapped.payload.filter(isRecord) as DashboardList;
  }

  return [];
};

interface DashboardState {
  view: DashboardList;
  viewSort: DashboardList;
  organization: DashboardList;
  organizationSort: DashboardList;
  loading: boolean;
  error: string | null;
  fetchView: (params?: Record<string, unknown>) => Promise<DashboardList>;
  fetchViewSort: (params?: Record<string, unknown>) => Promise<DashboardList>;
  fetchOrganization: (params?: Record<string, unknown>) => Promise<DashboardList>;
  fetchOrganizationSort: (params?: Record<string, unknown>) => Promise<DashboardList>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  view: [],
  viewSort: [],
  organization: [],
  organizationSort: [],
  loading: false,
  error: null,

  fetchView: async (params) => {
    set({ loading: true, error: null });

    try {
      const response = (await DashboardEndpoints.view(params)) as
        | DashboardApiEnvelope<DashboardList>
        | DashboardList
        | DashboardValue[]
        | unknown;
      const data = normalizeList(response);

      set({ view: data, loading: false, error: null });
      return data;
    } catch (error: unknown) {
      const message = typeof error === "string" ? error : error instanceof Error ? error.message : "Failed to load dashboard data.";
      set({ loading: false, error: message });
      return [];
    }
  },

  fetchViewSort: async (params) => {
    set({ loading: true, error: null });

    try {
      const response = (await DashboardEndpoints.viewSort(params)) as
        | DashboardApiEnvelope<DashboardList>
        | DashboardList
        | DashboardValue[]
        | unknown;
      const data = normalizeList(response);

      set({ viewSort: data, loading: false, error: null });
      return data;
    } catch (error: unknown) {
      const message = typeof error === "string" ? error : error instanceof Error ? error.message : "Failed to load dashboard view sort data.";
      set({ loading: false, error: message });
      return [];
    }
  },

  fetchOrganization: async (params) => {
    set({ loading: true, error: null });

    try {
      const response = (await DashboardEndpoints.organization(params)) as
        | DashboardApiEnvelope<DashboardList>
        | DashboardList
        | DashboardValue[]
        | unknown;
      const data = normalizeList(response);

      set({ organization: data, loading: false, error: null });
      return data;
    } catch (error: unknown) {
      const message = typeof error === "string" ? error : error instanceof Error ? error.message : "Failed to load organization dashboard data.";
      set({ loading: false, error: message });
      return [];
    }
  },

  fetchOrganizationSort: async (params) => {
    set({ loading: true, error: null });

    try {
      const response = (await DashboardEndpoints.organizationSort(params)) as
        | DashboardApiEnvelope<DashboardList>
        | DashboardList
        | DashboardValue[]
        | unknown;
      const data = normalizeList(response);

      set({ organizationSort: data, loading: false, error: null });
      return data;
    } catch (error: unknown) {
      const message = typeof error === "string" ? error : error instanceof Error ? error.message : "Failed to load organization sort data.";
      set({ loading: false, error: message });
      return [];
    }
  },
}));
