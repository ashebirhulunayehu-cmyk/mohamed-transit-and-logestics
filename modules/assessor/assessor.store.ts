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
  AssessorServiceStage,
  AssessorStageDiscussion,
  AssessorServiceReviewRequest,
  AddStageDiscussionRequest,
  CustomerApprovalResult,
  EscalateServiceRequest,
  NotifyImporterRequest,
  PendingCustomerApproval,
  PendingServiceReview,
  RecordAssessmentRequest,
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
  escalatingServiceId: number | null;
  notifyingImporterServiceId: number | null;
  recordingAssessmentServiceId: number | null;
  serviceStagesByServiceId: Record<string, AssessorServiceStage[]>;
  stageDiscussionsByKey: Record<string, AssessorStageDiscussion[]>;
  stageDiscussionsLoading: boolean;
  stageDiscussionsError: string | null;
  stageDiscussionSubmitting: boolean;

  fetchPendingCustomers: () => Promise<void>;
  fetchPendingServices: () => Promise<void>;
  fetchServicesUnderOversight: () => Promise<void>;
  fetchServiceWorklists: () => Promise<void>;
  approveCustomer: (payload: { customerId: number; isApproved: boolean; notes: string | null; returnForRevision?: boolean }) => Promise<CustomerApprovalResult>;
  verifyCustomerDocument: (payload: VerifyCustomerDocumentRequest) => Promise<void>;
  downloadCustomerDocument: (documentId: number) => Promise<Blob>;
  reviewService: (payload: AssessorServiceReviewRequest) => Promise<AssessorReviewedService>;
  escalateService: (payload: EscalateServiceRequest) => Promise<void>;
  notifyImporter: (payload: NotifyImporterRequest) => Promise<void>;
  recordAssessment: (payload: RecordAssessmentRequest) => Promise<void>;
  fetchServiceStages: (serviceId: number) => Promise<AssessorServiceStage[]>;
  fetchStageDiscussions: (serviceId: number, stageId: number) => Promise<AssessorStageDiscussion[]>;
  addStageDiscussion: (payload: AddStageDiscussionRequest) => Promise<void>;
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

const readField = (record: Record<string, unknown>, ...names: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    names.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const readText = (value: unknown, fallback: string): string =>
  typeof value === 'string' || typeof value === 'number'
    ? String(value).trim() || fallback
    : fallback;

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

const unwrapRecordList = (value: unknown, collectionNames: string[]): Record<string, unknown>[] => {
  let current = unwrapApiData(value);
  const normalizedCollectionNames = collectionNames.map((name) => name.toLowerCase());

  for (let depth = 0; depth < 6; depth += 1) {
    if (Array.isArray(current)) {
      if (!current.every(isRecord)) {
        throw new Error('The Assessor response contains invalid records.');
      }
      return current;
    }
    if (!isRecord(current)) break;

    const collection = Object.entries(current).find(
      ([key, entry]) =>
        normalizedCollectionNames.includes(key.toLowerCase()) &&
        (Array.isArray(entry) || isRecord(entry)),
    );
    if (collection) {
      current = collection[1];
      continue;
    }

    const wrapper = Object.entries(current).find(
      ([key, entry]) =>
        ['items', 'records', 'rows', 'data', 'payload', 'response', 'result', 'resultdata'].includes(key.toLowerCase()) &&
        (Array.isArray(entry) || isRecord(entry)),
    );
    if (wrapper) {
      current = wrapper[1];
      continue;
    }

    if (Object.keys(current).some((key) => ['id', 'stageid', 'discussionid'].includes(key.toLowerCase()))) {
      return [current];
    }
    break;
  }

  throw new Error('The Assessor response did not contain a record list.');
};

const normalizeServiceStages = (value: unknown): AssessorServiceStage[] =>
  unwrapRecordList(value, ['stages', 'serviceStages', 'shipmentStages']).flatMap((record, index) => {
    const id = readField(record, 'id', 'shipmentStageId', 'serviceStageId', 'stageId');
    const numericId = typeof id === 'number' ? id : Number(id);
    if (!Number.isSafeInteger(numericId) || numericId <= 0) return [];

    const name = readText(
      readField(record, 'stageName', 'name', 'title', 'stage'),
      `Stage ${index + 1}`,
    );
    const rawStatus = readField(record, 'status', 'stageStatus', 'currentStatus');
    const status = rawStatus === null || rawStatus === undefined
      ? null
      : readText(rawStatus, '');
    return [{ id: numericId, name, status: status || null, details: record }];
  });

const normalizeStageDiscussions = (value: unknown): AssessorStageDiscussion[] =>
  unwrapRecordList(value, ['discussions', 'stageDiscussions', 'comments', 'messages']).map((record, index) => {
    const rawId = readField(record, 'id', 'discussionId', 'commentId');
    const rawAuthor = readField(record, 'user', 'author', 'createdBy', 'sender');
    const authorRecord = isRecord(rawAuthor) ? rawAuthor : null;
    const author = authorRecord
      ? [
          readField(authorRecord, 'firstName'),
          readField(authorRecord, 'lastName'),
        ]
          .filter((part): part is string => typeof part === 'string' && Boolean(part.trim()))
          .join(' ') || readText(readField(authorRecord, 'username', 'name', 'email'), '')
      : readText(rawAuthor, '');
    const rawCreatedAt = readField(record, 'createdAt', 'createAt', 'createdDate', 'timestamp');

    return {
      id: rawId === null || rawId === undefined ? `discussion-${index}` : String(rawId),
      comment: readText(readField(record, 'comment', 'message', 'content', 'text'), ''),
      createdAt: typeof rawCreatedAt === 'string' ? rawCreatedAt : null,
      author: author || null,
    };
  });

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
  escalatingServiceId: null,
  notifyingImporterServiceId: null,
  recordingAssessmentServiceId: null,
  serviceStagesByServiceId: {},
  stageDiscussionsByKey: {},
  stageDiscussionsLoading: false,
  stageDiscussionsError: null,
  stageDiscussionSubmitting: false,

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

  downloadCustomerDocument: async (documentId) => {
    try {
      const response = await AssessorEndpoints.downloadCustomerDocument(documentId);
      if (!(response instanceof Blob)) {
        throw new Error('The customer document download returned an invalid file.');
      }
      return response;
    } catch (err: unknown) {
      const error = getErrorMessage(err, 'Failed to download customer document');
      set({ error });
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

  escalateService: async (payload) => {
    if (!Number.isSafeInteger(payload.serviceId) || payload.serviceId <= 0) {
      throw new Error('A valid service ID is required to escalate a service.');
    }
    if (!payload.reason.trim()) {
      throw new Error('An escalation reason is required.');
    }

    set({ escalatingServiceId: payload.serviceId });
    try {
      await AssessorEndpoints.escalateService({
        ...payload,
        reason: payload.reason.trim(),
        notes: payload.notes?.trim() || null,
      });
      set({ escalatingServiceId: null });
    } catch (err: unknown) {
      set({ escalatingServiceId: null });
      throw err;
    }
  },

  notifyImporter: async (payload) => {
    if (!Number.isSafeInteger(payload.serviceId) || payload.serviceId <= 0) {
      throw new Error('A valid service ID is required to notify the importer.');
    }
    if (!payload.subject.trim()) {
      throw new Error('A notification subject is required.');
    }
    if (!payload.message.trim()) {
      throw new Error('A notification message is required.');
    }

    set({ notifyingImporterServiceId: payload.serviceId });
    try {
      await AssessorEndpoints.notifyImporter({
        ...payload,
        subject: payload.subject.trim(),
        message: payload.message.trim(),
      });
      set({ notifyingImporterServiceId: null });
    } catch (err: unknown) {
      set({ notifyingImporterServiceId: null });
      throw err;
    }
  },

  recordAssessment: async (payload) => {
    if (!Number.isSafeInteger(payload.serviceId) || payload.serviceId <= 0) {
      throw new Error('A valid service ID is required to record an assessment.');
    }
    if (!payload.decision.trim()) {
      throw new Error('An assessment decision is required.');
    }
    if (!Number.isFinite(payload.taxAmount) || payload.taxAmount < 0) {
      throw new Error('Tax amount must be a non-negative number.');
    }
    if (!Number.isFinite(payload.dutyAmount) || payload.dutyAmount < 0) {
      throw new Error('Duty amount must be a non-negative number.');
    }

    set({ recordingAssessmentServiceId: payload.serviceId });
    try {
      await AssessorEndpoints.recordAssessment({
        ...payload,
        notes: payload.notes?.trim() || null,
      });
      set({ recordingAssessmentServiceId: null });
    } catch (err: unknown) {
      set({ recordingAssessmentServiceId: null });
      throw err;
    }
  },

  fetchServiceStages: async (serviceId) => {
    if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
      throw new Error('A valid service ID is required to load workflow stages.');
    }

    try {
      const response = await AssessorEndpoints.getServiceStages(serviceId);
      const stages = normalizeServiceStages(response);
      set((state) => ({
        serviceStagesByServiceId: {
          ...state.serviceStagesByServiceId,
          [String(serviceId)]: stages,
        },
      }));
      return stages;
    } catch (err: unknown) {
      throw new Error(getErrorMessage(err, 'Failed to load service stages.'));
    }
  },

  fetchStageDiscussions: async (serviceId, stageId) => {
    if (!Number.isSafeInteger(serviceId) || serviceId <= 0 || !Number.isSafeInteger(stageId) || stageId <= 0) {
      throw new Error('Valid service and stage IDs are required to load stage discussions.');
    }

    const key = `${serviceId}:${stageId}`;
    set({ stageDiscussionsLoading: true, stageDiscussionsError: null });
    try {
      const response = await AssessorEndpoints.getStageDiscussions(serviceId, stageId);
      const discussions = normalizeStageDiscussions(response);
      set((state) => ({
        stageDiscussionsByKey: {
          ...state.stageDiscussionsByKey,
          [key]: discussions,
        },
        stageDiscussionsLoading: false,
        stageDiscussionsError: null,
      }));
      return discussions;
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to load stage discussions.');
      set({ stageDiscussionsLoading: false, stageDiscussionsError: message });
      throw new Error(message);
    }
  },

  addStageDiscussion: async (payload) => {
    if (
      !Number.isSafeInteger(payload.serviceId) ||
      payload.serviceId <= 0 ||
      !Number.isSafeInteger(payload.stageId) ||
      payload.stageId <= 0
    ) {
      throw new Error('Valid service and stage IDs are required to add a stage discussion.');
    }
    if (!payload.comment.trim()) {
      throw new Error('A discussion comment is required.');
    }

    set({ stageDiscussionSubmitting: true, stageDiscussionsError: null });
    try {
      await AssessorEndpoints.addStageDiscussion({
        ...payload,
        comment: payload.comment.trim(),
      });
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Failed to add stage discussion.');
      set({ stageDiscussionSubmitting: false, stageDiscussionsError: message });
      throw new Error(message);
    }
    set({ stageDiscussionSubmitting: false });
    await get().fetchStageDiscussions(payload.serviceId, payload.stageId).catch(() => undefined);
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