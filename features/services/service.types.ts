export type ServiceStatus =
  | "In progress"
  | "Needs review"
  | "Requires customer action"
  | "Pending"
  | "Blocked"
  | "Completed"
  | "Draft"
  | "Submitted"
  | "Under review"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | "Delivered"
  | "Unknown";

export type RiskChannel =
  | "Green channel"
  | "Yellow channel"
  | "Red channel"
  | "Blue channel"
  | "Unassigned";

export type TransportMode = "Unimodal" | "Multimodal" | "Unknown";

export type ServiceColumn =
  | "service"
  | "importer"
  | "mode"
  | "status"
  | "risk"
  | "caseExecutor"
  | "eta"
  | "sla"
  | "updated";

export interface ServiceRecord {
  id: string;
  shipmentId?: string;
  referenceNumber?: string;
  title: string;
  importerName: string;
  importerCode: string;
  mode: TransportMode;
  status: ServiceStatus;
  riskChannel: RiskChannel;
  caseExecutor: string;
  eta: string;
  sla: string;
  isOverdue?: boolean;
  updated: string;
  updatedAtTimestamp?: number | null;
}

export interface ServiceFiltersState {
  searchQuery: string;
  statusFilter: string;
  modeFilter: string;
  channelFilter: string;
}
