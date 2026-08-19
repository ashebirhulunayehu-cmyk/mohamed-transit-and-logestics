export type ServiceStatus =
  | "In progress"
  | "Needs review"
  | "Requires customer action"
  | "Pending"
  | "Blocked"
  | "Completed";

export type RiskChannel =
  | "Green channel"
  | "Yellow channel"
  | "Red channel"
  | "Blue channel";

export type TransportMode = "Unimodal" | "Multimodal";

export interface ServiceRecord {
  id: string;
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
}

export interface ServiceFiltersState {
  searchQuery: string;
  statusFilter: string;
  modeFilter: string;
  channelFilter: string;
}