export interface EncoderServiceDraft {
	id: string;
	type: "Service";
	createdAt: string;
	updatedAt: string;
	customerId: string;
	serviceType: string;
	routeCategory: string;
	itemDescription: string;
	countryOfOrigin: string;
	declaredValue: string;
	taxCategory: string;
	notes?: string;
}

const STORAGE_KEY = "mame-transit-encoder-service-drafts";

const isServiceDraft = (value: unknown): value is EncoderServiceDraft => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.id === "string" &&
		record.type === "Service" &&
		typeof record.createdAt === "string" &&
		typeof record.updatedAt === "string" &&
		typeof record.customerId === "string" &&
		typeof record.serviceType === "string" &&
		typeof record.routeCategory === "string" &&
		typeof record.itemDescription === "string" &&
		typeof record.countryOfOrigin === "string" &&
		typeof record.declaredValue === "string" &&
		typeof record.taxCategory === "string" &&
		(record.notes === undefined || typeof record.notes === "string")
	);
};

export const getEncoderServiceDrafts = (): EncoderServiceDraft[] => {
	const stored = window.localStorage.getItem(STORAGE_KEY);
	if (!stored) return [];

	const parsed: unknown = JSON.parse(stored);
	if (!Array.isArray(parsed) || !parsed.every(isServiceDraft)) {
		throw new Error("Saved drafts are invalid. Clear the damaged draft data and try again.");
	}
	return parsed;
};

export const saveEncoderServiceDraft = (
	draft: EncoderServiceDraft,
): void => {
	const drafts = getEncoderServiceDrafts();
	const existingIndex = drafts.findIndex((item) => item.id === draft.id);
	if (existingIndex === -1) {
		drafts.unshift(draft);
	} else {
		drafts[existingIndex] = draft;
	}
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
};

export const deleteEncoderServiceDraft = (id: string): void => {
	const drafts = getEncoderServiceDrafts().filter((draft) => draft.id !== id);
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
};

export const getEncoderServiceDraft = (
	id: string,
): EncoderServiceDraft | undefined =>
	getEncoderServiceDrafts().find((draft) => draft.id === id);
