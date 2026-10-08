"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	type FormEvent,
} from "react";
import { Plus, RefreshCw, Search, X } from "lucide-react";

import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import { DataEncoderEndpoints } from "@/modules/dataencoder/data-encoder.endpoint";
import useAuthStore from "@/modules/auth/auth.store";

type CustomerRow = {
	id: string;
	businessName: string;
	tinNumber: string;
	businessLicense: string;
	businessType: string;
	contactPerson: string;
	contactPhone: string;
	contactEmail: string;
	registeredAt: string;
	activeCases: number | null;
	kycStatus: "Verified" | "Pending" | "Revision";
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (value: unknown): string =>
	typeof value === "string" || typeof value === "number"
		? String(value)
		: "";

const findValue = (
	record: Record<string, unknown>,
	...names: string[]
): unknown => {
	const key = Object.keys(record).find((candidate) =>
		names.some(
			(name) => name.toLowerCase() === candidate.toLowerCase(),
		),
	);

	return key ? record[key] : undefined;
};

const readRelatedValue = (
	value: unknown,
	...names: string[]
): unknown => {
	if (!isRecord(value)) return value;
	return findValue(value, ...names, "id", "customerId", "name", "businessName");
};

const unwrapRows = (
	value: unknown,
	listNames: string[] = ["items", "customers", "records", "rows"],
): Record<string, unknown>[] => {
	let current = value;
	const listKeys = new Set(listNames.map((name) => name.toLowerCase()));

	for (let depth = 0; depth < 6; depth += 1) {
		if (Array.isArray(current)) {
			if (!current.every(isRecord)) {
				throw new Error(
					"The backend returned an invalid customer list.",
				);
			}

			return current;
		}

		if (!isRecord(current)) {
			break;
		}

		const key = Object.keys(current).find((name) =>
			[
				"data",
				"payload",
				"response",
				"items",
				"customers",
				"services",
				"records",
				"result",
				"rows",
				"servicelist",
			].some((candidate) =>
				candidate.toLowerCase() === name.toLowerCase() &&
				(listKeys.has(name.toLowerCase()) ||
					["data", "payload", "response", "result"].includes(name.toLowerCase())),
			),
		);

		if (!key) {
			break;
		}

		current = current[key];
	}

	throw new Error(
		"The backend response did not contain a customer list.",
	);
};

const getResponseError = (
	body: unknown,
	fallback: string,
): string => {
	if (!isRecord(body)) {
		return typeof body === "string" && body.trim()
			? body
			: fallback;
	}

	for (const key of [
		"message",
		"detail",
		"error",
		"title",
	]) {
		const message = body[key];

		if (
			typeof message === "string" &&
			message.trim()
		) {
			return message;
		}
	}

	if (Array.isArray(body.errors)) {
		const messages = body.errors.filter(
			(value): value is string =>
				typeof value === "string" &&
				Boolean(value.trim()),
		);

		if (messages.length > 0) {
			return messages.join("; ");
		}
	}

	return fallback;
};

const readCustomerId = (record: Record<string, unknown>): string =>
	readText(readRelatedValue(
		findValue(record, "customerId", "importerId", "customer", "importer"),
		"id",
		"customerId",
		"businessName",
	)) || readText(findValue(record, "customerId", "importerId"));

const readCustomerName = (record: Record<string, unknown>): string =>
	readText(
		readRelatedValue(
			findValue(record, "customer", "importer"),
			"businessName",
			"companyName",
			"name",
		),
	) || readText(findValue(record, "customerName", "importerName", "businessName"));

const readCustomerTin = (record: Record<string, unknown>): string =>
	readText(
		readRelatedValue(
			findValue(record, "customer", "importer"),
			"tinNumber",
			"tin",
		),
	) || readText(findValue(record, "customerTin", "importerTin", "tinNumber", "tin"));

const getKycStatus = (record: Record<string, unknown>): CustomerRow["kycStatus"] => {
	const status = readText(findValue(
		record,
		"kycStatus",
		"verificationStatus",
		"approvalStatus",
		"approvalState",
		"recordStatus",
		"status",
	)).toLowerCase();
	if (status.includes("revision") || status.includes("rejected") || status.includes("correction")) {
		return "Revision";
	}
	if (status.includes("verified") || status.includes("approved")) {
		return "Verified";
	}

	const verified = findValue(record, "isVerified", "verified", "isApproved", "approved");
	if (verified === true || verified === 1 || verified === "1" ||
		(typeof verified === "string" && verified.toLowerCase() === "true")) {
		return "Verified";
	}
	if (verified === false || verified === 0 || verified === "0" ||
		(typeof verified === "string" && verified.toLowerCase() === "false")) {
		return "Pending";
	}
	return "Pending";
};

const readCaseCount = (record: Record<string, unknown>): number | null => {
	const value = findValue(
		record,
		"activeCases",
		"activeCaseCount",
		"activeServiceCount",
		"serviceCount",
		"caseCount",
		"totalServices",
	);
	if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
		return Math.floor(value);
	}
	if (typeof value === "string" && value.trim()) {
		const count = Number(value);
		if (Number.isFinite(count) && count >= 0) return Math.floor(count);
	}
	return null;
};

const readCategory = (service: Record<string, unknown>): string => {
	const value = findValue(service, "serviceType", "mode", "transportMode");
	if (value === 0 || value === "0") return "Multimodal";
	if (value === 1 || value === "1") return "Unimodal";
	return readText(value);
};

const isActiveService = (service: Record<string, unknown>): boolean => {
	const status = readText(findValue(
		service,
		"status",
		"serviceStatus",
		"approvalStatus",
		"recordStatus",
	)).toLowerCase();
	return !["complete", "closed", "cancel", "reject", "archive"].some((term) =>
		status.includes(term),
	);
};

export default function EncoderCustomersPage() {
	const userId = useAuthStore((state) => state.user?.id);
	const [customers, setCustomers] = useState<CustomerRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [serviceDataError, setServiceDataError] = useState<string | null>(null);

	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const [createOpen, setCreateOpen] = useState(false);
	const [search, setSearch] = useState("");

	const loadCustomers = useCallback(async () => {
		setLoading(true);
		setError(null);
		setServiceDataError(null);

		try {
			const [response, servicesResponse] = await Promise.all([
				DataEncoderEndpoints.getCustomerRegistry("1"),
				fetch("/api/encoder/services", { cache: "no-store" }).catch(() => null),
			]);
			const body: unknown = response.status === 204 ? [] : await response.json();
			if (
				!response.ok ||
				(isRecord(body) &&
					(body.error === true ||
						body.isError === true ||
						(typeof body.statusCode === "number" && body.statusCode >= 400)))
			) {
				throw new Error(getResponseError(body, `Customer list failed (${response.status}).`));
			}

			const rows = unwrapRows(body);
			let services: Record<string, unknown>[] = [];
			let servicesLoaded = false;
			if (servicesResponse) {
				try {
					const servicesBody: unknown =
						servicesResponse.status === 204 ? [] : await servicesResponse.json();
					if (
						!servicesResponse.ok ||
						(isRecord(servicesBody) &&
							(servicesBody.error === true ||
								servicesBody.isError === true ||
								(typeof servicesBody.statusCode === "number" &&
									servicesBody.statusCode >= 400)))
					) {
						throw new Error(
							getResponseError(servicesBody, `Service list failed (${servicesResponse.status}).`),
						);
					}
					services = unwrapRows(servicesBody, ["services", "items", "records", "rows", "serviceList"]);
					servicesLoaded = true;
				} catch (serviceError: unknown) {
					setServiceDataError(
						serviceError instanceof Error
							? serviceError.message
							: "Unable to load service activity for customers.",
					);
				}
			} else {
				setServiceDataError("Unable to reach the service list to load customer case counts.");
			}

			const servicesByCustomer = new Map<string, Record<string, unknown>[]>();
			for (const service of services) {
				const customerId = readCustomerId(service);
				const customerName = readCustomerName(service).toLowerCase();
				const customerTin = readCustomerTin(service).toLowerCase();
				const customerKey = customerId
					? `id:${customerId}`
					: customerTin
						? `tin:${customerTin}`
						: customerName
							? `name:${customerName}`
							: "";
				if (!customerKey) continue;
				const customerServices = servicesByCustomer.get(customerKey) ?? [];
				customerServices.push(service);
				servicesByCustomer.set(customerKey, customerServices);
			}

			setCustomers(
				rows.map((record, index) => {
					const id = readText(findValue(record, "id", "customerId")) || `customer-${index + 1}`;
					const businessName = readText(findValue(record, "businessName", "companyName", "importerName"));
					const tinNumber = readText(findValue(record, "tinNumber", "tin", "taxIdentificationNumber"));
					const servicesForCustomer =
						servicesByCustomer.get(`id:${id}`) ??
						servicesByCustomer.get(`tin:${tinNumber.toLowerCase()}`) ??
						servicesByCustomer.get(`name:${businessName.toLowerCase()}`) ??
						[];
					const explicitCaseCount = readCaseCount(record);
					const verificationNotes = readText(findValue(record, "verificationNotes", "revisionNotes"));

					return {
						id,
						businessName,
						tinNumber,
						businessLicense: readText(findValue(record, "businessLicense", "licenseNumber")),
						businessType: readText(findValue(record, "businessType", "category", "customerCategory")) ||
							readCategory(servicesForCustomer[0] ?? {}),
						contactPerson: readText(findValue(record, "contactPerson", "fullName")),
						contactPhone: readText(findValue(record, "contactPhone", "phone")),
						contactEmail: readText(findValue(record, "contactEmail", "email")),
						registeredAt: readText(findValue(
							record,
							"createdAt",
							"createAt",
							"registeredAt",
							"registrationDate",
							"createdDate",
						)),
						activeCases: explicitCaseCount ??
							(servicesLoaded ? servicesForCustomer.filter(isActiveService).length : null),
						kycStatus: verificationNotes ? "Revision" : getKycStatus(record),
					};
				}),
			);
		} catch (loadError: unknown) {
			setCustomers([]);
			setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * POST
	 * /api/v1/DataEncoder/CreateCustomer
	 */
	const createCustomer = async (
		event: FormEvent<HTMLFormElement>,
	) => {
		event.preventDefault();

		setSubmitError(null);
		setSuccess(null);
		setSubmitting(true);

		const form = event.currentTarget;

		const formData = new FormData(form);

		const payload: Record<string, unknown> =
			Object.fromEntries(formData.entries());
		const numericUserId = Number(userId);
		if (!Number.isSafeInteger(numericUserId) || numericUserId <= 0) {
			setSubmitError("Your authenticated user ID is unavailable. Sign in again, then retry customer creation.");
			setSubmitting(false);
			return;
		}
		payload.userId = String(numericUserId);

		/*
		 * The expiry field is optional.
		 * If the user leaves it empty, send null instead of "".
		 */
		if (
			payload.importLicenseExpiry === "" ||
			payload.importLicenseExpiry === undefined
		) {
			payload.importLicenseExpiry = null;
		}

		try {
			const response = await DataEncoderEndpoints.createCustomer(payload);
			const body: unknown = response.status === 204 ? null : await response.json();
			if (
				!response.ok ||
				(isRecord(body) &&
					(body.error === true ||
						body.isError === true ||
						(typeof body.statusCode === "number" && body.statusCode >= 400)))
			) {
				throw new Error(
					getResponseError(
						body,
						`Customer creation failed (${response.status}).`,
					),
				);
			}

			form.reset();

			setSuccess(
				"Customer record created successfully.",
			);
			setSearch("");

			await loadCustomers();

			setCreateOpen(false);
		} catch (createError: unknown) {
			setSubmitError(
				createError instanceof Error
					? createError.message
					: "Unable to create customer record.",
			);
		} finally {
			setSubmitting(false);
		}
	};

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			void loadCustomers();
		}, 0);

		return () => window.clearTimeout(timeoutId);
	}, [loadCustomers]);

	const filteredCustomers = useMemo(() => {
		const query = search.trim().toLowerCase();

		if (!query) {
			return customers;
		}

		return customers.filter((customer) =>
			[
				customer.businessName,
				customer.tinNumber,
				customer.businessType,
				customer.contactPerson,
				customer.contactEmail,
			].some((value) =>
				value.toLowerCase().includes(query),
			),
		);
	}, [customers, search]);

	const formatRegisteredAt = (value: string) => {
		if (!value) {
			return "—";
		}

		const date = new Date(value);

		return Number.isNaN(date.getTime())
			? "—"
			: date.toLocaleDateString(undefined, {
					day: "2-digit",
					month: "short",
					year: "numeric",
				});
	};

	return (
		<EncoderSectionLayout
			activeSection="customers"
			title="Customers"
			description="Registered importers, their KYC state and active caseload."
		>
			<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-7">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
							Registry
						</p>

						<h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
							Customers
						</h2>

						<p className="mt-1 text-sm text-slate-500">
							Registered importers, their KYC state and active caseload.
						</p>
					</div>

					<button
						type="button"
						onClick={() => {
							setSubmitError(null);
							setCreateOpen(true);
						}}
						className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
					>
						<Plus className="h-4 w-4" />
						Create customer
					</button>
				</header>

				<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 sm:px-7">
					<div className="relative min-w-[220px] flex-1 sm:max-w-sm">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

						<input
							value={search}
							onChange={(event) =>
								setSearch(event.target.value)
							}
							placeholder="Search customers"
							aria-label="Search customers"
							className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
						/>
					</div>

					<div className="flex items-center gap-3">
						<p className="text-xs text-slate-500">
							{loading
								? "Loading records…"
								: `${filteredCustomers.length} of ${customers.length} importers`}
						</p>

						<button
							type="button"
							onClick={() => void loadCustomers()}
							disabled={loading}
							aria-label="Refresh customer list"
							className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
						>
							<RefreshCw
								className={`h-3.5 w-3.5 ${
									loading ? "animate-spin" : ""
								}`}
							/>
							Refresh
						</button>
					</div>
				</div>

				{error && (
					<p
						role="alert"
						className="m-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
					>
						{error}
					</p>
				)}

				{serviceDataError && (
					<p
						role="status"
						className="m-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
					>
						Customer records loaded, but case counts could not be refreshed: {serviceDataError}
					</p>
				)}

				{success && (
					<p
						role="status"
						className="m-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
					>
						{success}
					</p>
				)}

				<div className="overflow-x-auto">
					<table className="w-full min-w-[880px] text-left">
						<thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
							<tr>
								<th
									scope="col"
									className="px-5 py-3 sm:px-7"
								>
									Importer
								</th>

								<th
									scope="col"
									className="px-4 py-3"
								>
									TIN
								</th>

								<th
									scope="col"
									className="px-4 py-3"
								>
									Category
								</th>

								<th
									scope="col"
									className="px-4 py-3"
								>
									KYC
								</th>

								<th
									scope="col"
									className="px-4 py-3"
								>
									Active cases
								</th>

								<th
									scope="col"
									className="px-5 py-3 sm:px-7"
								>
									Registered
								</th>
							</tr>
						</thead>

						<tbody className="divide-y divide-slate-100">
							{filteredCustomers.map((customer) => {
								const statusClass =
									customer.kycStatus === "Verified"
										? "border-emerald-200 bg-emerald-50 text-emerald-800"
										: customer.kycStatus === "Revision"
											? "border-amber-200 bg-amber-50 text-amber-800"
											: "border-blue-200 bg-blue-50 text-blue-800";

								return (
									<tr
										key={customer.id}
										className="transition hover:bg-slate-50/80"
									>
										<td className="px-5 py-3.5 sm:px-7">
											<p className="text-sm font-semibold text-slate-900">
												{customer.businessName ||
													"Unnamed importer"}
											</p>

											<p className="mt-0.5 text-xs text-slate-500">
												{[
													customer.contactPerson,
													customer.contactEmail ||
														customer.contactPhone,
												]
													.filter(Boolean)
													.join(" · ") ||
													"Contact details unavailable"}
											</p>
										</td>

										<td className="px-4 py-3.5 font-mono text-xs text-slate-700">
											{customer.tinNumber || "—"}
										</td>

										<td className="px-4 py-3.5 text-sm text-slate-700">
											{customer.businessType || "—"}
										</td>

										<td className="px-4 py-3.5">
											<span
												className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}
											>
												{customer.kycStatus}
											</span>
										</td>

										<td className="px-4 py-3.5 text-sm tabular-nums text-slate-700">
											{customer.activeCases ?? "—"}
										</td>

										<td className="px-5 py-3.5 text-sm text-slate-600 sm:px-7">
											{formatRegisteredAt(
												customer.registeredAt,
											)}
										</td>
									</tr>
								);
							})}

							{loading &&
								customers.length === 0 && (
									<tr>
										<td
											colSpan={6}
											className="px-5 py-12 text-center text-sm text-slate-500"
										>
											Loading customer records…
										</td>
									</tr>
								)}

							{!loading &&
								!error &&
								filteredCustomers.length === 0 && (
									<tr>
										<td
											colSpan={6}
											className="px-5 py-12 text-center text-sm text-slate-500"
										>
											{search
												? "No customers match your search."
												: "No customer records found."}
										</td>
									</tr>
								)}
						</tbody>
					</table>
				</div>
			</section>

			{createOpen && (
				<div
					className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
					onMouseDown={(event) => {
						if (
							event.target === event.currentTarget &&
							!submitting
						) {
							setCreateOpen(false);
						}
					}}
				>
					<section
						role="dialog"
						aria-modal="true"
						aria-labelledby="create-customer-title"
						className="max-h-[92dvh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"
					>
						<div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
							<div>
								<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">
									Data entry
								</p>

								<h2
									id="create-customer-title"
									className="mt-1 text-lg font-semibold text-slate-900"
								>
									Create customer
								</h2>

								<p className="mt-1 text-sm text-slate-500">
									Register an importer in the customer directory.
								</p>
							</div>

							<button
								type="button"
								aria-label="Close customer form"
								onClick={() =>
									setCreateOpen(false)
								}
								disabled={submitting}
								className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<form
							onSubmit={createCustomer}
							className="space-y-5 p-5 sm:p-6"
						>
							{submitError && (
								<p
									role="alert"
									className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
								>
									{submitError}
								</p>
							)}

							<section className="rounded-xl border border-slate-200 p-4 sm:p-5">
								<div className="mb-4">
									<h3 className="text-sm font-semibold text-slate-900">Business registration</h3>
									<p className="mt-1 text-xs text-slate-500">Enter the importer’s registered business and license details.</p>
								</div>
								<div className="grid gap-4 sm:grid-cols-2">
									{[
										["businessName", "Business name", "text"],
										["businessType", "Business type", "text"],
										["tinNumber", "TIN number", "text"],
										["businessLicense", "Business license", "text"],
										["importLicense", "Import license", "text"],
									].map(([name, label, type]) => (
										<label key={name} className="block text-sm font-medium text-slate-700">
											{label}
											<input
												name={name}
												type={type}
												required
												maxLength={160}
												className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
											/>
										</label>
									))}
									<label className="block text-sm font-medium text-slate-700">
										Import license expiry
										<input
											name="importLicenseExpiry"
											type="date"
											className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
										/>
									</label>
								</div>
							</section>

							<section className="rounded-xl border border-slate-200 p-4 sm:p-5">
								<div className="mb-4">
									<h3 className="text-sm font-semibold text-slate-900">Primary contact</h3>
									<p className="mt-1 text-xs text-slate-500">Add the person who will manage this importer account.</p>
								</div>
								<div className="grid gap-4 sm:grid-cols-2">
									{[
										["contactPerson", "Contact person", "text"],
										["contactPhone", "Contact phone", "tel"],
										["contactEmail", "Contact email", "email"],
									].map(([name, label, type]) => (
										<label key={name} className="block text-sm font-medium text-slate-700">
											{label}
											<input
												name={name}
												type={type}
												required
												maxLength={160}
												className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
											/>
										</label>
									))}
								</div>
							</section>

							<section className="rounded-xl border border-slate-200 p-4 sm:p-5">
								<div className="mb-4">
									<h3 className="text-sm font-semibold text-slate-900">Business address</h3>
									<p className="mt-1 text-xs text-slate-500">Provide the registered business location.</p>
								</div>
								<div className="grid gap-4 sm:grid-cols-3">
									{[
										["city", "City"],
										["state", "State / region"],
										["postalCode", "Postal code"],
									].map(([name, label]) => (
										<label key={name} className="block text-sm font-medium text-slate-700">
											{label}
											<input
												name={name}
												type="text"
												required
												maxLength={160}
												className="mt-1.5 h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
											/>
										</label>
									))}
									<label className="block text-sm font-medium text-slate-700 sm:col-span-3">
										Full business address
										<textarea
											name="businessAddress"
											required
											maxLength={500}
											rows={3}
											className="mt-1.5 w-full rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
										/>
									</label>
								</div>
							</section>

							<div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
								<button
									type="button"
									onClick={() =>
										setCreateOpen(false)
									}
									disabled={submitting}
									className="rounded-md border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
								>
									Cancel
								</button>

								<button
									type="submit"
									disabled={submitting}
									className="rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{submitting
										? "Creating customer…"
										: "Create customer"}
								</button>
							</div>
						</form>
					</section>
				</div>
			)}
		</EncoderSectionLayout>
	);
}