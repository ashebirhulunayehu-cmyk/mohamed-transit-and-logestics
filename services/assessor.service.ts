// services/assessor.service.ts
import { APIClient } from './api';
import { Case, AssessmentLog } from '@/app/types/assessor';

export class AssessorService {
  static async getPendingCases(): Promise<Case[]> {
    return APIClient.get<Case[]>('/api/assessor/cases/pending');
  }

  static async getAllCases(): Promise<Case[]> {
    return APIClient.get<Case[]>('/api/assessor/cases');
  }

  static async getCaseById(caseId: string): Promise<Case> {
    return APIClient.get<Case>(`/api/assessor/cases/${caseId}`);
  }

  static async approveCase(caseId: string, notes?: string): Promise<Case> {
    return APIClient.put<Case>(`/api/assessor/cases/${caseId}/approve`, {
      notes,
    });
  }

  static async rejectCase(caseId: string, notes?: string): Promise<Case> {
    return APIClient.put<Case>(`/api/assessor/cases/${caseId}/reject`, {
      notes,
    });
  }

  static async requestCorrection(caseId: string, notes: string): Promise<Case> {
    return APIClient.put<Case>(
      `/api/assessor/cases/${caseId}/request-correction`,
      { notes }
    );
  }

  static async getAssessmentLogs(): Promise<AssessmentLog[]> {
    return APIClient.get<AssessmentLog[]>('/api/assessor/logs');
  }

  static async getCustomerApprovals(): Promise<any[]> {
    return APIClient.get<any[]>('/api/assessor/customer-approvals');
  }

  static async getServiceReviews(): Promise<any[]> {
    return APIClient.get<any[]>('/api/assessor/service-reviews');
  }

  static async getDocuments(): Promise<any[]> {
    return APIClient.get<any[]>('/api/assessor/documents');
  }

  static async getDashboardStats(): Promise<{
    pendingCount: number;
    approvedCount: number;
    rejectedCount: number;
    totalReviewedToday: number;
  }> {
    return APIClient.get('/api/assessor/dashboard/stats');
  }
}
