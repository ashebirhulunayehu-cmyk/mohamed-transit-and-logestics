export type AssessorRole =
  | "assessor"
  | "senior-assessor"
  | "supervisor";

export type ReviewStatus =
  | "pending"
  | "in-review"
  | "approved"
  | "rejected"
  | "correction-required";

export type Priority = "low" | "medium" | "high" | "urgent";

export type VerificationStatus =
  | "verified"
  | "pending"
  | "invalid"
  | "missing";

export interface AssessorUser {
  id: string;
  name: string;
  email: string;
  role: AssessorRole;
  avatar?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  caseId: string;
  uploadedDate: string;
  verificationStatus: VerificationStatus;
  fileUrl?: string;
}

export interface AssessmentChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  required: boolean;
}

export interface AssessorNote {
  id: string;
  assessorId: string;
  assessorName: string;
  note: string;
  createdAt: string;
}

export interface Case {
  id: string;
  applicationNumber: string;

  customer: Customer;

  service: Service;

  submittedDate: string;

  status: ReviewStatus;

  priority: Priority;

  assessmentScore?: number;

  documents: Document[];

  checklist: AssessmentChecklistItem[];

  notes: AssessorNote[];

  assignedAssessor?: AssessorUser;
}

export interface AssessmentLog {
  id: string;
  caseId: string;
  applicationNumber: string;
  assessorId: string;
  assessorName: string;
  action: string;
  previousStatus: ReviewStatus;
  newStatus: ReviewStatus;
  notes?: string;
  createdAt: string;
}

export interface AssessorFilters {
  search: string;
  status?: ReviewStatus;
  priority?: Priority;
  dateFrom?: string;
  dateTo?: string;
}

export interface AssessorState {
  sidebarCollapsed: boolean;

  selectedRole: AssessorRole;

  selectedCase: Case | null;

  filters: AssessorFilters;

  isLoading: boolean;

  isConfirmationOpen: boolean;

  confirmationAction:
    | "approve"
    | "reject"
    | "correction"
    | null;

  toggleSidebar: () => void;

  setSelectedRole: (role: AssessorRole) => void;

  setSelectedCase: (caseData: Case | null) => void;

  setFilters: (filters: Partial<AssessorFilters>) => void;

  setLoading: (loading: boolean) => void;

  openConfirmation: (
    action: "approve" | "reject" | "correction"
  ) => void;

  closeConfirmation: () => void;

  resetFilters: () => void;
}