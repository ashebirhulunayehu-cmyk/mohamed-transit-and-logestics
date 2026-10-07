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

export interface NotificationApiItem {
  id?: string | number;
  title?: string;
  description?: string;
  category?: NotificationCategory | string;
  time?: string;
  referenceId?: string;
  isRead?: boolean | number | string;
  isNew?: boolean | number | string;
  priority?: "CRITICAL" | "HIGH";
}

export interface NotificationApiResponse {
  notifications: NotificationApiItem[];
  unreadCount: number;
  page: number;
  pageSize: number;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface DocumentMonitoringAlertsResponse {
  hasRedFlag: boolean;
  alerts: unknown[];
}