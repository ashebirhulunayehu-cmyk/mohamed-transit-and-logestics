import { service } from "../utils/axios/service";

export const AssessorEndpoints = {
  // 1. Pending Customer Approvals
  getPendingCustomerApprovals: (params?: Record<string, any>) =>
    service.get('/v1/Assessor/GetPendingCustomerApprovals', { params }),

  // 2. Approve Customer
  approveCustomer: (data: { customerId: string; isApproved: boolean; remark?: string }) =>
    service.put('/v1/Assessor/ApproveCustomer', data),

  // 3. Pending Service Reviews
  getPendingServiceReviews: (params?: Record<string, any>) =>
    service.get('/v1/Assessor/GetPendingServiceReviews', { params }),

  // 4. Review Service
  reviewService: (data: { serviceId: string; status: number; feedback?: string }) =>
    service.put('/v1/Assessor/ReviewService', data),

  // 5. Services Under Oversight
  getServicesUnderOversight: (params?: Record<string, any>) =>
    service.get('/v1/Assessor/GetServicesUnderOversight', { params }),

  // 6. Add Compliance Feedback
  addComplianceFeedback: (data: { serviceId: string; comment: string; issueType?: string }) =>
    service.post('/v1/Assessor/AddComplianceFeedback', data),

  // 7. Dashboard Stats
  getDashboard: () =>
    service.get('/v1/Assessor/GetDashboard'),

  // 8. Compliance Issues
  getComplianceIssues: (params?: Record<string, any>) =>
    service.get('/v1/Assessor/GetComplianceIssues', { params }),
};