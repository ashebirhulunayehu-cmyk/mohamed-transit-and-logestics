import { create } from "zustand";
import { getMessageById, getServiceMessages as getServiceMessagesRequest, getUnreadCount as getUnreadCountRequest, getUnreadMessages, getUserMessages, markMessageAsRead as markMessageAsReadRequest, sendMessage as sendMessageRequest } from "./message.endpoint";
import type { MessageImporterSummary, MessageServiceSummary, MessageUserSummary, SendMessageRequest, SendMessageResult, UserMessage } from "./message.type";

interface MessageState {
	userMessages: UserMessage[];
	serviceMessages: UserMessage[];
	unreadMessages: UserMessage[];
	unreadCount: number;
	selectedMessage: UserMessage | null;
	loading: boolean;
	error: string | null;
	fetchUserMessages: () => Promise<UserMessage[]>;
	fetchServiceMessages: (serviceId?: string | number) => Promise<UserMessage[]>;
	fetchUnreadMessages: () => Promise<UserMessage[]>;
	fetchUnreadCount: () => Promise<number>;
	fetchMessageById: (id: string | number) => Promise<UserMessage | null>;
	markMessageAsRead: (id: string | number) => Promise<boolean>;
	sendMessage: (payload: SendMessageRequest) => Promise<SendMessageResult | null>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const getMessagingErrorMessage = (error: unknown, fallback: string): string => {
	const message = error instanceof Error
		? error.message
		: typeof error === "string"
			? error
			: fallback;

	if (/System\.InvalidOperationException|Unable to resolve service for type .*IMessagingService/i.test(message)) {
		return "Messaging is unavailable because the API server has not registered its messaging service. Contact your administrator.";
	}
	return message || fallback;
};

const readFlag = (value: unknown): boolean => {
	if (value === true || value === 1) return true;
	if (value === false || value === 0 || value === null || value === undefined) return false;
	if (typeof value === "string") {
		const normalized = value.trim().toLowerCase();
		if (normalized === "true" || normalized === "1") return true;
		if (normalized === "false" || normalized === "0" || normalized === "") return false;
	}
	return false;
};

const unwrapMessageData = (value: unknown): unknown => {
	if (Array.isArray(value) || !isRecord(value)) return value;

	if (value.response !== undefined) return unwrapMessageData(value.response);
	if (value.payload !== undefined) return unwrapMessageData(value.payload);
	if (value.data !== undefined) return unwrapMessageData(value.data);
	if (value.result !== undefined) return unwrapMessageData(value.result);
	if (value.resultData !== undefined) return unwrapMessageData(value.resultData);

	return value;
};

const isExceptionLikeLabel = (value: string | null | undefined): boolean => {
	if (typeof value !== "string") return false;

	const normalized = value.trim();
	if (!normalized) return false;

	return /(?:^|\.)[A-Z][A-Za-z0-9_]*Exception$/u.test(normalized)
		|| /(?:^|\s)(?:Error|Exception|Failure)$/iu.test(normalized)
		|| /(?:^|\.)System\.[A-Za-z0-9_.]+$/u.test(normalized)
		|| /(?:^|\.)[A-Z][A-Za-z0-9_]*Error$/u.test(normalized);
};

const sanitizeTextValue = (value: string | null | undefined): string | null => {
	if (typeof value !== "string") return null;

	const trimmed = value.trim();
	if (!trimmed || isExceptionLikeLabel(trimmed)) return null;

	return trimmed;
};

const getMessageList = (value: unknown): unknown[] => {
	const payload = unwrapMessageData(value);
	if (Array.isArray(payload)) {
		return payload.filter((item) => {
			if (typeof item === "string") return !isExceptionLikeLabel(item);
			return true;
		});
	}
	if (!isRecord(payload)) return [];

	for (const key of ["items", "messages", "results", "result", "userMessages", "serviceMessages"]) {
		const candidate = payload[key];
		if (Array.isArray(candidate)) {
			return candidate.filter((item) => {
				if (typeof item === "string") return !isExceptionLikeLabel(item);
				return true;
			});
		}
	}

	return [];
};

const normalizeUserSummary = (value: unknown): MessageUserSummary | null => {
	if (!isRecord(value)) return null;

	const username = sanitizeTextValue(typeof value.username === "string" ? value.username : null);
	const email = sanitizeTextValue(typeof value.email === "string" ? value.email : null);
	const firstName = sanitizeTextValue(typeof value.firstName === "string" ? value.firstName : null);
	const lastName = sanitizeTextValue(typeof value.lastName === "string" ? value.lastName : null);

	if (!username && !email && !firstName && !lastName && !value.id && !value.userId) {
		return null;
	}

	return {
		id: typeof value.id === "string" || typeof value.id === "number" ? value.id : undefined,
		userId: typeof value.userId === "string" || typeof value.userId === "number" ? value.userId : null,
		username,
		email,
		firstName,
		lastName,
		profilePhoto: typeof value.profilePhoto === "string" ? value.profilePhoto : null,
		phone: typeof value.phone === "string" ? value.phone : null,
	};
};

const normalizeImporterSummary = (value: unknown): MessageImporterSummary | null => {
	if (!isRecord(value)) return null;
	const userSummary = normalizeUserSummary(value);
	if (!userSummary) return null;

	return {
		...userSummary,
		user: normalizeUserSummary(value.user),
	};
};

const normalizeServiceSummary = (value: unknown): MessageServiceSummary | null => {
	if (!isRecord(value)) return null;

	return {
		id: typeof value.id === "string" || typeof value.id === "number" ? value.id : undefined,
		trackingNumber: typeof value.trackingNumber === "string" ? value.trackingNumber : null,
		importerId: typeof value.importerId === "string" || typeof value.importerId === "number" ? value.importerId : null,
		importer: normalizeImporterSummary(value.importer),
		description: typeof value.description === "string" ? value.description : null,
		mode: typeof value.mode === "number" ? value.mode : null,
		assignedHub: typeof value.assignedHub === "string" || typeof value.assignedHub === "number" ? value.assignedHub : null,
		status: typeof value.status === "string" || typeof value.status === "number" ? value.status : null,
		createdByUserId: typeof value.createdByUserId === "string" || typeof value.createdByUserId === "number" ? value.createdByUserId : null,
		createdByUser: normalizeUserSummary(value.createdByUser),
		createdByDataEncoderId: typeof value.createdByDataEncoderId === "string" || typeof value.createdByDataEncoderId === "number" ? value.createdByDataEncoderId : null,
		createdByDataEncoder: normalizeUserSummary(value.createdByDataEncoder),
		routeCategory: typeof value.routeCategory === "string" ? value.routeCategory : null,
		declaredValue: typeof value.declaredValue === "number" ? value.declaredValue : null,
		taxCategory: typeof value.taxCategory === "string" ? value.taxCategory : null,
		countryOfOrigin: typeof value.countryOfOrigin === "string" ? value.countryOfOrigin : null,
		riskLevel: typeof value.riskLevel === "string" || typeof value.riskLevel === "number" ? value.riskLevel : null,
		assignedCaseExecutorId: typeof value.assignedCaseExecutorId === "string" || typeof value.assignedCaseExecutorId === "number" ? value.assignedCaseExecutorId : null,
		assignedCaseExecutor: normalizeUserSummary(value.assignedCaseExecutor),
		assignedAssessorId: typeof value.assignedAssessorId === "string" || typeof value.assignedAssessorId === "number" ? value.assignedAssessorId : null,
		assignedAssessor: normalizeUserSummary(value.assignedAssessor),
		origin: typeof value.origin === "string" ? value.origin : null,
		destination: typeof value.destination === "string" ? value.destination : null,
		createAt: typeof value.createAt === "string" ? value.createAt : null,
		updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
		recordStatus: typeof value.recordStatus === "number" ? value.recordStatus : null,
	};
};

const normalizeUserMessage = (value: unknown): UserMessage | null => {
	if (!isRecord(value)) return null;

	const subject = sanitizeTextValue(typeof value.subject === "string" ? value.subject : null);
	const content = sanitizeTextValue(typeof value.messageText === "string" ? value.messageText : null)
		?? sanitizeTextValue(typeof value.content === "string" ? value.content : null);
	const messageText = subject ?? content;

	if (
		(typeof value.title === "string" && isExceptionLikeLabel(value.title))
		|| (typeof value.message === "string" && isExceptionLikeLabel(value.message))
		|| (typeof value.exception === "string" && isExceptionLikeLabel(value.exception))
		|| (value.error === true && !messageText)
	) {
		return null;
	}

	const senderUserId = typeof value.senderUserId === "string" || typeof value.senderUserId === "number"
		? value.senderUserId
		: typeof value.senderId === "string" || typeof value.senderId === "number"
			? value.senderId
			: null;
	const recipientUserId = typeof value.recipientUserId === "string" || typeof value.recipientUserId === "number"
		? value.recipientUserId
		: typeof value.receiverId === "string" || typeof value.receiverId === "number"
			? value.receiverId
			: null;

	if (!messageText && !senderUserId && !recipientUserId && !value.serviceId && !value.id) {
		return null;
	}

	return {
		id: typeof value.id === "string" || typeof value.id === "number" ? value.id : undefined,
		subject,
		content,
		messageType: typeof value.messageType === "number" ? value.messageType : null,
		isRead: readFlag(value.isRead),
		readAt: typeof value.readAt === "string" ? value.readAt : null,
		isUrgent: readFlag(value.isUrgent),
		priority: typeof value.priority === "string" || typeof value.priority === "number" ? value.priority : null,
		createdDate: typeof value.createdDate === "string" ? value.createdDate : null,
		serviceId: typeof value.serviceId === "string" || typeof value.serviceId === "number" ? value.serviceId : null,
		senderId: typeof value.senderId === "string" || typeof value.senderId === "number" ? value.senderId : null,
		senderUserId,
		receiverId: typeof value.receiverId === "string" || typeof value.receiverId === "number" ? value.receiverId : null,
		recipientUserId,
		serviceStageId: typeof value.serviceStageId === "string" || typeof value.serviceStageId === "number" ? value.serviceStageId : null,
		service: normalizeServiceSummary(value.service),
		senderUser: normalizeUserSummary(value.senderUser),
		recipientUser: normalizeUserSummary(value.recipientUser),
		createAt: typeof value.createAt === "string" ? value.createAt : null,
		updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : null,
		recordStatus: typeof value.recordStatus === "number" ? value.recordStatus : null,
	};
};

export const useMessagingStore = create<MessageState>((set) => ({
	userMessages: [],
	serviceMessages: [],
	unreadMessages: [],
	unreadCount: 0,
	selectedMessage: null,
	loading: false,
	error: null,

	fetchUserMessages: async () => {
		set({ loading: true, error: null });

		try {
			const response = await getUserMessages();
			const userMessages = getMessageList(response)
				.map(normalizeUserMessage)
				.filter((message): message is UserMessage => message !== null);
			set({ userMessages, loading: false, error: null });
			return userMessages;
		} catch (error: unknown) {
			const message = getMessagingErrorMessage(error, "Failed to load messages.");
			set({ userMessages: [], loading: false, error: message });
			return [];
		}
	},

	fetchServiceMessages: async (serviceId) => {
		set({ loading: true, error: null });

		try {
			const response = await getServiceMessagesRequest(serviceId);
			const serviceMessages = getMessageList(response)
				.map(normalizeUserMessage)
				.filter((message): message is UserMessage => message !== null);
			set({ serviceMessages, loading: false, error: null });
			return serviceMessages;
		} catch (error: unknown) {
			const message = getMessagingErrorMessage(error, "Failed to load service messages.");
			set({ serviceMessages: [], loading: false, error: message });
			return [];
		}
	},

		fetchUnreadMessages: async () => {
			set({ loading: true, error: null });

			try {
				const response = await getUnreadMessages();
				const unreadMessages = getMessageList(response)
					.map(normalizeUserMessage)
					.filter((message): message is UserMessage => message !== null);
				set({ unreadMessages, loading: false, error: null });
				return unreadMessages;
			} catch (error: unknown) {
				const message = getMessagingErrorMessage(error, "Failed to load unread messages.");
				set({ unreadMessages: [], loading: false, error: message });
				return [];
			}
		},

	fetchUnreadCount: async () => {
		set({ loading: true, error: null });

		try {
			const response = await getUnreadCountRequest();
			const payload = unwrapMessageData(response);
			if (!isRecord(payload) || typeof payload.unreadCount !== "number" || !Number.isFinite(payload.unreadCount)) {
				throw new Error("No unread count returned from the API.");
			}

			set({ unreadCount: payload.unreadCount, loading: false, error: null });
			return payload.unreadCount;
		} catch (error: unknown) {
			const message = getMessagingErrorMessage(error, "Failed to load unread message count.");
			set({ loading: false, error: message });
			return 0;
		}
	},

	fetchMessageById: async (id) => {
		set({ loading: true, error: null });

		try {
			const response = await getMessageById(id);
			const payload = unwrapMessageData(response);
			const selectedMessage = normalizeUserMessage(payload);
			if (!selectedMessage) throw new Error("No message details returned from the API.");

			set({ selectedMessage, loading: false, error: null });
			return selectedMessage;
		} catch (error: unknown) {
			const originalMessage = getMessagingErrorMessage(error, "Failed to load message details.");
			const message = /(?:404 Not Found|Message not found)/i.test(originalMessage)
				? `Message ${id} was not found. Check the message ID and try again.`
				: originalMessage;
			set({ selectedMessage: null, loading: false, error: message });
			return null;
		}
	},

	markMessageAsRead: async (id) => {
		set({ loading: true, error: null });

		try {
			await markMessageAsReadRequest(id);
			set((state) => ({
				userMessages: state.userMessages.map((message) =>
					String(message.id) === String(id) ? { ...message, isRead: true } : message,
				),
				unreadMessages: state.unreadMessages.filter((message) => String(message.id) !== String(id)),
				selectedMessage: state.selectedMessage && String(state.selectedMessage.id) === String(id)
					? { ...state.selectedMessage, isRead: true }
					: state.selectedMessage,
				loading: false,
				error: null,
			}));
			return true;
		} catch (error: unknown) {
			const message = getMessagingErrorMessage(error, "Failed to mark message as read.");
			set({ loading: false, error: message });
			return false;
		}
	},

	sendMessage: async (payload) => {
		set({ loading: true, error: null });

		try {
			const response = await sendMessageRequest(payload);
			const result = unwrapMessageData(response);
			if (!isRecord(result) || typeof result.message !== "string" || typeof result.messageId !== "number") {
				throw new Error("No send confirmation returned from the API.");
			}

			const sendResult: SendMessageResult = {
				message: result.message,
				messageId: result.messageId,
			};
			set({ loading: false, error: null });
			return sendResult;
		} catch (error: unknown) {
			const originalMessage = getMessagingErrorMessage(error, "Failed to send message.");
			const message = /(?:404 Not Found|not found)/i.test(originalMessage)
				? "The service or recipient could not be found. Check both IDs and try again."
				: /An error occurred while processing your request/i.test(originalMessage)
					? "The API could not send this message. Check that the service and recipient IDs are valid and that you are not messaging yourself."
					: originalMessage;
			set({ loading: false, error: message });
			return null;
		}
	},
}));
