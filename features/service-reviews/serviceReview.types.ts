export type RiskChannel = "Red channel" | "Yellow channel" | "Green channel" | "Unassigned";
export type CaseStatusTag = "Requires customer action" | "Blocked" | "Needs review" | "Signed off";

export interface EvidenceFile {
  id: string;
  documentId?: string;
  name: string;
  type: string;
  size?: string;
  url?: string;
}

export interface ServiceCase {
  id: string;
  shipmentId?: number;
  title: string;
  containerCount: string;
  importer: string;
  route: string;
  statusTag: CaseStatusTag;
  channel: RiskChannel;
  commodity: string;
  hsCode: string;
  declaredValue: string;
  incoterm: string;
  billOfLading: string;
  caseExecutor: string;
  currentStage: string;
  sla: string;
  mode: string;
  timeAgo: string;
  evidenceFiles: EvidenceFile[];
}

export interface ServiceReviewStats {
  awaitingReview: number;
  redChannel: number;
  submittedForReview: number;
  signedOff: number;
}