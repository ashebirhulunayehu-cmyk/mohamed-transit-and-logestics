import { create } from 'zustand';
import useAuthStore from '@/modules/auth/auth.store';
import { createNotification as createNotificationRequest, getDocumentMonitoringAlerts, getUnreadNotificationCount, getUserNotifications, markAllNotificationsAsRead, markNotificationAsRead, sendBulkNotifications as sendBulkNotificationsRequest } from './notification.endpoint';
import { NotificationItem, NotificationCategory, DocumentMonitoringAlertsResponse } from './notification.types';

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

const readField = (value: Record<string, unknown>, ...names: string[]): unknown => {
  const wantedNames = new Set(names.map((name) => name.toLowerCase()));
  const key = Object.keys(value).find((candidate) => wantedNames.has(candidate.toLowerCase()));
  return key ? value[key] : undefined;
};

const getCurrentUserId = (): string | number => {
  const userId = useAuthStore.getState().user?.id;
  if (userId === undefined || userId === null || String(userId).trim() === '') {
    throw new Error('Your user ID is unavailable. Sign in again to load notifications.');
  }
  return userId;
};

const unwrapResponse = (value: unknown): unknown => {
  let current = value;
  for (let depth = 0; depth < 6; depth += 1) {
    if (!isRecord(current)) return current;
    if (
      readField(current, 'notifications') !== undefined ||
      readField(current, 'items') !== undefined ||
      readField(current, 'unreadCount') !== undefined
    ) {
      return current;
    }
    const nested = readField(current, 'data', 'payload', 'response', 'result');
    if (nested === undefined || nested === current) return current;
    current = nested;
  }
  return current;
};

const normalizeCategory = (value: unknown): NotificationCategory => {
  if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
    switch (Number(value)) {
      case 1:
      case 3:
        return 'Service Updates';
      case 2:
        return 'Documents';
      case 4:
        return 'Payments';
      case 5:
        return 'System';
      case 6:
        return 'Messages';
      default:
        return 'System';
    }
  }

  const category = typeof value === 'string' ? value.trim().toLowerCase().replace(/[^a-z]/g, '') : '';
  if (category.includes('document')) return 'Documents';
  if (category.includes('approval')) return 'Approvals';
  if (category.includes('payment')) return 'Payments';
  if (category.includes('inspection')) return 'Inspection';
  if (category.includes('risk')) return 'Risk';
  if (category.includes('message')) return 'Messages';
  if (category.includes('service') || category.includes('status')) return 'Service Updates';
  return 'System';
};

const formatNotificationTime = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return 'Time unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const elapsedMinutes = Math.round((date.getTime() - Date.now()) / 60_000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  if (Math.abs(elapsedMinutes) < 60) return formatter.format(elapsedMinutes, 'minute');
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (Math.abs(elapsedHours) < 24) return formatter.format(elapsedHours, 'hour');
  return formatter.format(Math.round(elapsedHours / 24), 'day');
};

const normalizeNotification = (value: unknown): NotificationItem | null => {
  if (!isRecord(value)) return null;
  const id = readField(value, 'id', 'notificationId');
  if ((typeof id !== 'string' && typeof id !== 'number') || !String(id).trim()) return null;

  const message = readField(value, 'description', 'message');
  const title = readField(value, 'title');
  const type = readField(value, 'category', 'type');
  const createdDate = readField(value, 'time', 'createdDate', 'createAt');
  const referenceId = readField(value, 'referenceId', 'serviceId');
  const isRead = readFlag(readField(value, 'isRead'));
  const isUrgent = readFlag(readField(value, 'isUrgent'));
  const priority = readField(value, 'priority');

  return {
    id: String(id),
    title: typeof title === 'string' && title.trim() ? title : 'Notification',
    description: typeof message === 'string' && message.trim() ? message : 'No description provided.',
    category: normalizeCategory(type),
    time: formatNotificationTime(createdDate),
    referenceId: referenceId === null || referenceId === undefined ? 'N/A' : String(referenceId),
    isRead,
    isNew: readFlag(readField(value, 'isNew')),
    ...(isUrgent || priority === 'CRITICAL' || priority === 'HIGH'
      ? { priority: priority === 'CRITICAL' ? 'CRITICAL' as const : 'HIGH' as const }
      : {}),
  };
};

const readNotificationList = (value: unknown): unknown[] => {
  const payload = unwrapResponse(value);
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  const list = readField(payload, 'notifications', 'items', 'results');
  return Array.isArray(list) ? list : [];
};

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
      await markAllNotificationsAsRead(getCurrentUserId());
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
      const response = await getUserNotifications(getCurrentUserId());
      const payload = unwrapResponse(response);
      const list = readNotificationList(payload);
      const notifications = list
        .map(normalizeNotification)
        .filter((notification): notification is NotificationItem => notification !== null);
      const unreadCountValue = isRecord(payload) ? readField(payload, 'unreadCount') : undefined;
      const pageValue = isRecord(payload) ? readField(payload, 'page') : undefined;
      const pageSizeValue = isRecord(payload) ? readField(payload, 'pageSize') : undefined;
      const unreadCount = typeof unreadCountValue === 'number'
        ? unreadCountValue
        : notifications.filter((notification) => !notification.isRead).length;

      set({
        notifications,
        unreadCount,
        page: typeof pageValue === 'number' ? pageValue : 1,
        pageSize: typeof pageSizeValue === 'number' ? pageSizeValue : 20,
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
      const response = unwrapResponse(await getUnreadNotificationCount(getCurrentUserId()));
      const unreadCount = isRecord(response) ? readField(response, 'unreadCount') : undefined;
      if (typeof unreadCount !== 'number' || !Number.isFinite(unreadCount)) {
        throw new Error('Unexpected unread notification count response.');
      }

      set({ unreadCount, error: null });
      return unreadCount;
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