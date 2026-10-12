export type ApprovalStatus =
  | "Pending check"
  | "Flagged"
  | "Verified"
  | "Returned for revision"
  | "Rejected";

export interface ChecklistItem {
  id: string;
  name: string;
  status: ApprovalStatus;
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
  activeServices: number | null;
  checklist: ChecklistItem[];
}

export const mockStats = {
  awaitingDecision: 2,
  returnedForRevision: 1,
  verifiedImporters: 3,
  medianDecisionTime: "1.4 d",
};

export const mockApplicants: ApprovalApplicant[] = [
  {
    id: "CUS-10455",
    name: "Abyssinia Pharmaceuticals Import",
    importerType: "Unimodal importer",
    licence: "MT/IMP/9902/2026",
    tin: "0016034778",
    status: "Pending check",
    primaryContact: "Dr. Lulit Haile",
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
    licence: "MT/IMP/4410/2026",
    tin: "0017229645",
    status: "Flagged",
    primaryContact: "Ato Tadesse Girma",
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
 