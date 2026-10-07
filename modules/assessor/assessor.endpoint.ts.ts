import { service } from "../utils/axios/service";
import { API_ROUTES } from "@/modules/api";
import type {
  AssessorComplianceFeedback,
  AssessorComplianceFeedbackRequest,
  AssessorReviewedService,
  AssessorServiceReviewRequest,
  CustomerApprovalResult,
} from "./assessor.type";

export const AssessorEndpoints = {
  // 1. Pending Customer Approvals
  getPendingCustomerApprovals: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getPendingCustomerApprovals, { params }),

  // 1B. Pending Services
  getPendingServices: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getPendingServices, { params }),

  // 2. Approve Customer
  approveCustomer: async (
    data: { customerId: number; isApproved: boolean; notes: string | null }
  ): Promise<CustomerApprovalResult> =>
    (await service.put(API_ROUTES.assessor.approveCustomer, data)) as unknown as CustomerApprovalResult,

  // 3. Pending Service Reviews
  getPendingServiceReviews: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getPendingServiceReviews, { params }),

  // 4. Review Service
  reviewService: async (data: AssessorServiceReviewRequest): Promise<AssessorReviewedService> =>
    (await service.put(API_ROUTES.assessor.reviewService, data)) as unknown as AssessorReviewedService,

  // 5. Services Under Oversight
  getServicesUnderOversight: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getServicesUnderOversight, { params }),

  // 6. Add Compliance Feedback
  addComplianceFeedback: async (data: AssessorComplianceFeedbackRequest): Promise<AssessorComplianceFeedback> =>
    (await service.post(API_ROUTES.assessor.addComplianceFeedback, data)) as unknown as AssessorComplianceFeedback,

  // 7. Dashboard Stats
  getDashboard: () =>
    service.get(API_ROUTES.assessor.getDashboard),

  // 8. Compliance Issues
  getComplianceIssues: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getComplianceIssues, { params }),

  getAssessmentLogs: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getAssessmentLogs, { params }),
};