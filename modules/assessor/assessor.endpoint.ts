import { service } from "../utils/axios/service";
import { API_ROUTES } from "@/modules/api";
import type {
  AssessorComplianceFeedback,
  AssessorComplianceFeedbackRequest,
  AssessorReviewedService,
  AssessorServiceReviewRequest,
  CustomerApprovalResult,
  VerifyCustomerDocumentRequest,
} from "./assessor.type";

export const AssessorEndpoints = {
  // 1. Pending Customer Approvals
  getPendingCustomerApprovals: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getPendingCustomerApprovals, { params }),

  // 1B. Pending Services
  getPendingServices: () =>
    service.get(API_ROUTES.assessor.getPendingServiceReviews),

  // 2. Approve Customer
  approveCustomer: async (
    data: { customerId: number; isApproved: boolean; notes: string | null; returnForRevision?: boolean }
  ): Promise<CustomerApprovalResult> =>
    (await service.put(API_ROUTES.assessor.approveCustomer, data)) as unknown as CustomerApprovalResult,
  verifyCustomerDocument: (data: VerifyCustomerDocumentRequest) =>
    service.put(API_ROUTES.assessor.verifyCustomerDocument, data),

  // 3. Pending Service Reviews
  getPendingServiceReviews: () =>
    service.get(API_ROUTES.assessor.getPendingServiceReviews),

  // GET /api/v1/Document/GetServiceDocuments?serviceId={id}
  getServiceDocuments: (serviceId: number | string) =>
    service.get(API_ROUTES.document.getServiceDocuments, {
      params: { serviceId },
    }),

  // GET /api/v1/Document/DownloadDocument?documentId={id}
  downloadDocument: (documentId: number | string) =>
    service.get(API_ROUTES.document.downloadDocument, {
      params: { documentId },
      responseType: "blob",
    }),

  // POST /api/v1/Document/DownloadDocuments
  downloadDocuments: (documentIds: Array<number | string>) =>
    service.post(API_ROUTES.document.downloadDocuments, documentIds, {
      responseType: "blob",
    }),

  // POST /api/v1/Document/VerifyDocument
  verifyDocument: (payload: {
    documentId: number | string;
    isVerified: boolean;
    notes?: string;
    verificationNotes?: string;
    verifiedByUserId?: number | string;
  }) => service.post(API_ROUTES.document.verifyDocument, payload),

  // 4. Review Service
  reviewService: async (data: AssessorServiceReviewRequest): Promise<AssessorReviewedService> =>
    (await service.put(API_ROUTES.assessor.reviewService, data)) as unknown as AssessorReviewedService,

  // 5. Services Under Oversight
  getServicesUnderOversight: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getServicesUnderOversight, { params }),
  getActiveServicesForRegister: () =>
    service.get(API_ROUTES.assessor.getActiveServicesForRegister),

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