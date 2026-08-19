// ============================================================
// 1. ASSESSOR DASHBOARD TYPES & DATA
// ============================================================

export type CaseStatus = "pending" | "in-review" | "approved" | "rejected" | "correction-required";
export type PriorityLevel = "low" | "medium" | "high" | "urgent";

export interface AssessorUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface CustomerInfo {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

export interface ServiceInfo {
  id: string;
  name: string;
  category: string;
  description: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  caseId: string;
  uploadedDate: string;
  verificationStatus: "verified" | "pending" | "invalid" | "missing";
}

export interface CaseChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  required: boolean;
}

export interface Case {
  id: string;
  applicationNumber: string;
  customer: CustomerInfo;
  service: ServiceInfo;
  submittedDate: string;
  status: CaseStatus;
  priority: PriorityLevel;
  assessmentScore: number;
  documents: DocumentItem[];
  checklist: CaseChecklistItem[];
  notes: string[];
  assignedAssessor: AssessorUser;
}

export interface AssessmentLog {
  id: string;
  caseId: string;
  applicationNumber: string;
  assessorId: string;
  assessorName: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  notes: string;
  createdAt: string;
}

export const assessorUser: AssessorUser = {
  id: "ASS-001",
  name: "Abebe Kebede",
  email: "assessor@motimport.com",
  role: "assessor",
};

export const assessorCases: Case[] = [
  {
    id: "CASE-001",
    applicationNumber: "MOT-2026-00124",
    customer: {
      id: "CUS-001",
      fullName: "Abebe Kebede",
      phone: "+251911000001",
      email: "abebe@example.com",
      address: "Addis Ababa, Ethiopia",
    },
    service: {
      id: "SRV-001",
      name: "Vehicle Import Service",
      category: "Import",
      description: "Vehicle import assessment and approval",
    },
    submittedDate: "2026-08-17T09:30:00",
    status: "pending",
    priority: "high",
    assessmentScore: 86,
    documents: [
      { id: "DOC-001", name: "Passport", type: "Identity Document", caseId: "CASE-001", uploadedDate: "2026-08-17", verificationStatus: "verified" },
      { id: "DOC-002", name: "Application Form", type: "Application", caseId: "CASE-001", uploadedDate: "2026-08-17", verificationStatus: "verified" },
      { id: "DOC-003", name: "Customs Document", type: "Customs", caseId: "CASE-001", uploadedDate: "2026-08-17", verificationStatus: "pending" },
    ],
    checklist: [
      { id: "CHK-001", title: "Customer information verified", completed: true, required: true },
      { id: "CHK-002", title: "Required documents checked", completed: true, required: true },
      { id: "CHK-003", title: "Service information verified", completed: false, required: true },
      { id: "CHK-004", title: "Supporting documents verified", completed: false, required: true },
    ],
    notes: [],
    assignedAssessor: assessorUser,
  },
  {
    id: "CASE-002",
    applicationNumber: "MOT-2026-00125",
    customer: {
      id: "CUS-002",
      fullName: "Hana Tesfaye",
      phone: "+251922000002",
      email: "hana@example.com",
      address: "Bole, Addis Ababa",
    },
    service: {
      id: "SRV-002",
      name: "Vehicle Registration Review",
      category: "Registration",
      description: "Vehicle registration document assessment",
    },
    submittedDate: "2026-08-16T14:20:00",
    status: "in-review",
    priority: "medium",
    assessmentScore: 92,
    documents: [
      { id: "DOC-004", name: "Passport", type: "Identity Document", caseId: "CASE-002", uploadedDate: "2026-08-16", verificationStatus: "verified" },
      { id: "DOC-005", name: "Registration Document", type: "Registration", caseId: "CASE-002", uploadedDate: "2026-08-16", verificationStatus: "verified" },
    ],
    checklist: [
      { id: "CHK-005", title: "Customer information verified", completed: true, required: true },
      { id: "CHK-006", title: "Registration document verified", completed: true, required: true },
      { id: "CHK-007", title: "Service information verified", completed: true, required: true },
    ],
    notes: [],
    assignedAssessor: assessorUser,
  },
  {
    id: "CASE-003",
    applicationNumber: "MOT-2026-00126",
    customer: {
      id: "CUS-003",
      fullName: "Mohammed Ali",
      phone: "+251933000003",
      email: "mohammed@example.com",
      address: "Adama, Ethiopia",
    },
    service: {
      id: "SRV-003",
      name: "Import Permit Assessment",
      category: "Permit",
      description: "Import permit document assessment",
    },
    submittedDate: "2026-08-15T11:10:00",
    status: "approved",
    priority: "low",
    assessmentScore: 96,
    documents: [
      { id: "DOC-006", name: "Import Permit", type: "Permit", caseId: "CASE-003", uploadedDate: "2026-08-15", verificationStatus: "verified" },
    ],
    checklist: [
      { id: "CHK-008", title: "Permit verified", completed: true, required: true },
      { id: "CHK-009", title: "Customer information verified", completed: true, required: true },
    ],
    notes: [],
    assignedAssessor: assessorUser,
  },
  {
    id: "CASE-004",
    applicationNumber: "MOT-2026-00127",
    customer: {
      id: "CUS-004",
      fullName: "Sara Ahmed",
      phone: "+251944000004",
      email: "sara@example.com",
      address: "Dire Dawa, Ethiopia",
    },
    service: {
      id: "SRV-004",
      name: "Transport Service Review",
      category: "Transport",
      description: "Transport service eligibility assessment",
    },
    submittedDate: "2026-08-14T16:45:00",
    status: "rejected",
    priority: "high",
    assessmentScore: 48,
    documents: [
      { id: "DOC-007", name: "Supporting Document", type: "Supporting", caseId: "CASE-004", uploadedDate: "2026-08-14", verificationStatus: "invalid" },
    ],
    checklist: [
      { id: "CHK-010", title: "Customer information verified", completed: true, required: true },
      { id: "CHK-011", title: "Supporting document verified", completed: false, required: true },
    ],
    notes: [],
    assignedAssessor: assessorUser,
  },
  {
    id: "CASE-005",
    applicationNumber: "MOT-2026-00128",
    customer: {
      id: "CUS-005",
      fullName: "Dawit Solomon",
      phone: "+251955000005",
      email: "dawit@example.com",
      address: "Bahir Dar, Ethiopia",
    },
    service: {
      id: "SRV-005",
      name: "Customs Clearance Review",
      category: "Customs",
      description: "Customs clearance document assessment",
    },
    submittedDate: "2026-08-13T10:15:00",
    status: "correction-required",
    priority: "urgent",
    assessmentScore: 64,
    documents: [
      { id: "DOC-008", name: "Customs Clearance", type: "Customs", caseId: "CASE-005", uploadedDate: "2026-08-13", verificationStatus: "missing" },
    ],
    checklist: [
      { id: "CHK-012", title: "Customer information verified", completed: true, required: true },
      { id: "CHK-013", title: "Customs document submitted", completed: false, required: true },
    ],
    notes: [],
    assignedAssessor: assessorUser,
  },
];

export const assessmentLogs: AssessmentLog[] = [
  {
    id: "LOG-001",
    caseId: "CASE-003",
    applicationNumber: "MOT-2026-00126",
    assessorId: "ASS-001",
    assessorName: "Abebe Kebede",
    action: "Approved case",
    previousStatus: "in-review",
    newStatus: "approved",
    notes: "All required documents verified.",
    createdAt: "2026-08-17T10:42:00",
  },
  {
    id: "LOG-002",
    caseId: "CASE-004",
    applicationNumber: "MOT-2026-00127",
    assessorId: "ASS-001",
    assessorName: "Abebe Kebede",
    action: "Rejected case",
    previousStatus: "in-review",
    newStatus: "rejected",
    notes: "Supporting document is invalid.",
    createdAt: "2026-08-16T15:30:00",
  },
  {
    id: "LOG-003",
    caseId: "CASE-005",
    applicationNumber: "MOT-2026-00128",
    assessorId: "ASS-001",
    assessorName: "Abebe Kebede",
    action: "Requested correction",
    previousStatus: "in-review",
    newStatus: "correction-required",
    notes: "Customs clearance document is missing.",
    createdAt: "2026-08-15T12:20:00",
  },
];


// ============================================================
// 2. CUSTOMER APPROVAL TYPES & DATA
// ============================================================

export type ApprovalStatus =
  | "Pending check"
  | "Flagged"
  | "Verified"
  | "Approved"
  | "Returned for revision"
  | "Rejected";

export type ChecklistStatus =
  | "Verified"
  | "Pending check"
  | "Flagged";

export interface ApprovalChecklistItem {
  id: string;
  name: string;
  status: ChecklistStatus;
}

export interface ApprovalApplicant {
  id: string;
  name: string;
  importerType: string;
  licence: string;
  tin: string;
  status: ApprovalStatus;
  primaryContact: string;
  email: string;
  phone: string;
  address: string;
  registeredDate: string;
  activeServices: number;
  type?: string;
  contact?: string;
  checklist: ApprovalChecklistItem[];
}

export interface ApprovalStatsData {
  awaitingDecision: number;
  returnedForRevision: number;
  verifiedImporters: number;
  medianDecisionTime: string;
  medianDecisionTimeSubtext?: string;
}

export const mockStats: ApprovalStatsData = {
  awaitingDecision: 2,
  returnedForRevision: 1,
  verifiedImporters: 3,
  medianDecisionTime: "1.4 d",
  medianDecisionTimeSubtext: "last 30 days",
};

export const mockApplicants: ApprovalApplicant[] = [
  {
    id: "CUS-10455",
    name: "Abyssinia Pharmaceuticals Import",
    importerType: "Unimodal importer",
    type: "Unimodal importer",
    licence: "MT/IMP/9902/2026",
    tin: "0016034778",
    status: "Pending check",
    primaryContact: "Dr. Lulit Haile",
    contact: "Dr. Lulit Haile",
    email: "lulit@abypharma.et",
    phone: "+251 921 553 900",
    address: "Lideta, Addis Ababa",
    registeredDate: "28 Jun 2026",
    activeServices: 2,
    checklist: [
      { id: "1", name: "Trade licence (renewed)", status: "Verified" },
      { id: "2", name: "TIN registration certificate", status: "Verified" },
      { id: "3", name: "Business registration", status: "Pending check" },
      { id: "4", name: "Authorised signatory ID", status: "Pending check" },
      { id: "5", name: "Bank reference letter", status: "Flagged" },
    ],
  },
  {
    id: "CUS-10502",
    name: "Rift Valley Machinery Import",
    importerType: "Multimodal importer",
    type: "Multimodal importer",
    licence: "MT/IMP/4410/2026",
    tin: "0017229645",
    status: "Flagged",
    primaryContact: "Ato Tadesse Girma",
    contact: "Operations Manager",
    email: "contact@riftvalley.et",
    phone: "+251 911 223 344",
    address: "Bole, Addis Ababa",
    registeredDate: "14 Jul 2026",
    activeServices: 1,
    checklist: [
      { id: "1", name: "Trade licence (renewed)", status: "Verified" },
      { id: "2", name: "Bank reference letter", status: "Flagged" },
    ],
  },
];