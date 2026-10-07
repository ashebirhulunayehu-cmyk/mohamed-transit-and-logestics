import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";
import type { SendMessageRequest, SendMessageResult, UnreadCountResult } from "./message.type";

export const messageEndpoints = {
	getUserMessages: () => service.get(API_ROUTES.message.getUserMessages),
	getServiceMessages: (serviceId?: string | number) =>
		service.get(
			API_ROUTES.message.getServiceMessages,
			serviceId === undefined ? undefined : { params: { serviceId } },
		),
	getUnreadMessages: () => service.get(API_ROUTES.message.getUnreadMessages),
	getUnreadCount: () => service.get<UnreadCountResult>(API_ROUTES.message.getUnreadCount),
	sendMessage: (payload: SendMessageRequest) =>
		service.post<SendMessageResult>(API_ROUTES.message.sendMessage, payload),
	getMessageById: (id: string | number) =>
		service.get(API_ROUTES.message.getMessageById, { params: { messageId: id } }),
	markMessageAsRead: (messageId: string | number) =>
		service.post(API_ROUTES.message.markMessageAsRead, { messageId }),
};


export const getUserMessages = () => messageEndpoints.getUserMessages();
export const getServiceMessages = (serviceId?: string | number) =>
	messageEndpoints.getServiceMessages(serviceId);
export const getUnreadMessages = () => messageEndpoints.getUnreadMessages();
export const getUnreadCount = () => messageEndpoints.getUnreadCount();
export const sendMessage = (payload: SendMessageRequest) =>
	messageEndpoints.sendMessage(payload);
export const getMessageById = (id: string | number) =>
	messageEndpoints.getMessageById(id);
export const markMessageAsRead = (messageId: string | number) =>
	messageEndpoints.markMessageAsRead(messageId);
