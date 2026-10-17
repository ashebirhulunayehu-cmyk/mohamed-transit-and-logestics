import { create } from "zustand";
import { CaseExecutorEndpoints } from "./case-executor.endpoint";
import type {
	CaseExecutorDashboard,
	CaseExecutorServiceRecord,
	CaseExecutorState,
} from "./case-Executer.type";

const isRecord = (value: unknown): value is CaseExecutorServiceRecord =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeDashboard = (value: unknown): CaseExecutorDashboard | null => {
	if (Array.isArray(value) || !isRecord(value)) return null;

	for (const key of ["response", "data", "payload"]) {
		if (value[key] !== undefined && value[key] !== null) {
			const nested = normalizeDashboard(value[key]);
			if (nested) return nested;
		}
	}

	const fields = [
		"assignedServices",
		"pendingServices",
		"completedServices",
		"blockedStages",
		"todaysTasks",
		"urgentNotifications",
	];
	if (!fields.some((key) => key in value)) return null;

	const count = (candidate: unknown): number => {
		const parsed = Number(candidate ?? 0);
		return Number.isFinite(parsed) ? parsed : 0;
	};

	return {
		assignedServices: count(value.assignedServices),
		pendingServices: count(value.pendingServices),
		completedServices: count(value.completedServices),
		blockedStages: count(value.blockedStages),
		todaysTasks: Array.isArray(value.todaysTasks) ? value.todaysTasks : [],
		urgentNotifications: Array.isArray(value.urgentNotifications)
			? value.urgentNotifications
			: [],
	};
};

const normalizeService = (value: unknown): CaseExecutorServiceRecord | null => {
	if (Array.isArray(value)) return normalizeService(value[0]);
	if (!isRecord(value)) return null;

	for (const key of ["assignedService", "service", "data", "payload", "response"]) {
		if (key in value && value[key] !== undefined && value[key] !== null) {
			const nested = normalizeService(value[key]);
			if (nested) return nested;
		}
	}

	return value;
};

const normalizeServices = (value: unknown): CaseExecutorServiceRecord[] | null => {
	if (Array.isArray(value)) {
		return value.flatMap((item) => {
			const service = normalizeService(item);
			return service ? [service] : [];
		});
	}
	if (!isRecord(value)) return null;

	for (const key of ["response", "data", "payload", "services", "assignedServices"]) {
		if (key in value && value[key] !== undefined && value[key] !== null) {
			const nested = normalizeServices(value[key]);
			if (nested) return nested;
		}
	}
	return null;
};

const getErrorMessage = (error: unknown, fallback: string): string =>
	typeof error === "string"
		? error
		: error instanceof Error
			? error.message
			: fallback;

export const useCaseExecutorStore = create<CaseExecutorState>((set, get) => ({
	dashboard: null,
	dashboardLoading: true,
	dashboardError: null,
	assignedServices: [],
	assignedServicesLoading: true,
	assignedServicesError: null,
	assignedService: null,
	assignedServiceId: null,
	assignedServiceLoading: false,
	assignedServiceError: null,

	fetchDashboard: async () => {
		set({ dashboardLoading: true, dashboardError: null });
		try {
			const dashboard = normalizeDashboard(await CaseExecutorEndpoints.getDashboard());
			if (!dashboard) throw new Error("Dashboard data was not returned by the API.");
			set({ dashboard, dashboardLoading: false, dashboardError: null });
		} catch (error: unknown) {
			set({
				dashboard: null,
				dashboardLoading: false,
				dashboardError: getErrorMessage(error, "Unable to load Case Executor dashboard."),
			});
		}
	},

	fetchAssignedServices: async () => {
		set({ assignedServicesLoading: true, assignedServicesError: null });
		try {
			const assignedServices = normalizeServices(
				await CaseExecutorEndpoints.getAssignedServices(),
			);
			if (!assignedServices) {
				throw new Error("Assigned services were not returned in the expected format.");
			}
			set({ assignedServices, assignedServicesLoading: false, assignedServicesError: null });
		} catch (error: unknown) {
			set({
				assignedServices: [],
				assignedServicesLoading: false,
				assignedServicesError: getErrorMessage(
					error,
					"Unable to load assigned services.",
				),
			});
		}
	},

	fetchAssignedServiceById: async (id) => {
		set({
			assignedService: null,
			assignedServiceId: id,
			assignedServiceLoading: true,
			assignedServiceError: null,
		});
		try {
			const assignedService = normalizeService(
				await CaseExecutorEndpoints.getAssignedServiceById(id),
			);
			if (!assignedService) throw new Error("No service details were returned.");
			if (String(get().assignedServiceId) === String(id)) {
				set({ assignedService, assignedServiceLoading: false, assignedServiceError: null });
			}
		} catch (error: unknown) {
			if (String(get().assignedServiceId) === String(id)) {
				set({
					assignedService: null,
					assignedServiceLoading: false,
					assignedServiceError: getErrorMessage(error, "Unable to load assigned service."),
				});
			}
		}
	},
}));
