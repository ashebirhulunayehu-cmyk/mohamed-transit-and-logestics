export type VerificationStatus = "Verified" | "Flagged" | "Rejected" | "Pending check";

export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  serviceId: string;
  serviceTrackingNumber?: string;
  serviceStage: string;
  uploadedBy: string;
  uploadedAt: string;
  status: VerificationStatus;
  checksum?: string;
  accessRestriction?: string;
  virusScanStatus?: string;
  history?: string[];
  verificationNotes?: string;
}

export interface DocumentFiltersState {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
}