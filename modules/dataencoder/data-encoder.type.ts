export interface DataEncoderRecentCustomer {
	id?: number | string;
	name?: string | null;
	businessName?: string | null;
	email?: string | null;
	registeredDate?: string | null;
	createdDate?: string | null;
	createAt?: string | null;
	[key: string]: unknown;
}

export interface DataEncoderRecentService {
	id?: number | string;
	trackingNumber?: string | null;
	serviceNumber?: string | null;
	description?: string | null;
	itemDescription?: string | null;
	importerName?: string | null;
	importer?: unknown;
	origin?: string | null;
	destination?: string | null;
	status?: string | number | null;
	createdDate?: string | null;
	createAt?: string | null;
	updatedAt?: string | null;
	[key: string]: unknown;
}

export interface DataEncoderDashboardSummary {
	totalCustomersCreated: number;
	pendingCustomerApprovals: number;
	totalServicesCreated: number;
	pendingServiceApprovals: number;
	draftServices: number;
	recentCustomers: DataEncoderRecentCustomer[];
	recentServices: DataEncoderRecentService[];
}

export interface DataEncoderApiEnvelope<T = unknown> {
	statusCode?: number;
	error?: boolean;
	errors?: unknown[];
	message?: string;
	response?: {
		data?: T;
	} | T;
}
