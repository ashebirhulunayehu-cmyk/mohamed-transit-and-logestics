import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export const notificationEndpoints = {
	getUserNotifications: (userId: string | number) =>
		service.get(API_ROUTES.notification.getUserNotifications, { params: { userId } }),
	getUnreadCount: (userId: string | number) =>
		service.get(API_ROUTES.notification.getUnreadCount, { params: { userId } }),
	getDocumentMonitoringAlerts: () => service.get<unknown>(API_ROUTES.documentMonitoring.getAlerts),
	create: (payload: Record<string, unknown>) =>
		service.post<{ message: string }>(API_ROUTES.notification.create, payload),
	sendBulk: (payload: Record<string, unknown>) =>
		service.post<{ message: string }>(API_ROUTES.notification.sendBulk, payload),
	markAsRead: (notificationId: string | number) =>
		service.post(API_ROUTES.notification.markAsRead, { notificationId }),
	markAllAsRead: (userId: string | number) =>
		service.post(API_ROUTES.notification.markAllAsRead, { userId }),
};

export const getUserNotifications = (userId: string | number) =>
	notificationEndpoints.getUserNotifications(userId);
export const getUnreadNotificationCount = (userId: string | number) =>
	notificationEndpoints.getUnreadCount(userId);
export const getDocumentMonitoringAlerts = () => notificationEndpoints.getDocumentMonitoringAlerts();
export const createNotification = (payload: Record<string, unknown>) =>
	notificationEndpoints.create(payload);
export const sendBulkNotifications = (payload: Record<string, unknown>) =>
	notificationEndpoints.sendBulk(payload);
export const markNotificationAsRead = (notificationId: string | number) =>
	notificationEndpoints.markAsRead(notificationId);
export const markAllNotificationsAsRead = (userId: string | number) =>
	notificationEndpoints.markAllAsRead(userId);
