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
  Id?: string | number;
  title?: string;
  Title?: string;
  description?: string;
  message?: string;
  Message?: string;
  category?: NotificationCategory | string;
  type?: NotificationCategory | string | number;
  Type?: NotificationCategory | string | number;
  time?: string;
  createdDate?: string;
  CreatedDate?: string;
  referenceId?: string;
  serviceId?: string | number | null;
  ServiceId?: string | number | null;
  isRead?: boolean | number | string;
  IsRead?: boolean | number | string;
  isNew?: boolean | number | string;
  IsNew?: boolean | number | string;
  isUrgent?: boolean | number | string;
  IsUrgent?: boolean | number | string;
  priority?: "CRITICAL" | "HIGH";
}

export interface NotificationApiResponse {
  notifications: NotificationApiItem[];
  Notifications?: NotificationApiItem[];
  unreadCount: number;
  UnreadCount?: number;
  page: number;
  Page?: number;
  pageSize: number;
  PageSize?: number;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface DocumentMonitoringAlertsResponse {
  hasRedFlag: boolean;
  alerts: unknown[];
}