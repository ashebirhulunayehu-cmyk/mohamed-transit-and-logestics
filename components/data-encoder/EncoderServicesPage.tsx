"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
	ArrowDownUp,
	AlertCircle,
	ChevronDown,
	Columns3,
	Clock3,
	Download,
	Filter,
	RefreshCw,
	Search,
	ShieldCheck,
} from "lucide-react";
import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import { DataEncoderEndpoints } from "@/modules/dataencoder/data-encoder.endpoint";

type ServiceRecord = Record<string, unknown>;

interface DisplayService {
	id: string;
	databaseId: string;
	description: string;
	importer: string;
	customerReference: string;
	mode: string;
	status: string;
	risk: string;
	caseOwner: string;
	eta: string;
	sla: string;
	updated: string;
	updatedTimestamp: number;
}

type ServiceColumn = "importer" | "mode" | "status" | "risk" | "caseOwner" | "eta" | "sla" | "updated";

const serviceColumns: { id: ServiceColumn; label: string; getValue: (service: DisplayService) => string }[] = [
	{ id: "importer", label: "Importer", getValue: (service) => service.importer },
	{ id: "mode", label: "Mode", getValue: (service) => service.mode },
	{ id: "status", label: "Status", getValue: (service) => service.status },
	{ id: "risk", label: "Risk", getValue: (service) => service.risk },
	{ id: "caseOwner", label: "Case executor", getValue: (service) => service.caseOwner },
	{ id: "eta", label: "ETA", getValue: (service) => service.eta },
	{ id: "sla", label: "SLA", getValue: (service) => service.sla },
	{ id: "updated", label: "Updated", getValue: (service) => service.updated },
];

const normalizeChannel = (value: string) =>
	value.toLowerCase().replace(/\s+channel$/, "").trim();

const escapeCsv = (value: string) => `"${value.replaceAll('"', '""')}"`;

const isRecord = (value: unknown): value is ServiceRecord =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const findValue = (record: ServiceRecord, ...names: string[]): unknown => {
	const key = Object.keys(record).find((candidate) =>
		names.some((name) => candidate.toLowerCase() === name.toLowerCase()),
	);
	return key ? record[key] : undefined;
};

const readText = (...values: unknown[]): string => {
	const value = values.find(
		(candidate) =>
			(typeof candidate === "string" && candidate.trim()) ||
			typeof candidate === "number",
	);
	return value === undefined ? "" : String(value).trim();
};

const readNoteField = (notes: string, field: string): string => {
	const prefix = `${field.toLowerCase()}:`;
	const line = notes.split(/\r?\n/).find((entry) => entry.trim().toLowerCase().startsWith(prefix));
	return line?.trim().slice(prefix.length).trim() ?? "";
};

const readRelatedText = (value: unknown, ...names: string[]): string => {
	if (isRecord(value)) {
		return readText(findValue(value, ...names, "name", "fullName", "businessName"));
	}
	return readText(value);
};

const unwrapServices = (value: unknown): ServiceRecord[] => {
	let candidate = value;
	for (let depth = 0; depth < 6; depth += 1) {
		if (Array.isArray(candidate)) {
			if (!candidate.every(isRecord)) {
				throw new Error("The services endpoint returned an invalid record list.");
			}
			return candidate;
		}
		if (!isRecord(candidate)) break;

		const rowsKey = Object.keys(candidate).find((key) =>
			[
				"items",
				"services",
				"shipments",
				"records",
				"servicelist",
				"servicerecords",
				"recentservices",
				"rows",
			].includes(key.toLowerCase()),
		);
		if (rowsKey) {
			candidate = candidate[rowsKey];
			continue;
		}

		const envelopeKey = Object.keys(candidate).find((key) =>
			["data", "payload", "response", "result"].includes(key.toLowerCase()),
		);
		if (!envelopeKey) break;
		candidate = candidate[envelopeKey];
	}
	throw new Error("The services endpoint response did not contain a service list.");
};

const formatDate = (value: string): string => {
	if (!value) return "—";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleDateString(undefined, {
				day: "2-digit",
				month: "short",
				year: "numeric",
			});
};

const getStatusTone = (status: string): string => {
	const value = status.toLowerCase();
	if (value.includes("block") || value.includes("reject") || value.includes("fail")) {
		return "bg-rose-50 text-rose-700 ring-rose-200";
	}
	if (value.includes("complete") || value.includes("approv") || value.includes("clear")) {
		return "bg-emerald-50 text-emerald-700 ring-emerald-200";
	}
	if (value.includes("customer action")) {
		return "bg-violet-50 text-violet-700 ring-violet-200";
	}
	if (value.includes("review") || value.includes("pending")) {
		return "bg-amber-50 text-amber-700 ring-amber-200";
	}
	if (value.includes("progress")) {
		return "bg-cyan-50 text-cyan-700 ring-cyan-200";
	}
	return "bg-slate-100 text-slate-700 ring-slate-200";
};

const getRiskTone = (risk: string): string => {
	const value = risk.toLowerCase();
	if (value.includes("red")) return "bg-rose-50 text-rose-700 ring-rose-200";
	if (value.includes("yellow")) return "bg-amber-50 text-amber-700 ring-amber-200";
	if (value.includes("blue")) return "bg-sky-50 text-sky-700 ring-sky-200";
	if (value.includes("green")) return "bg-emerald-50 text-emerald-700 ring-emerald-200";
	return "bg-slate-100 text-slate-700 ring-slate-200";
};

const normalizeServiceStatus = (value: unknown): string => {
	if (typeof value === "string" && value.trim()) {
		const status = value.trim();
		const normalized = status.toLowerCase();
		if (/^\d+$/.test(normalized)) {
			return normalizeServiceStatus(Number(normalized));
		}
		if (normalized === "deliverd" || normalized === "delivered") return "Delivered";
		if (normalized.replaceAll(/[\s_-]+/g, "") === "underreview") return "Under review";
		if (normalized.includes("block")) return "Blocked";
		if (normalized.includes("review")) return "Needs review";
		if (normalized.includes("complete")) return "Completed";
		if (normalized.includes("approv")) return "Approved";
		if (normalized.includes("progress")) return "In progress";
		if (normalized.includes("action")) return "Requires customer action";
		if (normalized.includes("pending")) return "Pending";
		return status;
	}

	const statuses: Record<number, string> = {
		1: "Draft",
		2: "Submitted",
		3: "Under review",
		4: "Approved",
		5: "In progress",
		6: "Completed",
		7: "Rejected",
		8: "Cancelled",
		9: "Delivered",
	};
	return statuses[Number(value)] ?? "—";
};

const normalizeRiskChannel = (value: unknown): string => {
	if (typeof value === "string" && value.trim()) {
		const risk = value.trim();
		const normalized = risk.toLowerCase();
		if (/^\d+$/.test(normalized)) {
			return normalizeRiskChannel(Number(normalized));
		}
		if (normalized.includes("red")) return "Red channel";
		if (normalized.includes("yellow")) return "Yellow channel";
		if (normalized.includes("green")) return "Green channel";
		if (normalized.includes("blue")) return "Blue channel";
		if (normalized.includes("unassigned")) return "Unassigned";
		return risk;
	}

	const risks: Record<number, string> = {
		1: "Blue channel",
		2: "Green channel",
		3: "Yellow channel",
		4: "Red channel",
	};
	return risks[Number(value)] ?? "Unassigned";
};

const readUserName = (value: unknown): string => {
	if (!isRecord(value)) return readText(value);
	const fullName = [
		readText(findValue(value, "firstName", "givenName")),
		readText(findValue(value, "lastName", "familyName")),
	].filter(Boolean).join(" ");
	return fullName || readText(findValue(value, "fullName", "name", "username", "email"));
};

const toDisplayService = (record: ServiceRecord): DisplayService => {
	const importer = findValue(
		record,
		"importer",
		"customer",
		"customerName",
		"importerName",
		"importerBusinessName",
	);
	const owner = findValue(
		record,
		"assignedCaseExecutor",
		"caseExecutor",
		"caseOwner",
		"assignedTo",
		"assignee",
	);
	const notes = readText(findValue(record, "notes", "serviceNotes"));
	const importerNote = readNoteField(notes, "Importer");
	const noteTin = importerNote.match(/\(TIN:\s*([^)]+)\)/i)?.[1]?.trim() ?? "";
	const noteImporterName = importerNote.replace(/\s*\(TIN:.*\)$/i, "").trim();
	const rawModeValue = findValue(record, "serviceType", "mode", "transportMode");
	const rawMode = readText(rawModeValue, readNoteField(notes, "Service type"));
	const rawStatus = findValue(record, "status", "serviceStatus", "approvalStatus", "recordStatus");
	const rawRisk = findValue(record, "riskLevel", "riskChannel", "channel", "risk", "channelType");
	const rawUpdated = readText(findValue(record, "updatedAt", "lastUpdated", "modifiedDate", "lastUpdateDate", "createAt", "createdAt"));
	const rawEta = readText(findValue(record, "eta", "estimatedArrival", "expectedArrivalDate", "estimatedArrivalDate"));
	const updatedTimestamp = rawUpdated ? Date.parse(rawUpdated) : 0;

	return {
		id: readText(
			findValue(record, "trackingNumber", "serviceNumber", "serviceReference", "referenceNumber", "reference"),
			findValue(record, "serviceId", "id"),
		) || "—",
		databaseId: readText(findValue(record, "serviceId", "id")),
		description: readText(
			findValue(record, "description", "itemDescription", "serviceDescription", "goodsDescription"),
			readNoteField(notes, "Goods description"),
		),
		importer:
			readRelatedText(importer, "businessName", "companyName", "importerName", "fullName", "name") ||
			readText(findValue(record, "businessName", "companyName", "importerBusinessName", "customerBusinessName")) ||
			noteImporterName ||
			"—",
		customerReference: readText(
			findValue(record, "customerReference", "customerCode", "tinNumber", "tin", "importerTin", "importerTIN"),
			noteTin,
		),
		mode:
			rawModeValue === 1 || rawMode === "1" || rawMode.toLowerCase().includes("multi")
				? "Multimodal"
				: rawModeValue === 2 || rawMode === "2" || rawMode.toLowerCase().includes("uni")
					? "Unimodal"
					: rawMode || "—",
		status: normalizeServiceStatus(rawStatus),
		risk: rawRisk === undefined || rawRisk === null || rawRisk === ""
			? "Unassigned"
			: normalizeRiskChannel(rawRisk),
		caseOwner: readUserName(owner) || "Unassigned",
		eta: formatDate(rawEta),
		sla: readText(findValue(record, "sla", "slaStatus", "timeRemaining", "slaRemaining")) || "—",
		updated: rawUpdated ? formatDate(rawUpdated) : "—",
		updatedTimestamp: Number.isNaN(updatedTimestamp) ? 0 : updatedTimestamp,
	};
};

const readRequestError = (error: unknown): string =>
	typeof error === "string"
		? error
		: error instanceof Error
			? error.message
			: "Unable to load services.";

export default function EncoderServicesPage() {
	const [query, setQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [modeFilter, setModeFilter] = useState("");
	const [riskFilter, setRiskFilter] = useState("");
	const [sortDirection, setSortDirection] = useState<1 | -1>(-1);
	const [visibleColumns, setVisibleColumns] = useState<Record<ServiceColumn, boolean>>({
		importer: true,
		mode: true,
		status: true,
		risk: true,
		caseOwner: true,
		eta: true,
		sla: true,
		updated: true,
	});
	const [records, setRecords] = useState<ServiceRecord[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadServices = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const body = await DataEncoderEndpoints.getServices();
			setRecords(unwrapServices(body));
		} catch (requestError: unknown) {
			setRecords([]);
			setError(readRequestError(requestError));
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => void loadServices(), 0);
		return () => window.clearTimeout(timeoutId);
	}, [loadServices]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			const serviceId = new URLSearchParams(window.location.search).get("serviceId");
			if (serviceId) setQuery(serviceId);
		}, 0);
		return () => window.clearTimeout(timeoutId);
	}, []);

	const services = useMemo(
		() => records.map(toDisplayService),
		[records],
	);

	const statuses = useMemo(
		() => [...new Set(services.map((service) => service.status).filter((value) => value !== "—"))],
		[services],
	);
	const modes = useMemo(
		() => [...new Set(services.map((service) => service.mode).filter((value) => value !== "—"))],
		[services],
	);
	const risks = useMemo(
		() => [...new Set(services.map((service) => service.risk).filter((value) => value !== "—"))],
		[services],
	);

	const filteredServices = useMemo(() => {
		const target = query.trim().toLowerCase();
		return services.filter((service) => {
			const matchesQuery = !target ||
				`${service.id} ${service.databaseId} ${service.importer} ${service.customerReference} ${service.caseOwner}`
					.toLowerCase()
					.includes(target);
			return matchesQuery &&
				(!statusFilter || service.status.toLowerCase() === statusFilter.toLowerCase()) &&
				(!modeFilter || service.mode.toLowerCase() === modeFilter.toLowerCase()) &&
				(!riskFilter || normalizeChannel(service.risk) === normalizeChannel(riskFilter));
		});
	}, [modeFilter, query, riskFilter, services, statusFilter]);

	const sortedServices = useMemo(
		() => [...filteredServices].sort((left, right) =>
			(left.updatedTimestamp - right.updatedTimestamp) * sortDirection,
		),
		[filteredServices, sortDirection],
	);

	const visibleColumnCount = serviceColumns.filter(({ id }) => visibleColumns[id]).length;

	const toggleColumn = (column: ServiceColumn) => {
		setVisibleColumns((current) => ({ ...current, [column]: !current[column] }));
	};

	const exportServices = () => {
		const columns = [
			{ label: "Service", getValue: (service: DisplayService) => service.id },
			...serviceColumns.filter(({ id }) => visibleColumns[id]),
		];
		const csv = [
			columns.map(({ label }) => escapeCsv(label)).join(","),
			...sortedServices.map((service) =>
				columns.map(({ getValue }) => escapeCsv(getValue(service))).join(","),
			),
		].join("\r\n");
		const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
		const link = document.createElement("a");
		link.href = url;
		link.download = `encoder-services-${new Date().toISOString().slice(0, 10)}.csv`;
		document.body.appendChild(link);
		link.click();
		link.remove();
		window.setTimeout(() => URL.revokeObjectURL(url), 0);
	};

	return (
		<EncoderSectionLayout
			activeSection="services"
			title="Services"
			description="Cases you have created or captured data for."
		>
			<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-200 bg-white p-3 sm:p-4">
					<div className="flex flex-col gap-2 xl:flex-row xl:items-center">
						<label className="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 py-2 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
							<Search className="h-4 w-4 shrink-0 text-slate-500" />
							<input
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search by service ID, reference, company..."
								className="min-w-0 w-full bg-transparent text-xs outline-none placeholder:text-slate-500"
							/>
						</label>
						<div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
							<label className="sr-only" htmlFor="service-status-filter">Filter by status</label>
							<div className="relative min-w-[140px] flex-1">
								<Filter className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-700" />
								<select
									id="service-status-filter"
									value={statusFilter}
									onChange={(event) => setStatusFilter(event.target.value)}
									className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-8 pr-8 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
								>
									<option value="">All statuses</option>
									{statuses.map((status) => <option key={status} value={status}>{status}</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<label className="sr-only" htmlFor="service-mode-filter">Filter by mode</label>
							<div className="relative min-w-[132px] flex-1">
								<select
									id="service-mode-filter"
									value={modeFilter}
									onChange={(event) => setModeFilter(event.target.value)}
									className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
								>
									<option value="">All modes</option>
									{modes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<label className="sr-only" htmlFor="service-risk-filter">Filter by channel</label>
							<div className="relative min-w-[140px] flex-1">
								<select
									id="service-risk-filter"
									value={riskFilter}
									onChange={(event) => setRiskFilter(event.target.value)}
									className="h-9 w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-xs text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
								>
									<option value="">All channels</option>
									{risks.map((risk) => <option key={risk} value={risk}>{risk}</option>)}
								</select>
								<ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
							</div>
							<details className="relative">
								<summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
									<Columns3 className="h-4 w-4" />
									Columns
								</summary>
								<div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
									<p className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Visible columns</p>
									{serviceColumns.map(({ id, label }) => (
										<label key={id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
											<input
												type="checkbox"
												checked={visibleColumns[id]}
												onChange={() => toggleColumn(id)}
												className="h-3.5 w-3.5 accent-blue-600"
											/>
											{label}
										</label>
									))}
								</div>
							</details>
							<button
								type="button"
								onClick={exportServices}
								className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
							>
								<Download className="h-4 w-4" />
								Export
							</button>
							<button
								type="button"
								onClick={() => void loadServices()}
								disabled={loading}
								aria-label="Refresh services"
								title="Refresh services"
								className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
							>
								<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							</button>
						</div>
					</div>
				</div>

				{error && (
					<div role="alert" className="m-4 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
						<AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
						<div>
							<p className="font-semibold">Services could not be loaded.</p>
							<p className="mt-1">{error}</p>
						</div>
					</div>
				)}

				<div className="overflow-x-auto">
					<table className="w-full min-w-[760px] table-fixed border-separate border-spacing-0">
						<colgroup>
							<col className="w-[190px]" />
							{visibleColumns.importer && <col className="w-[210px]" />}
							{visibleColumns.mode && <col className="w-[115px]" />}
							{visibleColumns.status && <col className="w-[155px]" />}
							{visibleColumns.risk && <col className="w-[135px]" />}
							{visibleColumns.caseOwner && <col className="w-[150px]" />}
							{visibleColumns.eta && <col className="w-[110px]" />}
							{visibleColumns.sla && <col className="w-[100px]" />}
							{visibleColumns.updated && <col className="w-[135px]" />}
						</colgroup>
						<thead>
							<tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
								<th className="sticky left-0 z-10 bg-slate-50 px-5 py-3">Service</th>
								{visibleColumns.importer && <th className="px-5 py-3">Importer</th>}
								{visibleColumns.mode && <th className="px-5 py-3">Mode</th>}
								{visibleColumns.status && <th className="px-5 py-3">Status</th>}
								{visibleColumns.risk && <th className="px-5 py-3">Risk</th>}
								{visibleColumns.caseOwner && <th className="px-5 py-3">Case executor</th>}
								{visibleColumns.eta && <th className="px-5 py-3">ETA</th>}
								{visibleColumns.sla && <th className="px-5 py-3">SLA</th>}
								{visibleColumns.updated && (
									<th aria-sort={sortDirection === 1 ? "ascending" : "descending"} className="px-5 py-3">
										<button type="button" onClick={() => setSortDirection((direction) => direction === 1 ? -1 : 1)} className="inline-flex items-center gap-1.5 hover:text-slate-800">
											Updated <ArrowDownUp className={`h-3.5 w-3.5 ${sortDirection === 1 ? "rotate-180" : ""}`} />
										</button>
									</th>
								)}
							</tr>
						</thead>
						<tbody>
							{sortedServices.map((service) => (
								<tr key={`${service.id}-${service.customerReference}`} className="group border-t border-slate-200 bg-white hover:bg-slate-50/80">
									<td className="sticky left-0 z-[1] bg-white px-4 py-4 align-middle group-hover:bg-slate-50/80 sm:px-5">
										<p className="max-w-full truncate font-mono text-[12px] font-semibold text-blue-800" title={service.id}>{service.id}</p>
										{service.description && <p className="mt-1 max-w-[250px] truncate text-xs text-slate-500" title={service.description}>{service.description}</p>}
									</td>
									{visibleColumns.importer && <td className="px-5 py-4 align-middle">
										<div className="min-w-0">
											<p className="max-w-full truncate text-sm text-slate-700" title={service.importer}>{service.importer}</p>
											{service.customerReference && <p className="text-xs text-slate-500">{service.customerReference}</p>}
										</div>
									</td>}
									{visibleColumns.mode && <td className="px-4 py-4 sm:px-5">
										{service.mode === "—"
											? <span className="text-sm text-slate-400">—</span>
											: <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-100">{service.mode}</span>}
									</td>}
									{visibleColumns.status && <td className="px-5 py-4">
										{service.status === "—"
											? <span className="text-sm text-slate-400">—</span>
											: <span className={`inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusTone(service.status)}`}>
												{service.status.toLowerCase().includes("progress") || service.status.toLowerCase().includes("pending")
													? <Clock3 className="h-3.5 w-3.5 shrink-0" />
													: service.status.toLowerCase().includes("complete") || service.status.toLowerCase().includes("approv")
														? <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
														: <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
												<span className="truncate">{service.status}</span>
											</span>}
									</td>}
									{visibleColumns.risk && <td className="px-5 py-4">
										{service.risk === "Unassigned"
											? <span className="text-sm text-slate-400">—</span>
											: <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${getRiskTone(service.risk)}`}>
												<ShieldCheck className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{service.risk}</span>
											</span>}
									</td>}
									{visibleColumns.caseOwner && <td className="px-5 py-4 text-sm text-slate-700">{service.caseOwner === "Unassigned" ? <span className="text-slate-400">—</span> : service.caseOwner}</td>}
									{visibleColumns.eta && <td className="px-5 py-4 text-sm text-slate-700">{service.eta}</td>}
									{visibleColumns.sla && <td className="px-5 py-4 text-sm text-slate-700">{service.sla}</td>}
									{visibleColumns.updated && <td className="px-5 py-4 text-sm text-slate-500">{service.updated}</td>}
								</tr>
							))}
							{loading && records.length === 0 && (
								<tr><td colSpan={visibleColumnCount + 1} className="px-5 py-12 text-center text-sm text-slate-500">Loading services…</td></tr>
							)}
							{!loading && !error && filteredServices.length === 0 && (
								<tr><td colSpan={visibleColumnCount + 1} className="px-5 py-12 text-center text-sm text-slate-500">
									{records.length ? "No services match the selected filters." : "No service records found."}
								</td></tr>
							)}
						</tbody>
					</table>
				</div>

				<div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
					Showing {filteredServices.length} of {services.length} services
				</div>
			</div>
		</EncoderSectionLayout>
	);
}
