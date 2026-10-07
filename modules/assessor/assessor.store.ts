import { create } from 'zustand';
import { AssessorEndpoints } from './assessor.endpoint.ts';
import type {
  AssessorApiEnvelope,
  AssessorComplianceFeedback,
  AssessorComplianceFeedbackRequest,
  AssessorComplianceIssue,
  AssessorDashboardSummary,
  AssessorItem,
  AssessorReviewedService,
  AssessorServiceReviewRequest,
  CustomerApprovalResult,
  PendingCustomerApproval,
} from './assessor.type';

interface AssessorState {
  pendingCustomers: AssessorItem[];
  pendingServices: AssessorItem[];
  servicesUnderOversight: AssessorItem[];
  complianceIssues: AssessorItem[];
  complianceFeedback: AssessorComplianceFeedback | null;
  dashboardData: AssessorDashboardSummary | null;
  reviewedService: AssessorReviewedService | null;
  loading: boolean;
  error: string | null;

  fetchPendingCustomers: () => Promise<void>;
  fetchPendingServices: () => Promise<void>;
  fetchServicesUnderOversight: () => Promise<void>;
  fetchServiceWorklists: () => Promise<void>;
  approveCustomer: (payload: { customerId: number; isApproved: boolean; notes: string | null }) => Promise<CustomerApprovalResult>;
  reviewService: (payload: AssessorServiceReviewRequest) => Promise<AssessorReviewedService>;
  addComplianceFeedback: (payload: AssessorComplianceFeedbackRequest) => Promise<AssessorComplianceFeedback>;
  fetchDashboard: () => Promise<void>;
  fetchComplianceIssues: () => Promise<void>;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
};

const normalizeArray = (value: unknown): AssessorItem[] => {
  if (Array.isArray(value)) {
    return value as AssessorItem[];
  }

  return [];
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const unwrapApiData = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;

  if ('data' in record && record.data !== undefined) {
    return unwrapApiData(record.data);
  }

  if ('payload' in record && record.payload !== undefined) {
    return unwrapApiData(record.payload);
  }

  if ('response' in record && record.response !== undefined) {
    return unwrapApiData(record.response);
  }

  return record;
};

export const useAssessorStore = create<AssessorState>((set, get) => ({
  pendingCustomers: [],
  pendingServices: [],
  servicesUnderOversight: [],
  complianceIssues: [],
  complianceFeedback: null,
  dashboardData: null,
  reviewedService: null,
  loading: false,
  error: null,

  fetchPendingCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const response = (await AssessorEndpoints.getPendingCustomerApprovals()) as AssessorApiEnvelope<PendingCustomerApproval[]> | unknown;
      const payload = unwrapApiData(response);
      set({ pendingCustomers: normalizeArray(payload), loading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Failed to fetch pending customers'), loading: false });
    }
  },

  fetchPendingServices: async () => {
    set({ loading: true, error: null });
    try {
      const response = (await AssessorEndpoints.getPendingServices()) as AssessorApiEnvelope<AssessorItem[]> | unknown;
      const payload = unwrapApiData(response);
      set({ pendingServices: normalizeArray(payload), loading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Failed to fetch pending services'), loading: false });
    }
  },

  fetchServicesUnderOversight: async () => {
    set({ loading: true, error: null });
    try {
      const response = (await AssessorEndpoints.getServicesUnderOversight()) as AssessorApiEnvelope<AssessorItem[]> | unknown;
      const payload = unwrapApiData(response);
      set({ servicesUnderOversight: normalizeArray(payload), loading: false });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Failed to fetch services under oversight'), loading: false });
    }
  },

  fetchServiceWorklists: async () => {
    set({ loading: true, error: null });
    try {
      const [pendingResponse, oversightResponse] = await Promise.all([
        AssessorEndpoints.getPendingServices(),
        AssessorEndpoints.getServicesUnderOversight(),
      ]);
      set({
        pendingServices: normalizeArray(unwrapApiData(pendingResponse)),
        servicesUnderOversight: normalizeArray(unwrapApiData(oversightResponse)),
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Failed to fetch assessor service worklists'), loading: false });
    }
  },

  approveCustomer: async (payload) => {
    set({ loading: true, error: null });
    try {
      const approvedCustomer = await AssessorEndpoints.approveCustomer(payload);
      await get().fetchPendingCustomers();
      return approvedCustomer;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Action failed'), loading: false });
      throw err;
    }
  },

  reviewService: async (payload) => {
    set({ loading: true, error: null });
    try {
      const reviewedService = await AssessorEndpoints.reviewService(payload);
      set({ reviewedService, loading: false, error: null });
      return reviewedService;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Service review failed'), loading: false });
      throw err;
    }
  },

  addComplianceFeedback: async (payload) => {
    set({ loading: true, error: null });
    try {
      const complianceFeedback = await AssessorEndpoints.addComplianceFeedback(payload);
      set({ complianceFeedback, loading: false, error: null });
      return complianceFeedback;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Failed to add compliance feedback'), loading: false });
      throw err;
    }
  },

  fetchDashboard: async () => {
    set({ loading: true, error: null });
    try {
      const response = (await AssessorEndpoints.getDashboard()) as AssessorApiEnvelope<AssessorDashboardSummary> | unknown;
      const payload = unwrapApiData(response);

      const dashboardItem = isRecord(payload)
        ? (payload as unknown as AssessorDashboardSummary)
        : null;

      set({
        dashboardData: dashboardItem,
        loading: false,
      });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Failed to load dashboard'), loading: false });
    }
  },

  fetchComplianceIssues: async () => {
    set({ loading: true, error: null });
    try {
      const response = (await AssessorEndpoints.getComplianceIssues()) as AssessorApiEnvelope<AssessorComplianceIssue[]> | unknown;
      const payload = unwrapApiData(response);

      set({
        complianceIssues: normalizeArray(payload),
        loading: false,
      });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Failed to load compliance issues'), loading: false });
    }
  },
}));