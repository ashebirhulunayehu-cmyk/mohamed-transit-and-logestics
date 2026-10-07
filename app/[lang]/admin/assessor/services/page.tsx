"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Clock3, LoaderCircle, MessageSquarePlus, RefreshCw, ShieldCheck } from "lucide-react";
import { useAssessorStore } from "@/modules/assessor/assessor.store";
import type { AssessorItem } from "@/modules/assessor/assessor.type";

const readValue = (record: AssessorItem, ...keys: string[]): unknown => {
	const key = Object.keys(record).find((candidate) => keys.some((name) => candidate.toLowerCase() === name.toLowerCase()));
	return key ? record[key] : undefined;
};

const readText = (value: unknown, ...keys: string[]): string => {
	if (typeof value === "string" || typeof value === "number") return String(value).trim();
	if (typeof value !== "object" || value === null || Array.isArray(value)) return "";
	const record = value as AssessorItem;
	const nested = readValue(record, ...keys, "businessName", "name", "fullName", "username");
	return typeof nested === "string" || typeof nested === "number" ? String(nested).trim() : "";
};

const getServiceId = (record: AssessorItem): string =>
	readText(readValue(record, "serviceId", "shipmentId", "id", "trackingNumber", "serviceNumber"));

const getServiceTitle = (record: AssessorItem): string =>
	readText(readValue(record, "description", "itemDescription", "title")) || "Service record";

const getImporter = (record: AssessorItem): string =>
	readText(readValue(record, "importer", "customer", "businessName", "importerName"), "businessName", "companyName") ||
	(readValue(record, "importerId", "customerId") !== undefined ? `Importer ${String(readValue(record, "importerId", "customerId"))}` : "Importer not provided");

const getDate = (record: AssessorItem): string => {
	const value = readText(readValue(record, "updatedAt", "createAt", "createdAt", "submittedAt"));
	if (!value) return "Date unavailable";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

function Worklist({
	title,
	items,
	loading,
	icon: Icon,
	onFeedback,
}: {
	title: string;
	items: AssessorItem[];
	loading: boolean;
	icon: typeof Clock3;
	onFeedback: (serviceId: string, comment: string, issueType: string) => Promise<void>;
}) {
	return (
		<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
			<header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
				<div className="flex items-center gap-3">
					<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Icon className="h-4 w-4" /></span>
					<div><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="text-xs text-slate-500">{items.length} records from Assessor API</p></div>
				</div>
			</header>
			{loading && items.length === 0 ? (
				<div className="flex items-center justify-center gap-2 px-5 py-10 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading services...</div>
			) : items.length === 0 ? (
				<p className="px-5 py-10 text-center text-sm text-slate-500">No records returned by this endpoint.</p>
			) : (
				<div className="divide-y divide-slate-100">
					{items.map((item, index) => (
						<ServiceWorkItem key={getServiceId(item) || `service-${index}`} item={item} onFeedback={onFeedback} />
					))}
				</div>
			)}
		</section>
	);
}

function ServiceWorkItem({ item, onFeedback }: { item: AssessorItem; onFeedback: WorklistProps["onFeedback"] }) {
	const [formOpen, setFormOpen] = useState(false);
	const [comment, setComment] = useState("");
	const [issueType, setIssueType] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);
	const serviceId = getServiceId(item);

	const submitFeedback = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!serviceId || !comment.trim()) {
			setError("A service ID and feedback comment are required.");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await onFeedback(serviceId, comment.trim(), issueType.trim());
			setComment("");
			setIssueType("");
			setSuccess(true);
		} catch (submitError: unknown) {
			setError(submitError instanceof Error ? submitError.message : "Unable to submit compliance feedback.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<article className="px-5 py-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="font-mono text-xs font-semibold text-blue-700">{serviceId || "Service ID unavailable"}</p>
					<h3 className="mt-1 text-sm font-semibold text-slate-900">{getServiceTitle(item)}</h3>
					<p className="mt-1 text-xs text-slate-600">{getImporter(item)}</p>
					<p className="mt-2 text-xs text-slate-500">
						{readText(readValue(item, "origin", "countryOfOrigin")) || "Origin unavailable"}
						{" → "}
						{readText(readValue(item, "destination", "assignedHub", "routeCategory")) || "Destination unavailable"}
						<span className="px-1.5 text-slate-300">·</span>
						{readText(readValue(item, "status", "serviceStatus")) || "Status unavailable"}
						<span className="px-1.5 text-slate-300">·</span>{getDate(item)}
					</p>
				</div>
				<button type="button" disabled={!serviceId} onClick={() => { setFormOpen((open) => !open); setSuccess(false); setError(null); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
					<MessageSquarePlus className="h-3.5 w-3.5" />Compliance feedback
				</button>
			</div>
			{formOpen && (
				<form onSubmit={(event) => void submitFeedback(event)} className="mt-4 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
					<label className="block text-xs font-medium text-slate-700">Issue type <span className="font-normal text-slate-400">(optional)</span>
						<input value={issueType} onChange={(event) => setIssueType(event.target.value)} maxLength={100} className="mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
					</label>
					<label className="block text-xs font-medium text-slate-700">Feedback
						<textarea required value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} rows={3} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
					</label>
					{error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
					{success && <p role="status" className="text-xs text-emerald-700">Feedback submitted to the service.</p>}
					<div className="flex justify-end">
						<button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{submitting && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{submitting ? "Submitting..." : "Submit feedback"}</button>
					</div>
				</form>
			)}
		</article>
	);
}

type WorklistProps = {
	onFeedback: (serviceId: string, comment: string, issueType: string) => Promise<void>;
};

export default function ServicesPage() {
	const pendingServices = useAssessorStore((state) => state.pendingServices);
	const servicesUnderOversight = useAssessorStore((state) => state.servicesUnderOversight);
	const loading = useAssessorStore((state) => state.loading);
	const error = useAssessorStore((state) => state.error);
	const fetchServiceWorklists = useAssessorStore((state) => state.fetchServiceWorklists);
	const addComplianceFeedback = useAssessorStore((state) => state.addComplianceFeedback);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => void fetchServiceWorklists(), 0);
		return () => window.clearTimeout(timeoutId);
	}, [fetchServiceWorklists]);

	const refresh = useCallback(() => void fetchServiceWorklists(), [fetchServiceWorklists]);
	const submitFeedback: WorklistProps["onFeedback"] = async (serviceId, comment, issueType) => {
		await addComplianceFeedback({ serviceId, comment, ...(issueType ? { issueType } : {}) });
	};

	return (
		<div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800">
			<header className="flex flex-wrap items-end justify-between gap-4">
				<div>
					<span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Assessor worklists</span>
					<h1 className="mt-0.5 text-2xl font-bold text-slate-900">Services</h1>
					<p className="mt-1 text-sm text-slate-500">Pending reviews and services under your oversight, loaded from Assessor endpoints.</p>
				</div>
				<button type="button" onClick={refresh} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50">
					<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />Refresh
				</button>
			</header>
			{error && <p role="alert" className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
			<div className="grid gap-5 xl:grid-cols-2">
				<Worklist title="Pending services" items={pendingServices} loading={loading} icon={Clock3} onFeedback={submitFeedback} />
				<Worklist title="Services under oversight" items={servicesUnderOversight} loading={loading} icon={ShieldCheck} onFeedback={submitFeedback} />
			</div>
		</div>
	);
}