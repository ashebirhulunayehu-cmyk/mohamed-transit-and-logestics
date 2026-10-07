export type CustomerServiceStatus =
  | "In progress"
  | "Needs review"
  | "Requires customer action"
  | "Pending"
  | "Blocked"
  | "Completed";

export type CustomerRiskChannel =
  | "Green channel"
  | "Yellow channel"
  | "Red channel"
  | "Blue channel";

export type CustomerTransportMode = "Unimodal" | "Multimodal";

export interface CustomerService {
  id: string;
  title: string;
  importerName: string;
  importerCode: string;
  mode: CustomerTransportMode;
  status: CustomerServiceStatus;
  riskChannel: CustomerRiskChannel;
  channel: CustomerRiskChannel;
  caseExecutor: string;
  executor: string;
  eta: string;
  sla: string;
  isOverdue?: boolean;
  updated: string;
}
