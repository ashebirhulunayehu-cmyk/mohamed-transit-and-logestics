import { create } from "zustand";
import { ManagerEndpoints } from "./manager.endpoint";
import type { NotificationCategory, NotificationItem } from "@/features/notifications/notification.types";
import type {
  ManagerAssignedUserSummary,
  ManagerCustomer,
  ManagerCustomerDocumentSummary,
  ManagerCustomerPagination,
  ManagerCustomerQuery,
  ManagerDashboardSummary,
  ManagerExecutorAssignment,
  ManagerExecutorAssignmentRequest,
  ManagerReportsAnalytics,
  ManagerServiceDocument,
  ManagerServiceDetail,
  ManagerServiceMessage,
  ManagerServiceStage,
  ManagerServicePagination,
  ManagerServiceQuery,
  ManagerStaff,
} from "./manager.type";
import type { ShipmentServiceStageUpdatePayload } from "@/modules/shipment/shipment.types";

interface ManagerState {
  dashboardData: ManagerDashboardSummary | null;
  reportsAnalytics: ManagerReportsAnalytics | null;
  reportsLoading: boolean;
  reportsError: string | null;
  serviceDetailLoading: boolean;
  serviceDetailError: string | null;
  notifications: NotificationItem[];
  notificationsLoading: boolean;
  notificationsError: string | null;
  services: ManagerExecutorAssignment[];
  servicePagination: ManagerServicePagination;
  customers: ManagerCustomer[];
  customersLoading: boolean;
  customersError: string | null;
  staff: ManagerStaff[];
  staffLoading: boolean;
  staffError: string | null;
  customerPagination: ManagerCustomerPagination;
  selectedService: ManagerServiceDetail | null;
  lastExecutorAssignment: ManagerExecutorAssignment | null;
  loading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  fetchReportsAnalytics: () => Promise<void>;
  fetchNotifications: () => Promise<NotificationItem[]>;
  fetchServices: (params?: ManagerServiceQuery) => Promise<ManagerExecutorAssignment[]>;
  fetchStaff: () => Promise<ManagerStaff[]>;
  fetchCustomers: (params?: ManagerCustomerQuery) => Promise<ManagerCustomer[]>;
  fetchServiceById: (id: string | number) => Promise<ManagerServiceDetail | null>;
  updateServiceStage: (payload: ShipmentServiceStageUpdatePayload) => Promise<boolean>;
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
    businessName: typeof value.businessName === "string" ? value.businessName : null,
    profilePhoto: typeof value.profilePhoto === "string" ? value.profilePhoto : null,
    phone: typeof value.phone === "string" ? value.phone : null,
  };
};

const normalizeStaff = (value: unknown): ManagerStaff | null => {
  if (!isRecord(value)) return null;

  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : undefined;
  if (id === undefined) return null;
  const roleRecords = Array.isArray(value.roles)
    ? value.roles
    : Array.isArray(value.userRoles)
      ? value.userRoles
      : [];
  const roleIds = [
    ...(Array.isArray(value.roleIds)
      ? value.roleIds.filter((roleId): roleId is number => typeof roleId === "number" && Number.isInteger(roleId))
      : []),
    ...roleRecords.flatMap((role) => {
    if (!isRecord(role)) return [];
    const nestedRole = isRecord(role.role) ? role.role : null;
    const roleId = role.roleId ?? nestedRole?.id ?? (typeof role.roleName === "string" ? role.id : undefined);
    return typeof roleId === "number" ? [roleId] : [];
    }),
  ];
  const roleNames = [
    ...(typeof value.roleName === "string" && value.roleName.trim() ? [value.roleName.trim()] : []),
    ...roleRecords.flatMap((role) => {
    if (typeof role === "string") return [role];
    if (!isRecord(role)) return [];
    const nestedRole = isRecord(role.role) ? role.role : null;
    const roleName = role.roleName ?? nestedRole?.roleName ?? nestedRole?.name;
    return typeof roleName === "string" && roleName.trim() ? [roleName.trim()] : [];
    }),
  ];
  const branch = value.branchName ?? value.branch ?? value.branchOffice ?? value.assignedBranch;
  const branchName = typeof branch === "string"
    ? branch
    : isRecord(branch)
      ? (typeof branch.name === "string" ? branch.name : typeof branch.branchName === "string" ? branch.branchName : null)
      : null;
  const openCasesValue = value.openCases ?? value.openCaseCount ?? value.assignedOpenCases;
  const parsedOpenCases = Number(openCasesValue);
  const availabilityValue = value.availability ?? value.availabilityStatus;
  const availability = typeof availabilityValue === "string"
    ? availabilityValue
    : typeof value.isAvailable === "boolean"
      ? value.isAvailable ? "Available" : "Offline"
      : typeof value.isOnline === "boolean"
        ? value.isOnline ? "Online" : "Offline"
        : null;

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
    roleIds: [...new Set(roleIds)],
    roleNames: [...new Set(roleNames)],
    branchName,
    openCases: openCasesValue !== undefined && Number.isFinite(parsedOpenCases) ? parsedOpenCases : null,
    availability,
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

  const id = value.id ?? value.Id ?? value.notificationId ?? value.NotificationId;
  const category = value.category ?? value.Category ?? value.type ?? value.Type;
  const priorityValue = value.priority ?? value.Priority;
  const urgent = value.isUrgent === true || value.IsUrgent === true || value.isUrgent === 1 || value.IsUrgent === 1;
  const priority = priorityValue === "CRITICAL" || priorityValue === "HIGH"
    ? priorityValue
    : urgent
      ? "HIGH"
    : undefined;
  const categoryByType: Record<number, NotificationCategory> = {
    1: "Service Updates",
    2: "Documents",
    3: "Service Updates",
    4: "Payments",
    5: "System",
    6: "Messages",
  };
  const normalizedCategory = typeof category === "string" && notificationCategories.includes(category as NotificationCategory)
    ? category as NotificationCategory
    : typeof category === "number"
      ? categoryByType[category]
      : typeof category === "string" && /^\d+$/.test(category)
        ? categoryByType[Number(category)]
        : undefined;

  return {
    id: String(id ?? index),
    title: typeof (value.title ?? value.Title) === "string" ? String(value.title ?? value.Title) : "Notification",
    description: typeof (value.description ?? value.Description ?? value.message ?? value.Message) === "string"
      ? String(value.description ?? value.Description ?? value.message ?? value.Message)
      : "",
    category: normalizedCategory ?? "System",
    time: typeof (value.time ?? value.createdDate ?? value.CreatedDate ?? value.createAt) === "string"
      ? String(value.time ?? value.createdDate ?? value.CreatedDate ?? value.createAt)
      : "Just now",
    referenceId: String(value.referenceId ?? value.ReferenceId ?? value.serviceId ?? value.ServiceId ?? ""),
    isRead: value.isRead === true || value.IsRead === true || value.isRead === 1 || value.IsRead === 1
      || value.isRead === "true" || value.IsRead === "true" || value.isRead === "1" || value.IsRead === "1",
    isNew: value.isNew === true || value.IsNew === true || value.isNew === 1 || value.IsNew === 1
      || value.isNew === "true" || value.IsNew === "true" || value.isNew === "1" || value.IsNew === "1",
    priority,
  };
};

const normalizeAssignment = (value: unknown): ManagerExecutorAssignment | null => {
  if (!isRecord(value)) return null;

  const trackingNumber =
    typeof value.trackingNumber === "string"
      ? value.trackingNumber
      : typeof value.serviceNumber === "string"
        ? value.serviceNumber
        : "";
  const id = typeof value.id === "number" || typeof value.id === "string" ? value.id : undefined;
  const importerId = typeof value.importerId === "number" || typeof value.importerId === "string" ? value.importerId : undefined;

  if (!trackingNumber || id === undefined) return null;

  return {
    id,
    trackingNumber,
    importerId,
    importer: normalizeAssignedUser(value.importer),
    description: typeof value.description === "string"
      ? value.description
      : typeof value.itemDescription === "string"
        ? value.itemDescription
        : "",
    importerName: typeof value.importerName === "string" ? value.importerName : null,
    mode: typeof value.mode === "number" || typeof value.mode === "string" ? value.mode : null,
    status: typeof value.status === "number" || typeof value.status === "string" ? value.status : "",
    assignedHub: typeof value.assignedHub === "number" || typeof value.assignedHub === "string" ? value.assignedHub : null,
    assignedCaseExecutorId: typeof value.assignedCaseExecutorId === "number" || typeof value.assignedCaseExecutorId === "string" ? value.assignedCaseExecutorId : null,
    assignedCaseExecutor: normalizeAssignedUser(value.assignedCaseExecutor),
    assignedAssessorId: typeof value.assignedAssessorId === "number" || typeof value.assignedAssessorId === "string" ? value.assignedAssessorId : null,
    assignedAssessor: normalizeAssignedUser(value.assignedAssessor),
    createdByUser: normalizeAssignedUser(value.createdByUser),
    customerId: typeof value.customerId === "number" || typeof value.customerId === "string"
      ? value.customerId
      : null,
    assignmentNotes: typeof value.assignmentNotes === "string" ? value.assignmentNotes : null,
    origin: typeof value.origin === "string" ? value.origin : "",
    destination: typeof value.destination === "string" ? value.destination : "",
    routeCategory: typeof value.routeCategory === "string" ? value.routeCategory : null,
    eta: typeof value.eta === "string" ? value.eta : null,
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

const normalizeServiceStage = (value: unknown): ManagerServiceStage | null => {
  if (!isRecord(value)) return null;

  const nullableText = (key: string): string | null =>
    typeof value[key] === "string" ? value[key] : null;
  const nullableId = (key: string): number | string | undefined =>
    typeof value[key] === "number" || typeof value[key] === "string" ? value[key] : undefined;

  return {
    id: nullableId("id"),
    stageName: nullableText("stageName"),
    name: nullableText("name"),
    status: typeof value.status === "number" || typeof value.status === "string" ? value.status : null,
    stageStatus: typeof value.stageStatus === "number" || typeof value.stageStatus === "string" ? value.stageStatus : null,
    currentStatus: typeof value.currentStatus === "number" || typeof value.currentStatus === "string" ? value.currentStatus : null,
    createdAt: nullableText("createdAt"),
    updatedAt: nullableText("updatedAt"),
    completedAt: nullableText("completedAt"),
    notes: nullableText("notes"),
    comments: nullableText("comments"),
  };
};

const normalizeServiceDocument = (value: unknown): ManagerServiceDocument | null => {
  if (!isRecord(value)) return null;

  const nullableText = (key: string): string | null =>
    typeof value[key] === "string" ? value[key] : null;
  const nullableId = (key: string): number | string | undefined =>
    typeof value[key] === "number" || typeof value[key] === "string" ? value[key] : undefined;

  return {
    id: nullableId("id"),
    fileName: nullableText("fileName"),
    originalFileName: nullableText("originalFileName"),
    fileExtension: nullableText("fileExtension"),
    mimeType: nullableText("mimeType"),
    documentType: typeof value.documentType === "number" || typeof value.documentType === "string"
      ? value.documentType
      : null,
    description: nullableText("description"),
    isRequired: value.isRequired === true,
    isVerified: value.isVerified === true,
    verificationNotes: nullableText("verificationNotes"),
    fileSizeBytes: typeof value.fileSizeBytes === "number" ? value.fileSizeBytes : null,
    stageId: typeof value.stageId === "number" || typeof value.stageId === "string"
      ? value.stageId
      : typeof value.serviceStageId === "number" || typeof value.serviceStageId === "string"
        ? value.serviceStageId
        : typeof value.shipmentStageId === "number" || typeof value.shipmentStageId === "string"
          ? value.shipmentStageId
          : null,
    createAt: nullableText("createAt"),
  };
};

const normalizeServiceDetail = (value: unknown): ManagerServiceDetail | null => {
  if (!isRecord(value)) return null;

  const service = normalizeAssignment(value);
  if (!service) return null;

  return {
    ...service,
    stages: Array.isArray(value.stages)
      ? value.stages.map(normalizeServiceStage).filter((stage): stage is ManagerServiceStage => stage !== null)
      : [],
    documents: Array.isArray(value.documents)
      ? value.documents.map(normalizeServiceDocument).filter((document): document is ManagerServiceDocument => document !== null)
      : [],
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

const normalizeManagerReportsAnalytics = (value: unknown): ManagerReportsAnalytics => {
  if (!isRecord(value)) {
    throw new Error("The manager reports endpoint returned an invalid response.");
  }

  const readNumber = (input: unknown, field: string): number => {
    const numeric = typeof input === "number" ? input : Number(input);
    if (!Number.isFinite(numeric)) {
      throw new Error(`The manager reports endpoint returned an invalid ${field}.`);
    }
    return numeric;
  };
  const readRows = (key: string): Record<string, unknown>[] => {
    const rows = value[key];
    if (!Array.isArray(rows)) {
      throw new Error(`The manager reports endpoint did not include ${key}.`);
    }
    return rows.map((row) => {
      if (!isRecord(row)) {
        throw new Error(`The manager reports endpoint returned an invalid ${key} row.`);
      }
      return row;
    });
  };
  const readNullableNumber = (field: string): number | null =>
    value[field] === null || value[field] === undefined
      ? null
      : readNumber(value[field], field);

  return {
    openCases: readNumber(value.openCases, "open cases"),
    completedYearToDate: readNumber(value.completedYearToDate, "year-to-date completions"),
    onTimeClearanceRate: readNullableNumber("onTimeClearanceRate"),
    averageStageDurationHours: readNullableNumber("averageStageDurationHours"),
    monthlyThroughput: readRows("monthlyThroughput").map((row) => ({
      year: readNumber(row.year, "month year"),
      month: readNumber(row.month, "month"),
      multimodal: readNumber(row.multimodal, "multimodal throughput"),
      unimodal: readNumber(row.unimodal, "unimodal throughput"),
      completed: readNumber(row.completed, "completed throughput"),
    })),
    riskChannels: readRows("riskChannels").map((row) => {
      if (typeof row.channel !== "string") {
        throw new Error("The manager reports endpoint returned an invalid risk channel.");
      }
      return { channel: row.channel, count: readNumber(row.count, "risk channel count") };
    }),
    stageDurations: readRows("stageDurations").map((row) => {
      if (typeof row.stage !== "string") {
        throw new Error("The manager reports endpoint returned an invalid stage name.");
      }
      return { stage: row.stage, averageHours: readNumber(row.averageHours, "stage duration") };
    }),
    executorPerformance: readRows("executorPerformance").map((row) => {
      if (typeof row.executorName !== "string") {
        throw new Error("The manager reports endpoint returned an invalid executor name.");
      }
      return {
        executorId: readNumber(row.executorId, "executor id"),
        executorName: row.executorName,
        casesClosed: readNumber(row.casesClosed, "closed cases"),
        averageCycleDays: row.averageCycleDays === null || row.averageCycleDays === undefined
          ? null
          : readNumber(row.averageCycleDays, "average cycle duration"),
        openLoad: readNumber(row.openLoad, "open workload"),
      };
    }),
  };
};

export const useManagerStore = create<ManagerState>((set, get) => ({
  dashboardData: null,
  reportsAnalytics: null,
  reportsLoading: false,
  reportsError: null,
  serviceDetailLoading: false,
  serviceDetailError: null,
  notifications: [],
  notificationsLoading: false,
  notificationsError: null,
  services: [],
  servicePagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
  customers: [],
  customersLoading: false,
  customersError: null,
  staff: [],
  staffLoading: false,
  staffError: null,
  customerPagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
  selectedService: null,
  lastExecutorAssignment: null,
  loading: false,
  error: null,

  fetchNotifications: async () => {
    set({ notificationsLoading: true, notificationsError: null });

    try {
      const response = await ManagerEndpoints.getNotifications();
      const payload = unwrapApiData(response);
      const notifications = Array.isArray(payload)
        ? payload
            .map(normalizeManagerNotification)
            .filter((notification): notification is NotificationItem => notification !== null)
        : [];
      set({ notifications, notificationsLoading: false, notificationsError: null });
      return notifications;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load notifications.";
      set({ notifications: [], notificationsLoading: false, notificationsError: message });
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
    set({ staffLoading: true, staffError: null });

    try {
      const response = await ManagerEndpoints.getAllStaff();
      const payload = unwrapApiData(response);
      const staff = Array.isArray(payload)
        ? payload.map(normalizeStaff).filter((member): member is ManagerStaff => member !== null)
        : [];
      set({ staff, staffLoading: false, staffError: null });
      return staff;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load staff.";
      set({ staff: [], staffLoading: false, staffError: message });
      return [];
    }
  },

  fetchCustomers: async (params) => {
    set({ customersLoading: true, customersError: null });

    try {
      const response = await ManagerEndpoints.getAllCustomers(params);
      const result = normalizeCustomerPage(response);
      set({
        customers: result.customers,
        customerPagination: result.pagination,
        customersLoading: false,
        customersError: null,
      });
      return result.customers;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load customers.";
      set({
        customers: [],
        customerPagination: { totalCount: 0, page: 1, pageSize: 20, totalPages: 0 },
        customersLoading: false,
        customersError: message,
      });
      return [];
    }
  },

  fetchServiceById: async (id) => {
    set({ selectedService: null, serviceDetailLoading: true, serviceDetailError: null });

    try {
      const response = await ManagerEndpoints.getServiceById(id);
      const selectedService = normalizeServiceDetail(unwrapApiData(response));

      if (!selectedService) {
        throw new Error("No service details returned from the API.");
      }

      set({ selectedService, serviceDetailLoading: false, serviceDetailError: null });
      return selectedService;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load service details.";
      set({ selectedService: null, serviceDetailLoading: false, serviceDetailError: message });
      return null;
    }
  },

  updateServiceStage: async (payload) => {
    const shipmentId = payload.shipmentId;
    const shipmentStageId = payload.shipmentStageId;
    if (
      shipmentId === null ||
      shipmentId === undefined ||
      !String(shipmentId).trim() ||
      shipmentStageId === null ||
      shipmentStageId === undefined ||
      !String(shipmentStageId).trim()
    ) {
      set({ serviceDetailError: "A service and stage ID are required to update a stage." });
      return false;
    }

    set({ serviceDetailLoading: true, serviceDetailError: null });

    try {
      await ManagerEndpoints.updateServiceStage(payload);
      const refreshedService = await get().fetchServiceById(shipmentId);
      return refreshedService !== null;
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to update service stage.";
      set({ serviceDetailLoading: false, serviceDetailError: message });
      return false;
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
      const payload = unwrapApiData(await ManagerEndpoints.getDashboard());
      const nextDashboardData = normalizeManagerDashboardSummary(payload);

      set({
        dashboardData: nextDashboardData,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load manager dashboard.";
      set({
        error: message,
        dashboardData: null,
        loading: false,
      });
    }
  },

  fetchReportsAnalytics: async () => {
    set({ reportsLoading: true, reportsError: null });

    try {
      const payload = unwrapApiData(await ManagerEndpoints.getReportsAnalytics());
      const reportsAnalytics = normalizeManagerReportsAnalytics(payload);
      set({ reportsAnalytics, reportsLoading: false, reportsError: null });
    } catch (error: unknown) {
      const message = typeof error === "string"
        ? error
        : error instanceof Error
          ? error.message
          : "Failed to load manager reports.";
      set({ reportsAnalytics: null, reportsLoading: false, reportsError: message });
    }
  },
}));
