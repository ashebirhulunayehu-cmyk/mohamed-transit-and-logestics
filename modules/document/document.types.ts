export type VerificationStatus = "Verified" | "Flagged" | "Rejected" | "Pending check";

export interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  serviceId: string;
  serviceStage: string;
  uploadedBy: string;
  uploadedAt: string;
  status: VerificationStatus;
}

export interface DocumentFiltersState {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
}
