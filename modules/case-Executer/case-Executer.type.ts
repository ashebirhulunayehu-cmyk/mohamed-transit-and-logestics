export type CaseExecutorServiceRecord = Record<string, unknown>;

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
	assignedService: CaseExecutorServiceRecord | null;
	assignedServiceId: string | number | null;
	assignedServiceLoading: boolean;
	assignedServiceError: string | null;
	fetchDashboard: () => Promise<void>;
	fetchAssignedServiceById: (id: string | number) => Promise<void>;
}
