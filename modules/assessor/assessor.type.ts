import type { CustomerProfileRecord } from "@/modules/customer/customer.type";

export type AssessorItem = Record<string, unknown>;

export type CustomerApprovalResult = CustomerProfileRecord;

export interface AssessorServiceReviewRequest {
  shipmentId: number;
  isApproved: boolean;
  reviewNotes: string | null;
}

export interface AssessorComplianceFeedbackRequest {
  serviceId: string;
  comment: string;
  issueType?: string;
}

export interface AssessorReviewedService {
  trackingNumber: string;
  importerId: number;
  importer: unknown | null;
  description: string;
  mode: number;
  createdByDataEncoderId: number | null;
  createdByDataEncoder: unknown | null;
  assignedHub: number | null;
  status: number;
  createdByUserId: number | null;
  createdByUser: unknown | null;
  routeCategory: string;
  declaredValue: number;
  taxCategory: string;
  countryOfOrigin: string;
  riskLevel: number | null;
  assignedCaseExecutorId: number | null;
  assignedCaseExecutor: unknown | null;
  serviceType: number | null;
  assignedAssessorId: number | null;
  assignedAssessor: unknown | null;
  assignmentNotes: string | null;
  stages: unknown[];
  documents: unknown[];
  messages: unknown[];
  origin: string;
  destination: string;
  id: number;
  createAt: string;
  updatedAt: string | null;
  recordStatus: number;
}

export interface AssessorComplianceFeedback {
  subject: string;
  content: string;
  messageType: number;
  isRead: boolean;
  readAt: string | null;
  isUrgent: boolean;
  priority: string | number | null;
  createdDate: string;
  serviceId: number;
  senderUserId: number;
  recipientUserId: number | null;
  serviceStageId: number | null;
  service: AssessorReviewedService | null;
  senderUser: unknown | null;
  recipientUser: unknown | null;
  serviceStage: unknown | null;
  id: number;
  createAt: string;
  updatedAt: string | null;
  recordStatus: number;
}

export interface AssessorApiEnvelope<T = unknown> {
  statusCode: number;
  error: boolean;
  errors: string[];
  message: string;
  response?: {
    data?: T;
  } | T;
}

export interface AssessorDashboardMetrics {
  pendingCustomerApprovals: number;
  pendingServiceReviews: number;
  totalComplianceIssues: number;
}

export interface AssessorDashboardSummary
  extends Pick<AssessorDashboardMetrics, "pendingCustomerApprovals" | "pendingServiceReviews"> {
  totalComplianceIssues?: number;
  complianceIssues?: number;
  servicesUnderOversight: number;
  completedReviewsToday: number;
  recentCustomerApprovals: RecentCustomerApproval[];
  recentServiceReviews: PendingServiceReview[];
}

export interface RecentCustomerApproval {
  id?: string | number;
  businessName?: string;
  tinNumber?: string;
  businessLicense?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessType?: string;
  isVerified?: boolean;
  verifiedAt?: string | null;
  recordStatus?: number;
}

export interface AssessorComplianceIssue {
  id?: string | number;
  title?: string;
  name?: string;
  count?: number | string;
  severity?: string;
  status?: string;
  [key: string]: unknown;
}

export interface PendingCustomerApproval {
  id?: string | number;
  customerId?: string | number;
  name?: string;
  businessName?: string;
  importerType?: string;
  businessType?: string;
  licence?: string;
  businessLicense?: string;
  tin?: string;
  tinNumber?: string;
  status?: string;
  isVerified?: boolean | number | string;
  primaryContact?: string;
  contactPerson?: string;
  email?: string;
  contactEmail?: string;
  phone?: string;
  contactPhone?: string;
  address?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  registeredDate?: string;
  activeServices?: number;
  checklist?: Array<{
    id?: string | number;
    name?: string;
    status?: string;
  }>;
  [key: string]: unknown;
}

export interface PendingServiceReview {
  id?: string | number;
  serviceId?: string | number;
  shipmentId?: number;
  trackingNumber?: string;
  referenceNumber?: string;
  description?: string;
  serviceTypeName?: string;
  businessName?: string;
  importerName?: string;
  city?: string;
  origin?: string;
  destination?: string;
  status?: string;
  [key: string]: unknown;
}

export type AssessorListResponse<T> = AssessorApiEnvelope<T[]>;
export type AssessorDashboardResponse = AssessorApiEnvelope<AssessorDashboardSummary>;
export type AssessorComplianceResponse = AssessorApiEnvelope<AssessorComplianceIssue[]>;
export type AssessorPendingApprovalsResponse = AssessorApiEnvelope<PendingCustomerApproval[]>;
