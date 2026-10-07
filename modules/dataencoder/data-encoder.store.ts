import { create } from "zustand";
import { DataEncoderEndpoints } from "./data-encoder.endpoint";
import { getEncoderServiceDrafts } from "./data-encoder.drafts";
import type {
	DataEncoderApiEnvelope,
	DataEncoderDashboardSummary,
	DataEncoderRecentCustomer,
	DataEncoderRecentService,
} from "./data-encoder.type";

interface DataEncoderState {
	dashboardData: DataEncoderDashboardSummary;
	unavailableMetrics: DataEncoderDashboardMetric[];
	loading: boolean;
	error: string | null;
	fetchDashboard: () => Promise<void>;
}

export type DataEncoderDashboardMetric =
	| "totalCustomersCreated"
	| "pendingCustomerApprovals"
	| "totalServicesCreated"
	| "pendingServiceApprovals"
	| "draftServices";

const DASHBOARD_METRICS: DataEncoderDashboardMetric[] = [
	"totalCustomersCreated",
	"pendingCustomerApprovals",
	"totalServicesCreated",
	"pendingServiceApprovals",
	"draftServices",
];

const EMPTY_DASHBOARD: DataEncoderDashboardSummary = {
	totalCustomersCreated: 0,
	pendingCustomerApprovals: 0,
	totalServicesCreated: 0,
	pendingServiceApprovals: 0,
	draftServices: 0,
	recentCustomers: [],
	recentServices: [],
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeKey = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const metricAliases: Record<DataEncoderDashboardMetric, string[]> = {
	totalCustomersCreated: [
		"totalCustomersCreated", "customersCreated", "totalCustomers", "totalCustomerCount",
		"customerCount", "customerTotal", "registeredCustomers", "totalCustomerRegistrations",
		"totalCustomer", "customerRecordsCount", "customersTotal",
	],
	pendingCustomerApprovals: [
		"pendingCustomerApprovals", "pendingCustomers", "customersPendingApproval",
		"pendingCustomerCount", "customerApprovalsPending", "customersAwaitingApproval",
		"pendingCustomerApprovalCount", "customersPending", "unverifiedCustomers",
	],
	totalServicesCreated: [
		"totalServicesCreated", "servicesCreated", "totalServices", "totalServiceCount",
		"serviceCount", "serviceTotal", "submittedServices", "totalService",
		"serviceRecordsCount", "servicesTotal",
	],
	pendingServiceApprovals: [
		"pendingServiceApprovals", "pendingServices", "servicesPendingApproval",
		"pendingServiceCount", "serviceApprovalsPending", "servicesAwaitingApproval",
		"pendingServiceApprovalCount", "servicesPending", "servicesAwaitingReview",
	],
	draftServices: [
		"draftServices", "totalDraftServices", "draftServiceCount", "serviceDrafts",
		"draftCount", "savedServiceDrafts", "unsubmittedServices", "unsubmittedServiceCount",
	],
};

const findValue = (record: Record<string, unknown>, aliases: string[]): unknown => {
	const normalizedAliases = new Set(aliases.map(normalizeKey));
	const key = Object.keys(record).find((candidate) => normalizedAliases.has(normalizeKey(candidate)));
	return key ? record[key] : undefined;
};

const hasMetric = (record: Record<string, unknown>): boolean =>
	Object.values(metricAliases).some((aliases) => findValue(record, aliases) !== undefined);

const findDashboardRecord = (value: unknown): Record<string, unknown> | null => {
	let current = value;
	for (let depth = 0; depth < 8; depth += 1) {
		if (!isRecord(current)) return null;
		if (hasMetric(current)) return current;
		const nextKey = Object.keys(current).find((key) =>
			[
				"data", "payload", "response", "result", "dashboard", "dashboardData",
				"dashboardSummary", "summary", "statistics", "stats", "counts",
			].includes(normalizeKey(key)),
		);
		if (!nextKey) return current;
		current = current[nextKey];
	}
	return isRecord(current) ? current : null;
};

const normalizeCount = (value: unknown): number | undefined => {
	const candidate = isRecord(value)
		? findValue(value, ["count", "total", "value"])
		: value;
	if (typeof candidate !== "number" && typeof candidate !== "string") return undefined;
	if (typeof candidate === "string" && !candidate.trim()) return undefined;
	const count = Number(candidate);
	return Number.isFinite(count) && count >= 0 ? Math.floor(count) : undefined;
};

const readArray = <T>(record: Record<string, unknown>, aliases: string[]): T[] => {
	const value = findValue(record, aliases);
	return Array.isArray(value) ? value.filter(isRecord) as T[] : [];
};

const normalizeDashboard = (
	value: unknown,
): { dashboardData: DataEncoderDashboardSummary; unavailableMetrics: DataEncoderDashboardMetric[] } => {
	const record = findDashboardRecord(value);
	if (!record) throw new Error("The Data Encoder dashboard endpoint returned an invalid response.");

	const counts = Object.fromEntries(
		DASHBOARD_METRICS.map((metric) => [metric, normalizeCount(findValue(record, metricAliases[metric]))]),
	) as Record<DataEncoderDashboardMetric, number | undefined>;
	const unavailableMetrics = DASHBOARD_METRICS.filter((metric) => counts[metric] === undefined);
	const dashboardData: DataEncoderDashboardSummary = {
		totalCustomersCreated: counts.totalCustomersCreated ?? 0,
		pendingCustomerApprovals: counts.pendingCustomerApprovals ?? 0,
		totalServicesCreated: counts.totalServicesCreated ?? 0,
		pendingServiceApprovals: counts.pendingServiceApprovals ?? 0,
		draftServices: counts.draftServices ?? 0,
		recentCustomers: readArray<DataEncoderRecentCustomer>(record, ["recentCustomers", "latestCustomers"]),
		recentServices: readArray<DataEncoderRecentService>(record, ["recentServices", "latestServices"]),
	};

	return { dashboardData, unavailableMetrics };
};

const unwrapRecords = (value: unknown, listKeys: string[]): Record<string, unknown>[] => {
	let current = value;
	const normalizedListKeys = new Set(listKeys.map(normalizeKey));
	for (let depth = 0; depth < 8; depth += 1) {
		if (Array.isArray(current)) {
			if (!current.every(isRecord)) {
				throw new Error("A Data Encoder record endpoint returned an invalid list.");
			}
			return current;
		}
		if (!isRecord(current)) break;

		const listKey = Object.keys(current).find((key) => normalizedListKeys.has(normalizeKey(key)));
		const envelopeKey = Object.keys(current).find((key) =>
			["data", "payload", "response", "result"].includes(normalizeKey(key)),
		);
		const nextKey = listKey ?? envelopeKey;
		if (!nextKey) break;
		current = current[nextKey];
	}
	throw new Error("A Data Encoder endpoint did not return a record list.");
};

const readText = (record: Record<string, unknown>, aliases: string[]): string => {
	const value = findValue(record, aliases);
	return typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
};

const readIdentifier = (record: Record<string, unknown>, aliases: string[]): string | number | undefined => {
	const value = findValue(record, aliases);
	return typeof value === "string" || typeof value === "number" ? value : undefined;
};

const readStatus = (record: Record<string, unknown>): string | number | null => {
	const value = findValue(record, ["status", "serviceStatus", "approvalStatus"]);
	return typeof value === "string" || typeof value === "number" ? value : null;
};

const readRelatedName = (value: unknown): string => {
	if (!isRecord(value)) return typeof value === "string" ? value.trim() : "";
	return readText(value, ["businessName", "companyName", "importerName", "fullName", "name"]);
};

const normalizeRecentService = (record: Record<string, unknown>): DataEncoderRecentService => {
	const importer = findValue(record, ["importer", "customer"]);
	const serviceDate = readText(record, [
		"updatedAt",
		"lastUpdateDate",
		"modifiedDate",
		"createAt",
		"createdAt",
		"createdDate",
	]);
	const description = readText(record, [
		"description",
		"itemDescription",
		"serviceDescription",
		"goodsDescription",
	]);
	const importerName =
		readText(record, ["importerName", "customerName", "businessName", "companyName"]) ||
		readRelatedName(importer);

	return {
		...record,
		id: readIdentifier(record, ["id", "serviceId"]),
		trackingNumber: readText(record, ["trackingNumber", "serviceNumber", "referenceNumber"]),
		serviceNumber: readText(record, ["serviceNumber", "trackingNumber", "referenceNumber"]),
		description,
		itemDescription: description,
		importerName,
		importer,
		status: readStatus(record),
		updatedAt: serviceDate,
		createdDate: readText(record, ["createdDate", "createdAt", "createAt"]),
		createAt: readText(record, ["createAt", "createdAt", "createdDate"]),
	};
};

const normalizeRecentCustomer = (record: Record<string, unknown>): DataEncoderRecentCustomer => ({
	...record,
	id: readIdentifier(record, ["id", "customerId"]),
	name: readText(record, ["name", "businessName", "companyName"]),
	businessName: readText(record, ["businessName", "companyName", "name"]),
	email: readText(record, ["email", "contactEmail"]),
	registeredDate: readText(record, ["registeredDate", "registrationDate", "createdAt", "createAt"]),
	createdDate: readText(record, ["createdDate", "createdAt", "createAt"]),
	createAt: readText(record, ["createAt", "createdAt", "createdDate"]),
});

const getRecordTimestamp = (record: Record<string, unknown>): number => {
	const value = readText(record, ["updatedAt", "lastUpdateDate", "modifiedDate", "createAt", "createdAt", "createdDate"]);
	const timestamp = value ? Date.parse(value) : 0;
	return Number.isNaN(timestamp) ? 0 : timestamp;
};

const isPendingCustomer = (record: Record<string, unknown>): boolean => {
	const status = readText(record, ["approvalStatus", "verificationStatus", "approvalState", "status", "recordStatus"]).toLowerCase();
	if (status.includes("pending") || status.includes("unverified") || status.includes("awaiting")) return true;
	const verified = findValue(record, ["isVerified", "verified", "isApproved", "approved"]);
	return verified === false || verified === 0 ||
		(typeof verified === "string" && ["0", "false", "no"].includes(verified.trim().toLowerCase()));
};

const isPendingService = (record: Record<string, unknown>): boolean => {
	const statuses = [
		"approvalStatus",
		"serviceStatus",
		"status",
		"reviewStatus",
		"submissionStatus",
	].map((field) => readText(record, [field]).toLowerCase()).filter(Boolean);

	if (statuses.some((status) =>
		status.includes("approved") ||
		status.includes("reject") ||
		status.includes("complete") ||
		status.includes("closed"),
	)) {
		return false;
	}

	if (statuses.some((status) =>
		status.includes("pending") ||
		status.includes("awaiting") ||
		status.includes("review") ||
		status.includes("submitted"),
	)) return true;

	const numericStatus = Number(statuses.find((status) => /^\d+$/.test(status)) ?? NaN);
	return numericStatus === 1 || numericStatus === 3;
};

const applyRecordFallbacks = async (
	dashboardData: DataEncoderDashboardSummary,
	unavailableMetrics: DataEncoderDashboardMetric[],
): Promise<{
	dashboardData: DataEncoderDashboardSummary;
	unavailableMetrics: DataEncoderDashboardMetric[];
	fallbackErrors: string[];
}> => {
	const nextData = { ...dashboardData };
	const missing = new Set(unavailableMetrics);
	const fallbackErrors: string[] = [];
	const needsCustomers =
		missing.has("totalCustomersCreated") ||
		missing.has("pendingCustomerApprovals") ||
		nextData.recentCustomers.length === 0;
	const [customerResult, serviceResult] = await Promise.all([
		needsCustomers
			? DataEncoderEndpoints.getAllCustomers("1").then((value) => ({ value })).catch((error: unknown) => ({ error }))
			: Promise.resolve(null),
		DataEncoderEndpoints.getServices().then((value) => ({ value })).catch((error: unknown) => ({ error })),
	]);

	if (customerResult && "value" in customerResult) {
		try {
			const customers = unwrapRecords(customerResult.value, ["items", "customers", "records", "rows"]);
			if (missing.has("totalCustomersCreated")) {
				nextData.totalCustomersCreated = customers.length;
				missing.delete("totalCustomersCreated");
			}
			if (missing.has("pendingCustomerApprovals")) {
				nextData.pendingCustomerApprovals = customers.filter(isPendingCustomer).length;
				missing.delete("pendingCustomerApprovals");
			}
			if (nextData.recentCustomers.length === 0) {
				nextData.recentCustomers = [...customers]
					.sort((left, right) => getRecordTimestamp(right) - getRecordTimestamp(left))
					.slice(0, 5)
					.map(normalizeRecentCustomer);
			}
		} catch (error: unknown) {
			fallbackErrors.push(error instanceof Error ? error.message : "Unable to read customer records.");
		}
	} else if (customerResult && "error" in customerResult) {
		fallbackErrors.push(customerResult.error instanceof Error ? customerResult.error.message : "Unable to load customer records.");
	}

	if (serviceResult && "value" in serviceResult) {
		try {
			const services = unwrapRecords(serviceResult.value, ["items", "services", "records", "servicelist", "rows"]);
			nextData.totalServicesCreated = services.length;
			nextData.pendingServiceApprovals = services.filter(isPendingService).length;
			if (nextData.recentServices.length === 0) {
				nextData.recentServices = [...services]
					.sort((left, right) => getRecordTimestamp(right) - getRecordTimestamp(left))
					.slice(0, 5)
					.map(normalizeRecentService);
			}
			missing.delete("totalServicesCreated");
			missing.delete("pendingServiceApprovals");
		} catch (error: unknown) {
			fallbackErrors.push(error instanceof Error ? error.message : "Unable to read service records.");
		}
	} else if (serviceResult && "error" in serviceResult) {
		fallbackErrors.push(serviceResult.error instanceof Error ? serviceResult.error.message : "Unable to load service records.");
	}

	if (typeof window !== "undefined") {
		try {
			nextData.draftServices = getEncoderServiceDrafts().length;
			missing.delete("draftServices");
		} catch (error: unknown) {
			fallbackErrors.push(error instanceof Error ? error.message : "Unable to read saved service drafts.");
		}
	}

	return { dashboardData: nextData, unavailableMetrics: [...missing], fallbackErrors };
};

export const useDataEncoderStore = create<DataEncoderState>((set) => ({
	dashboardData: EMPTY_DASHBOARD,
	unavailableMetrics: DASHBOARD_METRICS,
	loading: false,
	error: null,

	fetchDashboard: async () => {
		set({ loading: true, error: null });

		try {
			const response = (await DataEncoderEndpoints.getDashboard()) as
				| DataEncoderApiEnvelope<DataEncoderDashboardSummary>
				| unknown;
			const normalized = normalizeDashboard(response);
			const fallback = await applyRecordFallbacks(
				normalized.dashboardData,
				normalized.unavailableMetrics,
			);
			const missingMessage = fallback.unavailableMetrics.length
				? `Unavailable metrics: ${fallback.unavailableMetrics.map((metric) => metric.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}.`
				: null;
			const error = [missingMessage, ...fallback.fallbackErrors].filter(Boolean).join(" ");
			set({
				dashboardData: fallback.dashboardData,
				unavailableMetrics: fallback.unavailableMetrics,
				loading: false,
				error: error || null,
			});
		} catch (error: unknown) {
			const message = typeof error === "string"
				? error
				: error instanceof Error
					? error.message
					: "Failed to load dashboard.";
			try {
				const fallback = await applyRecordFallbacks(EMPTY_DASHBOARD, DASHBOARD_METRICS);
				const missingMessage = fallback.unavailableMetrics.length
					? `Unavailable metrics: ${fallback.unavailableMetrics.map((metric) => metric.replace(/([A-Z])/g, " $1").toLowerCase()).join(", ")}.`
					: null;
				set({
					dashboardData: fallback.dashboardData,
					unavailableMetrics: fallback.unavailableMetrics,
					loading: false,
					error: [message, missingMessage, ...fallback.fallbackErrors].filter(Boolean).join(" "),
				});
				return;
			} catch (fallbackError: unknown) {
				const fallbackMessage = fallbackError instanceof Error
					? fallbackError.message
					: "Unable to load Data Encoder records.";
				set({
					dashboardData: EMPTY_DASHBOARD,
					unavailableMetrics: DASHBOARD_METRICS,
					loading: false,
					error: `${message} ${fallbackMessage}`,
				});
				return;
			}
		}
	},
}));
