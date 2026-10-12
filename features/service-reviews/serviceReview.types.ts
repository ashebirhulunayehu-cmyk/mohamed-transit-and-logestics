export type RiskChannel =
  | "Blue channel"
  | "Green channel"
  | "Yellow channel"
  | "Red channel"
  | "Unassigned";

export interface EvidenceFile {
  id: string;
  documentId?: string;
  name: string;
  type: string;
  source: "Customer" | "Service";
  description?: string;
  size?: string;
  mimeType?: string;
  isRequired: boolean;
  isVerified: boolean;
  verificationNotes?: string;
  submittedAt?: string;
  expiryDate?: string;
  isExpired?: boolean;
}

export interface ServiceCase {
  id: string;
  shipmentId: number;
  trackingNumber: string;
  title: string;
  importer: string;
  importerId: number;
  businessName: string;
  tinNumber: string;
  businessLicense: string;
  importLicense: string;
  importLicenseExpiry: string;
  businessType: string;
  businessAddress: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  customerIsVerified: boolean | null;
  route: string;
  origin: string;
  destination: string;
  countryOfOrigin: string;
  routeCategory: string;
  status: string;
  assignedHub: string;
  mode: string;
  declaredValue: string;
  taxCategory: string;
  riskLevel: string;
  channel: RiskChannel;
  caseExecutor: string;
  stages: string[];
  registeredDate: string;
  updatedAt: string;
  evidenceFiles: EvidenceFile[];
}

export interface ServiceReviewStats {
  awaitingReview: number;
  redChannel: number;
  withDocuments: number;
  unverifiedDocuments: number;
}
