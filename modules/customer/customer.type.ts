export interface CustomerRegisterPayload {
  businessName: string;
  tinNumber: string;
  businessLicense: string;
  businessAddress: string;
  startDate?: string | null;
  city: string;
  state: string;
  postalCode: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  businessType: string;
  importLicense: string;
  importLicenseExpiry?: string | Date | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedByUserId?: number | null;
  verificationNotes?: string | null;
  userId?: number;
  createdByDataEncoderId?: number;
}

export interface CustomerRegistrationRecord extends CustomerRegisterPayload {
  id?: number | string;
  user?: unknown | null;
  createdByDataEncoder?: unknown | null;
  verifiedByUser?: unknown | null;
  documents?: unknown[];
  createAt?: string;
  updatedAt?: string | null;
  recordStatus?: number;
}

export interface CustomerRegistrationApiEnvelope {
  statusCode: number;
  error: boolean;
  errors: string[];
  message: string;
  response?: {
    data?: CustomerRegistrationRecord;
  };
}

export interface CustomerProfileRecord {
  businessName: string | null;
  tinNumber: string | null;
  businessLicense: string | null;
  businessAddress: string | null;
  startDate: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  businessType: string | null;
  importLicense: string | null;
  importLicenseExpiry: string | null;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedByUserId: number | null;
  verificationNotes: string | null;
  userId: number | null;
  createdByDataEncoderId: number | null;
  user?: Record<string, unknown> | null;
  createdByDataEncoder?: Record<string, unknown> | null;
  verifiedByUser?: Record<string, unknown> | null;
  documents?: unknown[];
  id?: number | string | null;
  createAt?: string | null;
  updatedAt?: string | null;
  recordStatus?: number | null;
}

export interface CustomerProfileApiEnvelope {
  statusCode: number;
  error: boolean;
  errors: string[];
  message: string;
  response?: {
    data?: CustomerProfileRecord;
  };
}

export interface CustomerCreateServicePayload {
  description: string;
  mode: "MultiModalSeaRail" | "UniModalRoad";
  origin: string;
  destination: string;
}

export interface CustomerUpdateProfilePayload {
  businessName?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
}

export interface CustomerServiceApiItem {
  id: number;
  serviceNumber: string;
  itemDescription: string;
  routeCategory: string;
  declaredValue: number;
  taxCategory: string;
  countryOfOrigin: string;
  serviceType: number;
  status: number;
  riskLevel: number;
  customerId: number;
  assignedCaseExecutorId: number | null;
  assignedAssessorId: number | null;
  registeredDate: string;
  lastUpdateDate: string | null;
}

export interface CustomerCreatedServiceRecord {
  id?: number | string;
  trackingNumber?: string;
  importerId?: number | string;
  description?: string;
  mode?: string;
  assignedHub?: string;
  status?: string;
  origin?: string;
  destination?: string;
  createAt?: string;
  updatedAt?: string | null;
}
