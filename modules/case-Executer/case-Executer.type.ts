export type CaseExecutorServiceRecord = Record<string, unknown>;

export interface CaseExecutorStageCommentRequest {
	shipmentId: number;
	stageId: number;
	comment: string;
	commentType?: string | null;
	isInternal?: boolean;
	isVisibleToCustomer?: boolean;
}

export interface CaseExecutorRiskLevelRequest {
	shipmentId: number;
	riskLevel: number;
	riskNotes?: string | null;
}

export interface CaseExecutorBlockStageRequest {
	shipmentId: number;
	stageId: number;
	reason: string;
}

export interface CaseExecutorStageStatusRequest {
	shipmentId: number;
	stageId: number;
	status: number;
	notes?: string | null;
}

export interface CaseExecutorShipmentUpdateRequest {
	id: number;
	itemDescription: string;
	routeCategory: string;
	declaredValue: number;
	taxCategory: string;
	countryOfOrigin: string;
	riskLevel: number | null;
}

export interface CaseExecutorShipmentStatusRequest {
	newStatus: number;
	updatedByHub: number;
	remarks?: string | null;
}

export interface CaseExecutorDashboard {
	assignedServices: number;
	pendingServices: number;
	completedServices: number;
	blockedStages: number;
	todaysTasks: unknown[];
	urgentNotifications: unknown[];
}

export interface CaseExecutorState {
	dashboard: CaseExecutorDashboard | null;
	dashboardLoading: boolean;
	dashboardError: string | null;
	assignedServices: CaseExecutorServiceRecord[];
	assignedServicesLoading: boolean;
	assignedServicesError: string | null;
	assignedService: CaseExecutorServiceRecord | null;
	assignedServiceId: string | number | null;
	assignedServiceLoading: boolean;
	assignedServiceError: string | null;
	fetchDashboard: () => Promise<void>;
	fetchAssignedServices: () => Promise<void>;
	fetchAssignedServiceById: (id: string | number) => Promise<void>;
}
