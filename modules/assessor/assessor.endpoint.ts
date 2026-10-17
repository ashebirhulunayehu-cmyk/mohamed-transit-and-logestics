import { service } from "../utils/axios/service";
import { API_ROUTES } from "@/modules/api";
import type {
  AssessorComplianceFeedback,
  AssessorComplianceFeedbackRequest,
  AssessorReviewedService,
  AssessorServiceReviewRequest,
  AddStageDiscussionRequest,
  CustomerApprovalResult,
  EscalateServiceRequest,
  NotifyImporterRequest,
  RecordAssessmentRequest,
  ServiceStageDecisionRequest,
  VerifyCustomerDocumentRequest,
} from "./assessor.type";

export const AssessorEndpoints = {
  // 1. Pending Customer Approvals
  getPendingCustomerApprovals: (params?: Record<string, unknown>) =>
    service.get(API_ROUTES.assessor.getPendingCustomerApprovals, { params }),

  // 1B. Pending Services
  getPendingServices: () =>
    service.get(API_ROUTES.assessor.getPendingServiceReviews),
  getServiceDetails: (serviceId: number | string) =>
    service.get(API_ROUTES.assessor.getServiceDetails(serviceId)),
  getConsignmentDetails: (serviceId: number | string) => {
    const id = String(serviceId).trim();
    if (!/^[1-9]\d*$/.test(id)) {
      throw new Error("A valid service ID is required to load Assessor consignment details.");
    }
    return service.get(API_ROUTES.assessor.getConsignmentDetails(id));
  },
  getServiceStages: (serviceId: number | string) => {
    const id = String(serviceId).trim();
    if (!/^[1-9]\d*$/.test(id)) {
      throw new Error("A valid service ID is required to load Assessor workflow stages.");
    }
    return service.get(API_ROUTES.assessor.getServiceStages(id));
  },
  downloadStageDocument: (
    serviceId: number | string,
    stageId: number | string,
    documentId: number | string,
  ) => {
    const ids = [serviceId, stageId, documentId].map((value) => String(value).trim());
    if (ids.some((id) => !/^[1-9]\d*$/.test(id))) {
      throw new Error("Valid service, stage, and document IDs are required.");
    }
    return service.get(API_ROUTES.assessor.downloadStageDocument, {
      params: { serviceId: ids[0], stageId: ids[1], documentId: ids[2] },
      responseType: "blob",
    });
  },
  downloadStageDocuments: (
    serviceId: number | string,
    stageId: number | string,
    documentIds: Array<number | string>,
  ) => {
    const ids = [serviceId, stageId, ...documentIds].map((value) => String(value).trim());
    if (ids.some((id) => !/^[1-9]\d*$/.test(id))) {
      throw new Error("Valid service, stage, and document IDs are required.");
    }
    return service.post(
      API_ROUTES.assessor.downloadStageDocuments,
      { serviceId: ids[0], stageId: ids[1], documentIds: ids.slice(2) },
      { responseType: "blob" },
    );
  },
  getStageDiscussions: (serviceId: number | string, stageId: number | string) =>
    service.get(API_ROUTES.assessor.getStageDiscussions(serviceId, stageId)),
  addStageDiscussion: (payload: AddStageDiscussionRequest) =>
    service.post(API_ROUTES.assessor.addStageDiscussion, payload),
  decideServiceStage: (payload: ServiceStageDecisionRequest) =>
    service.post(API_ROUTES.assessor.decideServiceStage, payload),

  // 2. Approve Customer
  approveCustomer: async (
    data: { customerId: number; isApproved: boolean; notes: string | null; returnForRevision?: boolean }
  ): Promise<CustomerApprovalResult> =>
    (await service.put(API_ROUTES.assessor.approveCustomer, data)) as unknown as CustomerApprovalResult,
  verifyCustomerDocument: (data: VerifyCustomerDocumentRequest) =>
    service.put(API_ROUTES.assessor.verifyCustomerDocument, data),
  downloadCustomerDocument: (documentId: number) =>
    service.get(API_ROUTES.assessor.downloadCustomerDocument, {
      params: { documentId },
      responseType: "blob",
    }),

  // 3. Pending Service Reviews
  getPendingServiceReviews: () =>
    service.get(API_ROUTES.assessor.getPendingServiceReviews),
  getAssessmentDocuments: () =>
    service.get(API_ROUTES.assessor.getAssessmentDocuments),
  recordAssessment: (payload: RecordAssessmentRequest) =>
    service.post(API_ROUTES.assessor.recordAssessment, payload),

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
  escalateService: (data: EscalateServiceRequest) =>
    service.post(API_ROUTES.assessor.escalateService, data),
  notifyImporter: (data: NotifyImporterRequest) =>
    service.post(API_ROUTES.assessor.notifyImporter, data),

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