export type NotificationCategory = 
  | "Service Updates" 
  | "Documents" 
  | "Approvals" 
  | "Payments" 
  | "Inspection" 
  | "Risk" 
  | "Messages" 
  | "System";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  time: string;
  referenceId: string;
  isRead: boolean;
  isNew: boolean;
  priority?: "CRITICAL" | "HIGH";
}