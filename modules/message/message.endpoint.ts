import { API_ROUTES } from "@/modules/api";
import { service } from "@/modules/utils/axios/service";
import type { SendMessageRequest, SendMessageResult, UnreadCountResult } from "./message.type";

const normalizeSendMessagePayload = (payload: SendMessageRequest) => {
	const shipmentId = payload.shipmentId ?? payload.serviceId;
	const recipientId = payload.recipientId ?? payload.recipientUserId;
	const subject = payload.subject?.trim() || "New message";
	const content = payload.content?.trim() || "";

	if (shipmentId === undefined || shipmentId === null || shipmentId === "") {
		throw new Error("Shipment ID is required to send a message.");
	}

	if (recipientId === undefined || recipientId === null || recipientId === "") {
		throw new Error("Recipient ID is required to send a message.");
	}

	return {
		shipmentId,
		recipientId,
		subject,
		content,
		type: payload.type ?? 2,
	};
};

export const messageEndpoints = {
	getDirectoryUsers: () =>
		service.get(API_ROUTES.message.getDirectoryUsers),
	getUserMessages: (userId?: string | number) =>
		service.get(API_ROUTES.message.getUserMessages, userId === undefined ? undefined : { params: { userId } }),
	getServiceMessages: (serviceId?: string | number) =>
		service.get(
			API_ROUTES.message.getServiceMessages,
			serviceId === undefined ? undefined : { params: { serviceId } },
		),
	getUnreadMessages: (userId?: string | number) =>
		service.get(API_ROUTES.message.getUnreadMessages, userId === undefined ? undefined : { params: { userId } }),
	getUnreadCount: (userId?: string | number) =>
		service.get<UnreadCountResult>(API_ROUTES.message.getUnreadCount, userId === undefined ? undefined : { params: { userId } }),
	sendMessage: (payload: SendMessageRequest) =>
		service.post<SendMessageResult>(API_ROUTES.message.sendMessage, normalizeSendMessagePayload(payload)),
	getMessageById: (id: string | number) =>
		service.get(API_ROUTES.message.getMessageById, { params: { messageId: id } }),
	markMessageAsRead: (messageId: string | number, userId?: string | number) =>
		service.post(API_ROUTES.message.markMessageAsRead, { messageId, userId }),
};

export const getDirectoryUsers = () => messageEndpoints.getDirectoryUsers();
export const getUserMessages = (userId?: string | number) => messageEndpoints.getUserMessages(userId);
export const getServiceMessages = (serviceId?: string | number) =>
	messageEndpoints.getServiceMessages(serviceId);
export const getUnreadMessages = (userId?: string | number) => messageEndpoints.getUnreadMessages(userId);
export const getUnreadCount = (userId?: string | number) => messageEndpoints.getUnreadCount(userId);
export const sendMessage = (payload: SendMessageRequest) =>
	messageEndpoints.sendMessage(payload);
export const getMessageById = (id: string | number) =>
	messageEndpoints.getMessageById(id);
export const markMessageAsRead = (messageId: string | number, userId?: string | number) =>
	messageEndpoints.markMessageAsRead(messageId, userId);
