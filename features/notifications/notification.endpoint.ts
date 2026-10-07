import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";

export const notificationEndpoints = {
	getUserNotifications: () => service.get(API_ROUTES.notification.getUserNotifications),
	getUnreadCount: () => service.get(API_ROUTES.notification.getUnreadCount),
	getDocumentMonitoringAlerts: () => service.get<unknown>(API_ROUTES.documentMonitoring.getAlerts),
	create: (payload: Record<string, unknown>) =>
		service.post<{ message: string }>(API_ROUTES.notification.create, payload),
	sendBulk: (payload: Record<string, unknown>) =>
		service.post<{ message: string }>(API_ROUTES.notification.sendBulk, payload),
	markAsRead: (notificationId: string | number) =>
		service.post(API_ROUTES.notification.markAsRead, { notificationId }),
	markAllAsRead: () => service.post(API_ROUTES.notification.markAllAsRead),
};

export const getUserNotifications = () => notificationEndpoints.getUserNotifications();
export const getUnreadNotificationCount = () => notificationEndpoints.getUnreadCount();
export const getDocumentMonitoringAlerts = () => notificationEndpoints.getDocumentMonitoringAlerts();
export const createNotification = (payload: Record<string, unknown>) =>
	notificationEndpoints.create(payload);
export const sendBulkNotifications = (payload: Record<string, unknown>) =>
	notificationEndpoints.sendBulk(payload);
export const markNotificationAsRead = (notificationId: string | number) =>
	notificationEndpoints.markAsRead(notificationId);
export const markAllNotificationsAsRead = () => notificationEndpoints.markAllAsRead();
