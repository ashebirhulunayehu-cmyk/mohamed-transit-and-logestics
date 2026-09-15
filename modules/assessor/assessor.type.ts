export type AssessorItem = Record<string, unknown>;

export interface AssessorApiEnvelope<T = unknown> {
  statusCode: number;
  error: boolean;
  errors: string[];
  message: string;
  response?: {
    data?: T;
  } | T;
}

export interface AssessorDashboardSummary {
  pendingCustomerApprovals: number;
  pendingServiceReviews: number;
  servicesUnderOversight: number;
  completedReviewsToday: number;
  recentCustomerApprovals: RecentCustomerApproval[];
  recentServiceReviews: unknown[];
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
  name?: string;
  importerType?: string;
  licence?: string;
  tin?: string;
  status?: string;
  primaryContact?: string;
  email?: string;
  phone?: string;
  address?: string;
  registeredDate?: string;
  activeServices?: number;
  checklist?: Array<{
    id?: string | number;
    name?: string;
    status?: string;
  }>;
  [key: string]: unknown;
}

export type AssessorListResponse<T> = AssessorApiEnvelope<T[]>;
export type AssessorDashboardResponse = AssessorApiEnvelope<AssessorDashboardSummary>;
export type AssessorComplianceResponse = AssessorApiEnvelope<AssessorComplianceIssue[]>;
export type AssessorPendingApprovalsResponse = AssessorApiEnvelope<PendingCustomerApproval[]>;
