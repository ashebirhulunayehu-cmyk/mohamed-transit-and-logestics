export type CustomerServiceStatus =
  | "Requires customer action"
  | "In transit"
  | "Completed";

export interface CustomerService {
  id: string;
  title: string;
  route: string;
  mode: string;
  status: CustomerServiceStatus;
  channel: "Green channel" | "Yellow channel";
  executor: string;
  eta: string;
  sla: string;
  updated: string;
  progress: number;
}

export interface CustomerNotification {
  title: string;
  description: string;
  meta: string;
}

export interface CustomerMessage {
  id: string;
  sender: string;
  preview: string;
  body: string;
  time: string;
  initials: string;
  mine?: boolean;
}
