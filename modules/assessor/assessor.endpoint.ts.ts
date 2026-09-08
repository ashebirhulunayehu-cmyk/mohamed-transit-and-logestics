import { service } from "../utils/axios/service";
import { API_ROUTES } from "@/modules/api";

export const AssessorEndpoints = {
  // 1. Pending Customer Approvals
  getPendingCustomerApprovals: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getPendingCustomerApprovals, { params }),

  // 2. Approve Customer
  approveCustomer: (data: { customerId: number; isApproved: boolean; notes: string | null }) =>
    service.put(API_ROUTES.assessor.approveCustomer, data),

  // 3. Pending Service Reviews
  getPendingServiceReviews: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getPendingServiceReviews, { params }),

  // 4. Review Service
  reviewService: (data: { serviceId: string; status: number; feedback?: string }) =>
    service.put(API_ROUTES.assessor.reviewService, data),

  // 5. Services Under Oversight
  getServicesUnderOversight: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getServicesUnderOversight, { params }),

  // 6. Add Compliance Feedback
  addComplianceFeedback: (data: { serviceId: string; comment: string; issueType?: string }) =>
    service.post(API_ROUTES.assessor.addComplianceFeedback, data),

  // 7. Dashboard Stats
  getDashboard: () =>
    service.get(API_ROUTES.assessor.getDashboard),

  // 8. Compliance Issues
  getComplianceIssues: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getComplianceIssues, { params }),
};