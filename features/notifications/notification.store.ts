import { create } from 'zustand';
import { createNotification as createNotificationRequest, getDocumentMonitoringAlerts, getUnreadNotificationCount, getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendBulkNotifications as sendBulkNotificationsRequest } from './notification.endpoint';
import { NotificationItem, NotificationCategory, NotificationApiItem, NotificationApiResponse, NotificationUnreadCountResponse, DocumentMonitoringAlertsResponse } from './notification.types';

const readFlag = (value: unknown): boolean => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0' || normalized === '') return false;
  }
  return false;
};

const normalizeNotification = (item: NotificationApiItem): NotificationItem => ({
  id: String(item.id ?? crypto.randomUUID()),
  title: item.title ?? 'Notification',
  description: item.description ?? 'No description provided.',
  category: (item.category as NotificationCategory) ?? 'System',
  time: item.time ?? 'Just now',
  referenceId: item.referenceId ?? 'N/A',
  isRead: readFlag(item.isRead),
  isNew: readFlag(item.isNew),
  priority: item.priority ?? undefined,
});

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  page: number;
  pageSize: number;
  filterTab: "All" | NotificationCategory;
  showUnreadOnly: boolean;
  loading: boolean;
  error: string | null;
  documentAlerts: unknown[];
  hasDocumentRedFlag: boolean;
  documentAlertsLoading: boolean;
  documentAlertsError: string | null;

  setFilterTab: (tab: "All" | NotificationCategory) => void;
  toggleShowUnreadOnly: () => void;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  createNotification: (payload: Record<string, unknown>) => Promise<string | null>;
  sendBulkNotifications: (payload: Record<string, unknown>) => Promise<string | null>;
  fetchNotifications: () => Promise<NotificationItem[]>;
  fetchUnreadCount: () => Promise<number>;
  fetchDocumentMonitoringAlerts: () => Promise<DocumentMonitoringAlertsResponse | null>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeDocumentMonitoringAlerts = (value: unknown): DocumentMonitoringAlertsResponse | null => {
  let candidate = value;

  for (let depth = 0; depth < 5; depth += 1) {
    if (!isRecord(candidate)) return null;
    if ('hasRedFlag' in candidate) {
      return {
        hasRedFlag: candidate.hasRedFlag === true,
        alerts: Array.isArray(candidate.alerts) ? candidate.alerts : [],
      };
    }
    candidate = candidate.response ?? candidate.data ?? candidate.payload;
  }

  return null;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  page: 1,
  pageSize: 20,
  filterTab: "All",
  showUnreadOnly: false,
  loading: false,
  error: null,
  documentAlerts: [],
  hasDocumentRedFlag: false,
  documentAlertsLoading: false,
  documentAlertsError: null,

  setFilterTab: (tab) => set({ filterTab: tab }),

  toggleShowUnreadOnly: () => set((state) => ({ showUnreadOnly: !state.showUnreadOnly })),

  markAsRead: async (id) => {
    const notification = get().notifications.find((item) => item.id === id);
    if (!notification || notification.isRead) return false;

    try {
      await markNotificationAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((item) =>
          item.id === id ? { ...item, isRead: true, isNew: false } : item
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        error: null,
      }));
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to mark notification as read.';
      set({ error: message });
      return false;
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllNotificationsAsRead();
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          isRead: true,
          isNew: false,
        })),
        unreadCount: 0,
        error: null,
      }));
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to mark all notifications as read.';
      set({ error: message });
      return false;
    }
  },

  createNotification: async (payload) => {
    try {
      const response = await createNotificationRequest(payload);
      const result = response as unknown as { message?: unknown };
      set({ error: null });
      return typeof result?.message === 'string' ? result.message : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to create notification.';
      set({ error: message });
      return null;
    }
  },

  sendBulkNotifications: async (payload) => {
    try {
      const response = await sendBulkNotificationsRequest(payload);
      const result = response as unknown as { message?: unknown };
      set({ error: null });
      return typeof result?.message === 'string' ? result.message : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to send bulk notifications.';
      set({ error: message });
      return null;
    }
  },

  fetchNotifications: async () => {
    set({ loading: true, error: null });

    try {
      const response = await getUserNotifications();
      const payload = response as unknown as NotificationApiResponse;
      const list = Array.isArray(payload?.notifications) ? payload.notifications : [];
      const notifications = list.map(normalizeNotification);
      const unreadCount = typeof payload?.unreadCount === 'number'
        ? payload.unreadCount
        : notifications.filter((notification) => !notification.isRead).length;

      set({
        notifications,
        unreadCount,
        page: typeof payload?.page === 'number' ? payload.page : 1,
        pageSize: typeof payload?.pageSize === 'number' ? payload.pageSize : 20,
        loading: false,
        error: null,
      });
      return notifications;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load notifications.';
      set({
        notifications: [],
        unreadCount: 0,
        loading: false,
        error: message,
      });
      return [];
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await getUnreadNotificationCount();
      const payload = response as unknown as NotificationUnreadCountResponse;
      if (typeof payload?.unreadCount !== 'number' || !Number.isFinite(payload.unreadCount)) {
        throw new Error('Unexpected unread notification count response.');
      }

      set({ unreadCount: payload.unreadCount, error: null });
      return payload.unreadCount;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load unread notification count.';
      set({ error: message });
      return get().unreadCount;
    }
  },

  fetchDocumentMonitoringAlerts: async () => {
    set({ documentAlertsLoading: true, documentAlertsError: null });

    try {
      const response = await getDocumentMonitoringAlerts();
      const result = normalizeDocumentMonitoringAlerts(response);
      if (!result) throw new Error('Unexpected document monitoring alerts response.');

      set({
        documentAlerts: result.alerts,
        hasDocumentRedFlag: result.hasRedFlag,
        documentAlertsLoading: false,
        documentAlertsError: null,
      });
      return result;
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'Unable to load document alerts.';
      set({
        documentAlerts: [],
        hasDocumentRedFlag: false,
        documentAlertsLoading: false,
        documentAlertsError: message,
      });
      return null;
    }
  },
}));