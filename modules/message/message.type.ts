export interface MessageUserSummary {
	id?: string | number;
	userId?: string | number | null;
	username?: string | null;
	email?: string | null;
	firstName?: string | null;
	lastName?: string | null;
	profilePhoto?: string | null;
	phone?: string | null;
}

export interface MessageImporterSummary extends MessageUserSummary {
	user?: MessageUserSummary | null;
}

export interface MessageServiceSummary {
	id?: string | number;
	trackingNumber?: string | null;
	importerId?: string | number | null;
	importer?: MessageImporterSummary | null;
	description?: string | null;
	mode?: number | null;
	assignedHub?: string | number | null;
	status?: string | number | null;
	createdByUserId?: string | number | null;
	createdByUser?: MessageUserSummary | null;
	createdByDataEncoderId?: string | number | null;
	createdByDataEncoder?: MessageUserSummary | null;
	routeCategory?: string | null;
	declaredValue?: number | null;
	taxCategory?: string | null;
	countryOfOrigin?: string | null;
	riskLevel?: string | number | null;
	assignedCaseExecutorId?: string | number | null;
	assignedCaseExecutor?: MessageUserSummary | null;
	assignedAssessorId?: string | number | null;
	assignedAssessor?: MessageUserSummary | null;
	origin?: string | null;
	destination?: string | null;
	createAt?: string | null;
	updatedAt?: string | null;
	recordStatus?: number | null;
}

export interface UserMessage {
	id?: string | number;
	subject?: string | null;
	content?: string | null;
	messageType?: number | null;
	isRead?: boolean;
	readAt?: string | null;
	isUrgent?: boolean;
	priority?: string | number | null;
	createdDate?: string | null;
	serviceId?: string | number | null;
	senderId?: string | number | null;
	senderUserId?: string | number | null;
	receiverId?: string | number | null;
	recipientUserId?: string | number | null;
	serviceStageId?: string | number | null;
	service?: MessageServiceSummary | null;
	senderUser?: MessageUserSummary | null;
	recipientUser?: MessageUserSummary | null;
	createAt?: string | null;
	updatedAt?: string | null;
	recordStatus?: number | null;
}

export interface MessageDirectoryUser {
	id: string | number;
	displayName: string;
	roleNames: string[];
}

export interface SendMessageRequest {
	shipmentId?: string | number;
	serviceId?: string | number;
	recipientId?: string | number;
	recipientUserId?: string | number;
	content: string;
	subject: string;
	type?: number;
}

export interface SendMessageResult {
	message: string;
	messageId: number;
}

export interface UnreadCountResult {
	unreadCount: number;
}
