export interface ManagerApiEnvelope<T = unknown> {
  statusCode: number;
  error: boolean;
  errors: string[];
  message: string;
  response?: {
    data?: T;
  } | T;
}

export interface ManagerRecentService {
  id?: number | string;
  serviceNumber?: string | null;
  itemDescription?: string | null;
  importerName?: string | null;
  routeCategory?: string | null;
  origin?: string | null;
  destination?: string | null;
  declaredValue?: number | string | null;
  taxCategory?: string | null;
  countryOfOrigin?: string | null;
  serviceType?: number | string | null;
  status?: number | string | null;
  riskLevel?: number | string | null;
  customerId?: number | string | null;
  assignedCaseExecutorId?: number | string | null;
  assignedAssessorId?: number | string | null;
  registeredDate?: string | null;
  lastUpdateDate?: string | null;
  eta?: string | null;
  dueAt?: string | null;
  requiresCustomerAction?: boolean;
  isBlocked?: boolean;
  [key: string]: unknown;
}

export interface ManagerAssignedUserSummary {
  id?: number | string;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  businessName?: string | null;
  profilePhoto?: string | null;
  phone?: string | null;
}

export interface ManagerStaff extends ManagerAssignedUserSummary {
  id: number | string;
  phone?: string | null;
  isAccountLocked?: boolean;
  accountStatus?: number | string | null;
  roleIds?: number[];
  roleNames?: string[];
  branchName?: string | null;
  openCases?: number | null;
  availability?: string | null;
}

export interface ManagerExecutorAssignmentRequest {
  [key: string]: unknown;
}

export interface ManagerExecutorAssignment extends ManagerRecentService {
  trackingNumber: string;
  importerId?: number | string;
  importer: ManagerAssignedUserSummary | null;
  description: string;
  mode?: number | string | null;
  status: number | string;
  createdByUser: ManagerAssignedUserSummary | null;
  assignedCaseExecutorId: number | string | null;
  assignedCaseExecutor: ManagerAssignedUserSummary | null;
  assignedAssessorId: number | string | null;
  assignedAssessor: ManagerAssignedUserSummary | null;
  assignmentNotes: string | null;
  origin: string;
  destination: string;
  createAt: string;
  updatedAt: string | null;
  recordStatus: number;
}

export interface ManagerServiceMessage {
  id: number | string;
  subject: string;
  content: string;
  messageType: number;
  isRead: boolean;
  readAt: string | null;
  isUrgent: boolean;
  priority: number | string | null;
  createdDate: string;
  serviceId: number | string;
  senderUserId: number | string;
  recipientUserId: number | string | null;
  serviceStageId: number | string | null;
  senderUser: ManagerAssignedUserSummary | null;
  recipientUser: ManagerAssignedUserSummary | null;
  createAt: string;
  updatedAt: string | null;
  recordStatus: number;
}

export interface ManagerServiceStage {
  id?: number | string;
  stageName?: string | null;
  name?: string | null;
  status?: number | string | null;
  stageStatus?: number | string | null;
  currentStatus?: number | string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  completedAt?: string | null;
  notes?: string | null;
  comments?: string | null;
}

export interface ManagerServiceDocument {
  id?: number | string;
  stageId?: number | string | null;
  fileName?: string | null;
  originalFileName?: string | null;
  fileExtension?: string | null;
  mimeType?: string | null;
  documentType?: number | string | null;
  description?: string | null;
  isRequired?: boolean;
  isVerified?: boolean;
  verificationNotes?: string | null;
  fileSizeBytes?: number | null;
  createAt?: string | null;
}

export interface ManagerServiceDetail extends ManagerExecutorAssignment {
  stages: ManagerServiceStage[];
  documents: ManagerServiceDocument[];
  messages: ManagerServiceMessage[];
}

export interface ManagerCustomerQuery {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface ManagerServiceQuery {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface ManagerCustomerDocumentSummary {
  id?: number | string;
  fileName?: string | null;
  documentName?: string | null;
  documentType?: string | null;
  status?: number | string | null;
  uploadedAt?: string | null;
}

export interface ManagerCustomer {
  id: number | string;
  businessName?: string | null;
  tinNumber?: string | null;
  businessLicense?: string | null;
  businessAddress?: string | null;
  startDate?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  contactPerson?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  businessType?: string | null;
  importLicense?: string | null;
  importLicenseExpiry?: string | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedByUserId?: number | string | null;
  verificationNotes?: string | null;
  userId?: number | string | null;
  createdByDataEncoderId?: number | string | null;
  user?: ManagerAssignedUserSummary | null;
  createdByDataEncoder?: ManagerAssignedUserSummary | null;
  verifiedByUser?: ManagerAssignedUserSummary | null;
  documents: ManagerCustomerDocumentSummary[];
  createAt?: string | null;
  updatedAt?: string | null;
  recordStatus?: number;
}

export interface ManagerCustomerPagination {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ManagerServicePagination {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ManagerMonthlyServiceStat {
  year?: number;
  month?: number;
  totalServices?: number;
  completedServices?: number;
  completionRate?: number;
  [key: string]: unknown;
}

export interface ManagerDashboardSummary {
  totalServices: number;
  pendingServices: number;
  inProgressServices: number;
  completedServices: number;
  openCases?: number;
  needsAttention?: number;
  dueWithin48Hours?: number | null;
  clearedThisMonth?: number;
  totalCustomers: number;
  verifiedCustomers: number;
  totalStaff: number;
  activeStaff: number;
  recentServices: ManagerRecentService[];
  monthlyServiceStats: ManagerMonthlyServiceStat[];
}

export interface ManagerReportsAnalytics {
  openCases: number;
  completedYearToDate: number;
  onTimeClearanceRate: number | null;
  averageStageDurationHours: number | null;
  monthlyThroughput: {
    year: number;
    month: number;
    multimodal: number;
    unimodal: number;
    completed: number;
  }[];
  riskChannels: {
    channel: string;
    count: number;
  }[];
  stageDurations: {
    stage: string;
    averageHours: number;
  }[];
  executorPerformance: {
    executorId: number;
    executorName: string;
    casesClosed: number;
    averageCycleDays: number | null;
    openLoad: number;
  }[];
}
