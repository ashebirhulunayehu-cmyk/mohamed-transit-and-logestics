import { create } from "zustand";
import { ManagerEndpoints } from "./manager.endpoint";
import type { NotificationCategory, NotificationItem } from "@/features/notifications/notification.types";
import type {
  ManagerApiEnvelope,
  ManagerAssignedUserSummary,
  ManagerCustomer,
  ManagerCustomerDocumentSummary,
  ManagerCustomerPagination,
  ManagerCustomerQuery,
  ManagerDashboardSummary,
  ManagerExecutorAssignment,
  ManagerExecutorAssignmentRequest,
  ManagerServiceDetail,
  ManagerServiceMessage,
  ManagerServicePagination,
  ManagerServiceQuery,
  ManagerStaff,
} from "./manager.type";

interface ManagerState {
  dashboardData: ManagerDashboardSummary | null;
  notifications: NotificationItem[];
  services: ManagerExecutorAssignment[];
  servicePagination: ManagerServicePagination;
  customers: ManagerCustomer[];
  staff: ManagerStaff[];
  customerPagination: ManagerCustomerPagination;
  selectedService: ManagerServiceDetail | null;
  lastExecutorAssignment: ManagerExecutorAssignment | null;
  loading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  fetchNotifications: () => Promise<NotificationItem[]>;
  fetchServices: (params?: ManagerServiceQuery) => Promise<ManagerExecutorAssignment[]>;
  fetchStaff: () => Promise<ManagerStaff[]>;
  fetchCustomers: (params?: ManagerCustomerQuery) => Promise<ManagerCustomer[]>;
  fetchServiceById: (id: string | number) => Promise<ManagerServiceDetail | null>;
  assignExecutor: (payload: ManagerExecutorAssignmentRequest) => Promise<ManagerExecutorAssignment | null>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const normalizeAssignedUser = (value: unknown): ManagerAssignedUserSummary | null => {
  if (!isRecord(value)) return null;

  return {
    id: typeof value.id === "number" || typeof value.id === "string" ? value.id : undefined,
    username: typeof value.username === "string" ? value.username : null,
    email: typeof value.email === "string" ? value.email : null,
    firstName: typeof value.firstName === "string" ? value.firstName : null,
    lastName: typeof value.lastName === "string" ? value.lastName : null,
    profilePhoto: typeof value.profilePhoto === "string" ? value.profilePhoto : null,
  };
};

const normalizeStaff = (value: unknown): ManagerStaff | null => {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : undefined;
  if (id === undefined) return null;

  return {
    id,
    username: typeof value.username === "string" ? value.username : null,
    email: typeof value.email === "string" ? value.email : null,
    firstName: typeof value.firstName === "string" ? value.firstName : null,
    lastName: typeof value.lastName === "string" ? value.lastName : null,
    profilePhoto: typeof value.profilePhoto === "string" ? value.profilePhoto : null,
    phone: typeof value.phone === "string" ? value.phone : null,
    isAccountLocked: value.isAccountLocked === true,
    accountStatus: typeof value.accountStatus === "number" || typeof value.accountStatus === "string"
      ? value.accountStatus
      : null,
  };
};

const notificationCategories: NotificationCategory[] = [
  "Service Updates",
  "Documents",
  "Approvals",
  "Payments",
  "Inspection",
  "Risk",
  "Messages",
  "System",
];

const normalizeManagerNotification = (value: unknown, index: number): NotificationItem | null => {
  if (!isRecord(value)) return null;

  const priority = value.priority === "CRITICAL" || value.priority === "HIGH"
    ? value.priority
    : undefined;

  return {
    id: String(value.id ?? index),
    title: typeof value.title === "string" ? value.title : "Notification",
    description: typeof value.description === "string" ? value.description : "",
    category: typeof value.category === "string" && notificationCategories.includes(value.category as NotificationCategory)
      ? value.category as NotificationCategory
      : "System",
    time: typeof value.time === "string" ? value.time : "Just now",
    referenceId: typeof value.referenceId === "string" ? value.referenceId : "",
    isRead: value.isRead === true,
    isNew: value.isNew === true,
    priority,
  };
};

const normalizeAssignment = (value: unknown): ManagerExecutorAssignment | null => {
  if (!isRecord(value)) return null;

  const trackingNumber = typeof value.trackingNumber === "string" ? value.trackingNumber : "";
  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : undefined;
  const importerId = typeof value.importerId === "number" || typeof value.importerId === "string" ? value.importerId : undefined;

  if (!trackingNumber || id === undefined || importerId === undefined) return null;

  return {
    id,
    trackingNumber,
    importerId,
    importer: normalizeAssignedUser(value.importer),
    description: typeof value.description === "string" ? value.description : "",
    mode: typeof value.mode === "number" || typeof value.mode === "string" ? value.mode : null,
    status: typeof value.status === "number" || typeof value.status === "string" ? value.status : "",
    assignedHub: typeof value.assignedHub === "number" || typeof value.assignedHub === "string" ? value.assignedHub : null,
    assignedCaseExecutorId: typeof value.assignedCaseExecutorId === "number" || typeof value.assignedCaseExecutorId === "string" ? value.assignedCaseExecutorId : null,
    assignedCaseExecutor: normalizeAssignedUser(value.assignedCaseExecutor),
    assignedAssessorId: typeof value.assignedAssessorId === "number" || typeof value.assignedAssessorId === "string" ? value.assignedAssessorId : null,
    assignedAssessor: normalizeAssignedUser(value.assignedAssessor),
    createdByUser: normalizeAssignedUser(value.createdByUser),
    assignmentNotes: typeof value.assignmentNotes === "string" ? value.assignmentNotes : null,
    origin: typeof value.origin === "string" ? value.origin : "",
    destination: typeof value.destination === "string" ? value.destination : "",
    routeCategory: typeof value.routeCategory === "string" ? value.routeCategory : null,
    declaredValue: typeof value.declaredValue === "number" || typeof value.declaredValue === "string" ? value.declaredValue : null,
    taxCategory: typeof value.taxCategory === "string" ? value.taxCategory : null,
    countryOfOrigin: typeof value.countryOfOrigin === "string" ? value.countryOfOrigin : null,
    serviceType: typeof value.serviceType === "number" || typeof value.serviceType === "string" ? value.serviceType : null,
    riskLevel: typeof value.riskLevel === "number" || typeof value.riskLevel === "string" ? value.riskLevel : null,
    createAt: typeof value.createAt === "string" ? value.createAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    recordStatus: typeof value.recordStatus === "number" ? value.recordStatus : 0,
  };
};

const normalizeServiceMessage = (value: unknown): ManagerServiceMessage | null => {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : undefined;
  const serviceId = typeof value.serviceId === "number" || typeof value.serviceId === "string" ? value.serviceId : undefined;
  const senderUserId = typeof value.senderUserId === "number" || typeof value.senderUserId === "string" ? value.senderUserId : undefined;

  if (id === undefined || serviceId === undefined || senderUserId === undefined) return null;

  return {
    id,
    subject: typeof value.subject === "string" ? value.subject : "",
    content: typeof value.content === "string" ? value.content : "",
    messageType: typeof value.messageType === "number" ? value.messageType : 0,
    isRead: value.isRead === true,
    readAt: typeof value.readAt === "string" ? value.readAt : null,
    isUrgent: value.isUrgent === true,
    priority: typeof value.priority === "number" || typeof value.priority === "string" ? value.priority : null,
    createdDate: typeof value.createdDate === "string" ? value.createdDate : "",
    serviceId,
    senderUserId,
    recipientUserId: typeof value.recipientUserId === "number" || typeof value.recipientUserId === "string" ? value.recipientUserId : null,
    serviceStageId: typeof value.serviceStageId === "number" || typeof value.serviceStageId === "string" ? value.serviceStageId : null,
    senderUser: normalizeAssignedUser(value.senderUser),
    recipientUser: normalizeAssignedUser(value.recipientUser),
    createAt: typeof value.createAt === "string" ? value.createAt : "",
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
    recordStatus: typeof value.recordStatus === "number" ? value.recordStatus : 0,
  };
};

const normalizeServiceDetail = (value: unknown): ManagerServiceDetail | null => {
  if (!isRecord(value)) return null;

  const service = normalizeAssignment(value);
  if (!service) return null;

  return {
    ...service,
    stages: Array.isArray(value.stages) ? value.stages : [],
    documents: Array.isArray(value.documents) ? value.documents : [],
    messages: Array.isArray(value.messages)
      ? value.messages.map(normalizeServiceMessage).filter((message): message is ManagerServiceMessage => message !== null)
      : [],
  };
};

const unwrapPagedData = (value: unknown): unknown => {
  if (!isRecord(value)) return value;

  if ("response" in value && value.response !== undefined) {
    return unwrapPagedData(value.response);
  }

  if ("payload" in value && value.payload !== undefined) {
    return unwrapPagedData(value.payload);
  }

  if ("data" in value && value.data !== undefined) {
    return Array.isArray(value.data) ? value : unwrapPagedData(value.data);
  }

  return value;
};

const normalizeCustomerDocument = (value: unknown): ManagerCustomerDocumentSummary | null => {
  if (!isRecord(value)) return null;

  return {
    id: typeof value.id === "number" || typeof value.id === "string" ? value.id : undefined,
    fileName: typeof value.fileName === "string" ? value.fileName : null,
    documentName: typeof value.documentName === "string" ? value.documentName : null,
    documentType: typeof value.documentType === "string" ? value.documentType : null,
    status: typeof value.status === "number" || typeof value.status === "string" ? value.status : null,
    uploadedAt: typeof value.uploadedAt === "string" ? value.uploadedAt : null,
  };
};

const normalizeCustomer = (value: unknown): ManagerCustomer | null => {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : undefined;
  if (id === undefined) return null;

  const nullableText = (key: string): string | null =>
    typeof value[key] === "string" ? value[key] as string : null;
  const nullableId = (key: string): number | string | null =>
    typeof value[key] === "number" || typeof value[key] === "string" ? value[key] as number | string : null;

  return {
    id,
    businessName: nullableText("businessName"),
    tinNumber: nullableText("tinNumber"),
    businessLicense: nullableText("businessLicense"),
    businessAddress: nullableText("businessAddress"),
    startDate: nullableText("startDate"),
    city: nullableText("city"),
    state: nullableText("state"),
    postalCode: nullableText("postalCode"),
    contactPerson: nullableText("contactPerson"),
    contactPhone: nullableText("contactPhone"),
    contactEmail: nullableText("contactEmail"),
    businessType: nullableText("businessType"),
    importLicense: nullableText("importLicense"),
    importLicenseExpiry: nullableText("importLicenseExpiry"),
    isVerified: value.isVerified === true,
    verifiedAt: nullableText("verifiedAt"),
    verifiedByUserId: nullableId("verifiedByUserId"),
    verificationNotes: nullableText("verificationNotes"),
    userId: nullableId("userId"),
    createdByDataEncoderId: nullableId("createdByDataEncoderId"),
    user: normalizeAssignedUser(value.user),
    createdByDataEncoder: normalizeAssignedUser(value.createdByDataEncoder),
    verifiedByUser: normalizeAssignedUser(value.verifiedByUser),
    documents: Array.isArray(value.documents)
      ? value.documents.map(normalizeCustomerDocument).filter((document): document is ManagerCustomerDocumentSummary => document !== null)
      : [],
    createAt: nullableText("createAt"),
    updatedAt: nullableText("updatedAt"),
    recordStatus: typeof value.recordStatus === "number" ? value.recordStatus : undefined,
  };
};

const normalizeCustomerPage = (value: unknown): {
  customers: ManagerCustomer[];
  pagination: ManagerCustomerPagination;
} => {
  const pageData = unwrapPagedData(value);
  const pageRecord = isRecord(pageData) ? pageData : {};
  const rows = Array.isArray(pageData)
    ? pageData
    : Array.isArray(pageRecord.data)
      ? pageRecord.data
      : [];
  const customers = rows
    .map(normalizeCustomer)
    .filter((customer): customer is ManagerCustomer => customer !== null);
  const totalCount = normalizeNumber(pageRecord.totalCount ?? customers.length);
  const page = Math.max(1, normalizeNumber(pageRecord.page ?? 1));
  const pageSize = Math.max(1, normalizeNumber(pageRecord.pageSize ?? (customers.length || 20)));

  return {
    customers,
    pagination: {
      totalCount,
      page,
      pageSize,
      totalPages: normalizeNumber(pageRecord.totalPages ?? Math.ceil(totalCount / pageSize)),
    },
  };
};

const normalizeServicePage = (value: unknown): {
  services: ManagerExecutorAssignment[];
  pagination: ManagerServicePagination;
} => {
  const pageData = unwrapPagedData(value);
  const pageRecord = isRecord(pageData) ? pageData : {};
  const rows = Array.isArray(pageData)
    ? pageData
    : Array.isArray(pageRecord.data)
      ? pageRecord.data
      : [];
  const services = rows
    .map(normalizeAssignment)
    .filter((service): service is ManagerExecutorAssignment => service !== null);
  const totalCount = normalizeNumber(pageRecord.totalCount ?? services.length);
  const page = Math.max(1, normalizeNumber(pageRecord.page ?? 1));
  const pageSize = Math.max(1, normalizeNumber(pageRecord.pageSize ?? (services.length || 20)));

  return {
    services,
    pagination: {
      totalCount,
      page,
      pageSize,
      totalPages: normalizeNumber(pageRecord.totalPages ?? Math.ceil(totalCount / pageSize)),
    },
  };
};

const unwrapApiData = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;

  if ("data" in record && record.data !== undefined) {
    return unwrapApiData(record.data);
  }

  if ("payload" in record && record.payload !== undefined) {
    return unwrapApiData(record.payload);
  }

  if ("response" in record && record.response !== undefined) {
    return unwrapApiData(record.response);
  }

  return record;
};

const EMPTY_MANAGER_SUMMARY: ManagerDashboardSummary = {
  totalServices: 0,
  pendingServices: 0,
  inProgressServices: 0,
  completedServices: 0,
  openCases: 0,
  needsAttention: 0,
  dueWithin48Hours: null,
  clearedThisMonth: 0,
  totalCustomers: 0,
  verifiedCustomers: 0,
  totalStaff: 0,
  activeStaff: 0,
  recentServices: [],
  monthlyServiceStats: [],
};

const normalizeNumber = (value: unknown): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeManagerDashboardSummary = (value: unknown): ManagerDashboardSummary => {
  if (!isRecord(value)) {
    return EMPTY_MANAGER_SUMMARY;
  }

  const normalized: ManagerDashboardSummary = {
    totalServices: normalizeNumber(value.totalServices),
    pendingServices: normalizeNumber(value.pendingServices),
    inProgressServices: normalizeNumber(value.inProgressServices),
    completedServices: normalizeNumber(value.completedServices),
    openCases: value.openCases === undefined ? undefined : normalizeNumber(value.openCases),
    needsAttention: value.needsAttention === undefined ? undefined : normalizeNumber(value.needsAttention),
    dueWithin48Hours: value.dueWithin48Hours === null || value.dueWithin48Hours === undefined
      ? null
      : normalizeNumber(value.dueWithin48Hours),
    clearedThisMonth: value.clearedThisMonth === undefined ? undefined : normalizeNumber(value.clearedThisMonth),
    totalCustomers: normalizeNumber(value.totalCustomers),
    verifiedCustomers: normalizeNumber(value.verifiedCustomers),
    totalStaff: normalizeNumber(value.totalStaff),
    activeStaff: normalizeNumber(value.activeStaff),
    recentServices: Array.isArray(value.recentServices) ? (value.recentServices as ManagerDashboardSummary["recentServices"]) : [],
    monthlyServiceStats: Array.isArray(value.monthlyServiceStats)
      ? (value.monthlyServiceStats as ManagerDashboardSummary["monthlyServiceStats"])
      : [],
  };

  return normalized;
};

const isManagerDashboardSummary = (value: unknown): value is ManagerDashboardSummary => {
  if (!isRecord(value)) {
    return false;
  }

  const hasNumericValue = (key: string) =>
    typeof value[key] === "number" || typeof value[key] === "string" || value[key] === undefined;

  return (
    hasNumericValue("totalServices") &&
    hasNumericValue("pendingServices") &&
    hasNumericValue("inProgressServices") &&
    hasNumericValue("completedServices") &&
    hasNumericValue("totalCustomers") &&
    hasNumericValue("verifiedCustomers") &&
    hasNumericValue("totalStaff") &&
    hasNumericValue("activeStaff") &&
    (value.recentServices === undefined || Array.isArray(value.recentServices)) &&
    (value.monthlyServiceStats === undefined || Array.isArray(value.monthlyServiceStats))
  );
};

export const useManagerStore = create<ManagerState>((set) => ({
  dashboardData: null,
  notifications: [],
  services: [],
  servicePagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
  customers: [],
  staff: [],
  customerPagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
  selectedService: null,
  lastExecutorAssignment: null,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ loading: true, error: null });

    try {
      const response = await ManagerEndpoints.getNotifications();
      const payload = unwrapApiData(response);
      const notifications = Array.isArray(payload)
        ? payload
            .map(normalizeManagerNotification)
            .filter((notification): notification is NotificationItem => notification !== null)
        : [];
      set({ notifications, loading: false, error: null });
      return notifications;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load notifications.";
      set({ notifications: [], loading: false, error: message });
      return [];
    }
  },

  fetchServices: async (params) => {
    set({ loading: true, error: null });

    try {
      const response = await ManagerEndpoints.getAllServices(params);
      const result = normalizeServicePage(response);
      set({ services: result.services, servicePagination: result.pagination, loading: false, error: null });
      return result.services;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load services.";
      set({
        services: [],
        servicePagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
        loading: false,
        error: message,
      });
      return [];
    }
  },

  fetchStaff: async () => {
    set({ loading: true, error: null });

    try {
      const response = await ManagerEndpoints.getAllStaff();
      const payload = unwrapApiData(response);
      const staff = Array.isArray(payload)
        ? payload.map(normalizeStaff).filter((member): member is ManagerStaff => member !== null)
        : [];
      set({ staff, loading: false, error: null });
      return staff;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load staff.";
      set({ staff: [], loading: false, error: message });
      return [];
    }
  },

  fetchCustomers: async (params) => {
    set({ loading: true, error: null });

    try {
      const response = await ManagerEndpoints.getAllCustomers(params);
      const result = normalizeCustomerPage(response);
      set({ customers: result.customers, customerPagination: result.pagination, loading: false, error: null });
      return result.customers;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load customers.";
      set({ customers: [], customerPagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 }, loading: false, error: message });
      return [];
    }
  },

  fetchServiceById: async (id) => {
    set({ loading: true, error: null });

    try {
      const response = await ManagerEndpoints.getServiceById(id);
      const selectedService = normalizeServiceDetail(unwrapApiData(response));

      if (!selectedService) {
        throw new Error("No service details returned from the API.");
      }

      set({ selectedService, loading: false, error: null });
      return selectedService;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load service details.";
      set({ selectedService: null, loading: false, error: message });
      return null;
    }
  },

  assignExecutor: async (payload) => {
    set({ loading: true, error: null });

    try {
      const response = await ManagerEndpoints.assignExecutor(payload);
      const assignment = normalizeAssignment(unwrapApiData(response));

      if (!assignment) {
        throw new Error("No assignment record returned from the API.");
      }

      set((state) => ({
        lastExecutorAssignment: assignment,
        dashboardData: state.dashboardData
          ? {
              ...state.dashboardData,
              recentServices: state.dashboardData.recentServices.map((item) =>
                String(item.id ?? item.serviceNumber) === String(assignment.id)
                  ? {
                      ...item,
                      assignedCaseExecutorId: assignment.assignedCaseExecutorId,
                      lastUpdateDate: assignment.updatedAt,
                    }
                  : item,
              ),
            }
          : null,
        loading: false,
        error: null,
      }));

      return assignment;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to assign executor.";
      set({ loading: false, error: message });
      return null;
    }
  },

  fetchDashboard: async () => {
    set({ loading: true, error: null });

    try {
      const response = (await ManagerEndpoints.getDashboard()) as ManagerApiEnvelope<ManagerDashboardSummary> | unknown;
      const payload = unwrapApiData(response);
      const nextDashboardData = isManagerDashboardSummary(payload)
        ? normalizeManagerDashboardSummary(payload)
        : normalizeManagerDashboardSummary(payload);

      set({
        dashboardData: nextDashboardData,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load manager dashboard";
      set({
        error: message,
        dashboardData: null,
        loading: false,
      });
    }
  },
}));
