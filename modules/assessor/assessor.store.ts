import { create } from 'zustand';
import { AssessorEndpoints } from './assessor.endpoint';
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
  PendingServiceReview,
  VerifyCustomerDocumentRequest,
} from './assessor.type';

interface AssessorState {
  pendingCustomers: PendingCustomerApproval[];
  pendingServices: PendingServiceReview[];
  servicesUnderOversight: AssessorItem[];
  complianceIssues: AssessorComplianceIssue[];
  complianceFeedback: AssessorComplianceFeedback | null;
  dashboardData: AssessorDashboardSummary | null;
  reviewedService: AssessorReviewedService | null;
  loading: boolean;
  error: string | null;
  dashboardLoading: boolean;
  dashboardError: string | null;
  complianceIssuesLoading: boolean;
  complianceIssuesError: string | null;
  pendingCustomersLoading: boolean;
  pendingCustomersError: string | null;

  fetchPendingCustomers: () => Promise<void>;
  fetchPendingServices: () => Promise<void>;
  fetchServicesUnderOversight: () => Promise<void>;
  fetchServiceWorklists: () => Promise<void>;
  approveCustomer: (payload: { customerId: number; isApproved: boolean; notes: string | null; returnForRevision?: boolean }) => Promise<CustomerApprovalResult>;
  verifyCustomerDocument: (payload: VerifyCustomerDocumentRequest) => Promise<void>;
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

  if ('result' in record && record.result !== undefined) {
    return unwrapApiData(record.result);
  }

  if ('resultData' in record && record.resultData !== undefined) {
    return unwrapApiData(record.resultData);
  }

  return record;
};

const normalizeArray = (value: unknown): AssessorItem[] => {
  let current = value;
  const listKeys = [
    'items',
    'customers',
    'pendingCustomers',
    'pendingCustomerApprovals',
    'customerApprovals',
    'services',
    'serviceRecords',
    'pendingServices',
    'servicesUnderOversight',
    'oversightServices',
    'underOversight',
    'records',
    'rows',
  ];
  const normalizedListKeys = listKeys.map((key) => key.toLowerCase());

  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) {
      if (!current.every(isRecord)) {
        throw new Error('The Assessor response contains invalid records.');
      }
      return current;
    }

    if (!isRecord(current)) break;

    const entry = Object.entries(current).find(([key, value]) =>
      normalizedListKeys.includes(key.toLowerCase()) &&
      (Array.isArray(value) || isRecord(value)),
    );
    if (entry) {
      current = entry[1];
      continue;
    }

    const wrapper = Object.entries(current).find(([key, value]) =>
      ['data', 'payload', 'response', 'result'].includes(key.toLowerCase()) &&
      (Array.isArray(value) || isRecord(value)),
    );
    if (wrapper) {
      current = wrapper[1];
      continue;
    }

    const hasRecordId = Object.keys(current).some((key) =>
      ['id', 'serviceid', 'shipmentid', 'customerid'].includes(key.toLowerCase()),
    );
    if (hasRecordId) return [current];
    break;
  }

  throw new Error('The Assessor response did not contain a record list.');
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
  dashboardLoading: false,
  dashboardError: null,
  complianceIssuesLoading: false,
  complianceIssuesError: null,
  pendingCustomersLoading: false,
  pendingCustomersError: null,

  fetchPendingCustomers: async () => {
    set({ pendingCustomersLoading: true, pendingCustomersError: null });
    try {
      const response = (await AssessorEndpoints.getPendingCustomerApprovals()) as AssessorApiEnvelope<PendingCustomerApproval[]> | unknown;
      const payload = unwrapApiData(response);
      set({
        pendingCustomers: normalizeArray(payload),
        pendingCustomersLoading: false,
        pendingCustomersError: null,
      });
    } catch (err: unknown) {
      set({
        pendingCustomersLoading: false,
        pendingCustomersError: getErrorMessage(err, 'Failed to fetch pending customers'),
      });
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
    const [pendingResult, oversightResult] = await Promise.allSettled([
      AssessorEndpoints.getPendingServices(),
      AssessorEndpoints.getServicesUnderOversight(),
    ]);

    const nextState: Partial<AssessorState> = { loading: false, error: null };
    const errors: string[] = [];

    if (pendingResult.status === 'fulfilled') {
      try {
        nextState.pendingServices = normalizeArray(unwrapApiData(pendingResult.value));
      } catch (err: unknown) {
        errors.push(getErrorMessage(err, 'Failed to read pending services'));
      }
    } else {
      errors.push(getErrorMessage(pendingResult.reason, 'Failed to fetch pending services'));
    }

    if (oversightResult.status === 'fulfilled') {
      try {
        nextState.servicesUnderOversight = normalizeArray(unwrapApiData(oversightResult.value));
      } catch (err: unknown) {
        errors.push(getErrorMessage(err, 'Failed to read services under oversight'));
      }
    } else {
      errors.push(getErrorMessage(oversightResult.reason, 'Failed to fetch services under oversight'));
    }

    if (errors.length) nextState.error = errors.join('; ');
    set(nextState);
  },

  approveCustomer: async (payload) => {
    set({ loading: true, error: null });
    try {
      const approvedCustomer = await AssessorEndpoints.approveCustomer(payload);
      await get().fetchPendingCustomers();
      await get().fetchDashboard();
      set({ loading: false });
      return approvedCustomer;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, 'Action failed'), loading: false });
      throw err;
    }
  },

  verifyCustomerDocument: async (payload) => {
    set({ loading: true, error: null });
    try {
      await AssessorEndpoints.verifyCustomerDocument(payload);
      await get().fetchPendingCustomers();
      await get().fetchDashboard();
      set({ loading: false, error: null });
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to update customer document verification');
      set({ error: message, loading: false });
      throw err;
    }
  },

  reviewService: async (payload) => {
    set({ loading: true, error: null });
    try {
      const reviewedService = await AssessorEndpoints.reviewService(payload);
      set({ reviewedService, loading: false, error: null });
      await get().fetchDashboard();
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
    set({ loading: true, error: null, dashboardLoading: true, dashboardError: null });
    try {
      const response = (await AssessorEndpoints.getDashboard()) as AssessorApiEnvelope<AssessorDashboardSummary> | unknown;
      const payload = unwrapApiData(response);

      const dashboardItem = isRecord(payload)
        ? (payload as unknown as AssessorDashboardSummary)
        : null;

      set({
        dashboardData: dashboardItem,
        loading: false,
        dashboardLoading: false,
        dashboardError: null,
      });
    } catch (err: unknown) {
      const error = getErrorMessage(err, 'Failed to load dashboard');
      set({ error, dashboardError: error, loading: false, dashboardLoading: false });
    }
  },

  fetchComplianceIssues: async () => {
    set({ loading: true, error: null, complianceIssuesLoading: true, complianceIssuesError: null });
    try {
      const response = (await AssessorEndpoints.getComplianceIssues()) as AssessorApiEnvelope<AssessorComplianceIssue[]> | unknown;
      const payload = unwrapApiData(response);

      set({
        complianceIssues: normalizeArray(payload),
        loading: false,
        complianceIssuesLoading: false,
        complianceIssuesError: null,
      });
    } catch (err: unknown) {
      const error = getErrorMessage(err, 'Failed to load compliance issues');
      set({ error, complianceIssuesError: error, loading: false, complianceIssuesLoading: false });
    }
  },
}));