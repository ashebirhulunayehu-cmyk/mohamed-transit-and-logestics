"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	FileText,
	LoaderCircle,
	UploadCloud,
	X,
} from "lucide-react";
import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";

const MAX_FILES = 50;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".csv"]);

type ServiceOption = {
	id: string;
	reference: string;
	label: string;
};

type FileStatus = "matched" | "manual" | "uploading" | "uploaded" | "failed";

type BulkFile = {
	id: string;
	file: File;
	serviceId: string;
	reference: string;
	status: FileStatus;
	message?: string;
};

type BatchResult = {
	key: string;
	name: string;
	message: string;
	ok: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (...values: unknown[]): string => {
	const value = values.find((candidate) =>
		(typeof candidate === "string" && candidate.trim()) || typeof candidate === "number",
	);
	return value === undefined ? "" : String(value).trim();
};

const findValue = (record: Record<string, unknown>, ...names: string[]): unknown => {
	const key = Object.keys(record).find((candidate) =>
		names.some((name) => name.toLowerCase() === candidate.toLowerCase()),
	);
	return key ? record[key] : undefined;
};

const unwrapServiceRows = (value: unknown): Record<string, unknown>[] => {
	let current = value;
	for (let depth = 0; depth < 6; depth += 1) {
		if (Array.isArray(current)) return current.filter(isRecord);
		if (!isRecord(current)) break;
		const listKey = Object.keys(current).find((key) =>
			["items", "services", "records", "servicelist", "rows"].includes(key.toLowerCase()),
		);
		const envelopeKey = Object.keys(current).find((key) =>
			["data", "payload", "response", "result"].includes(key.toLowerCase()),
		);
		const nextKey = listKey ?? envelopeKey;
		if (!nextKey) break;
		current = current[nextKey];
	}
	throw new Error("The services endpoint did not return a service list.");
};

const toServiceOptions = (value: unknown): ServiceOption[] =>
	unwrapServiceRows(value).flatMap((record) => {
		const id = readText(findValue(record, "id", "serviceId", "shipmentId"));
		if (!id) return [];
		const reference = readText(
			findValue(record, "reference", "referenceNumber", "trackingNumber", "serviceNumber"),
		);
		const contact = readText(findValue(record, "contactPerson", "importerName", "customerName"));
		return [{ id, reference, label: `${reference || `Service ${id}`}${contact ? ` · ${contact}` : ""}` }];
	});

const normalizeReference = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const matchService = (fileName: string, services: ServiceOption[]): ServiceOption | undefined => {
	const normalizedName = normalizeReference(fileName);
	return services
		.filter((service) => {
			const reference = normalizeReference(service.reference);
			return reference.length >= 4 && normalizedName.includes(reference);
		})
		.sort((first, second) => second.reference.length - first.reference.length)[0];
};

const readError = (value: unknown, status: number): string => {
	if (typeof value === "string" && value.trim()) return value;
	if (isRecord(value)) {
		for (const key of ["message", "detail", "error", "title"]) {
			const message = value[key];
			if (typeof message === "string" && message.trim()) return message;
		}
	}
	return `Upload failed (${status}).`;
};

const readFileValidationError = (file: File): string | null => {
	const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
	if (!ALLOWED_EXTENSIONS.has(extension)) return "Use a PDF, JPG, PNG, XLSX, or CSV file.";
	if (file.size > MAX_FILE_SIZE) return "File exceeds the 25 MB limit.";
	return null;
};

const formatFileSize = (bytes: number): string =>
	bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const statusLabel = (entry: BulkFile): string => {
	if (entry.status === "uploading") return "Uploading";
	if (entry.status === "uploaded") return entry.message ?? "Uploaded";
	if (entry.status === "failed") return entry.message ?? "Upload failed";
	if (entry.serviceId) return `Matched · ${entry.reference || `Service ${entry.serviceId}`}`;
	return "Needs manual matching";
};

export default function EncoderBulkUploadPage() {
	const inputRef = useRef<HTMLInputElement | null>(null);
	const [services, setServices] = useState<ServiceOption[]>([]);
	const [servicesLoading, setServicesLoading] = useState(true);
	const [servicesError, setServicesError] = useState<string | null>(null);
	const [files, setFiles] = useState<BulkFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const [dragging, setDragging] = useState(false);
	const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
	const [batchProcessedAt, setBatchProcessedAt] = useState<string | null>(null);
	const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	const loadServices = useCallback(async () => {
		setServicesLoading(true);
		setServicesError(null);
		try {
			const response = await fetch("/api/encoder/services", { cache: "no-store" });
			const text = await response.text();
			let body: unknown = text;
			if (text.trim()) {
				try { body = JSON.parse(text) as unknown; } catch { body = text; }
			}
			if (!response.ok) throw new Error(readError(body, response.status));
			setServices(toServiceOptions(body));
		} catch (error: unknown) {
			setServicesError(error instanceof Error ? error.message : typeof error === "string" ? error : "Unable to load services for matching.");
		} finally {
			setServicesLoading(false);
		}
	}, []);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => void loadServices(), 0);
		return () => window.clearTimeout(timeoutId);
	}, [loadServices]);

	const addFiles = (incoming: File[]) => {
		if (!incoming.length) return;
		const currentKeys = new Set(files.map((entry) => `${entry.file.name}:${entry.file.size}:${entry.file.lastModified}`));
		const incomingKeys = new Set<string>();
		const uniqueFiles = incoming.filter((file) => {
			const key = `${file.name}:${file.size}:${file.lastModified}`;
			if (currentKeys.has(key) || incomingKeys.has(key)) return false;
			incomingKeys.add(key);
			return true;
		});
		const additions = uniqueFiles
			.slice(0, Math.max(0, MAX_FILES - files.length))
			.map((file): BulkFile => {
				const validationError = readFileValidationError(file);
				const matched = validationError ? undefined : matchService(file.name, services);
				return {
					id: crypto.randomUUID(),
					file,
					serviceId: matched?.id ?? "",
					reference: matched?.reference ?? "",
					status: validationError ? "failed" : matched ? "matched" : "manual",
					message: validationError ?? undefined,
				};
			});
		setFiles((current) => [...current, ...additions]);
		setNotice(uniqueFiles.length > additions.length
			? `Only ${MAX_FILES} files can be added. ${uniqueFiles.length - additions.length} file${uniqueFiles.length - additions.length === 1 ? " was" : "s were"} not added.`
			: uniqueFiles.length < incoming.length
				? "Duplicate files were skipped."
				: null);
	};

	const updateFile = (id: string, update: Partial<BulkFile>) => {
		setFiles((current) => current.map((entry) => entry.id === id ? { ...entry, ...update } : entry));
	};

	const assignService = (entry: BulkFile, serviceId: string) => {
		const matched = services.find((service) => service.id === serviceId);
		const validationError = readFileValidationError(entry.file);
		updateFile(entry.id, {
			serviceId,
			reference: matched?.reference ?? "",
			status: validationError ? "failed" : entry.status === "uploaded" ? "uploaded" : serviceId ? "matched" : "manual",
			message: validationError ?? (entry.status === "uploaded" ? entry.message : undefined),
		});
	};

	const uploadBatch = async () => {
		const ready = files.filter((entry) => entry.serviceId && entry.status !== "uploaded" && !readFileValidationError(entry.file));
		if (!ready.length) {
			setNotice(files.length
				? "Select a service for at least one valid file before uploading. Supported types are PDF, JPG, PNG, XLSX, and CSV (25 MB max)."
				: "Choose files and match them to a service before uploading.");
			return;
		}
		setUploading(true);
		setUploadProgress({ completed: 0, total: ready.length });
		setNotice(null);
		const results: BatchResult[] = [];
		try {
			for (const entry of ready) {
				updateFile(entry.id, { status: "uploading", message: undefined });
				try {
					const formData = new FormData();
					formData.append("files", entry.file, entry.file.name);
					formData.append("DocumentType", "Supporting Document");
					formData.append("Description", entry.file.name);
					const response = await fetch(`/api/encoder/services/${encodeURIComponent(entry.serviceId)}/documents`, {
						method: "POST",
						body: formData,
					});
					const text = await response.text();
					let body: unknown = text;
					if (text.trim()) {
						try { body = JSON.parse(text) as unknown; } catch { body = text; }
					}
					if (!response.ok) throw new Error(readError(body, response.status));
					const message = `Matched · ${entry.reference || `Service ${entry.serviceId}`}`;
					updateFile(entry.id, { status: "uploaded", message });
					results.push({ key: entry.id, name: entry.file.name, message, ok: true });
				} catch (uploadError: unknown) {
					const message = uploadError instanceof Error ? uploadError.message : typeof uploadError === "string" ? uploadError : "Upload failed.";
					updateFile(entry.id, { status: "failed", message });
					results.push({ key: entry.id, name: entry.file.name, message, ok: false });
				}
				setUploadProgress({ completed: results.length, total: ready.length });
			}
			setBatchResults(results);
			setBatchProcessedAt(new Date().toISOString());
			const successCount = results.filter((result) => result.ok).length;
			setNotice(`${successCount} of ${results.length} files uploaded successfully.${successCount < results.length ? " Failed files can be retried after correcting the issue." : ""}`);
		} finally {
			setUploading(false);
			setUploadProgress(null);
		}
	};

	const matchedCount = files.filter((entry) =>
		entry.serviceId && entry.status !== "uploaded" && !readFileValidationError(entry.file),
	).length;

	return (
		<EncoderSectionLayout
			activeSection="bulk-upload"
			title="Bulk upload"
			description="Attach multiple documents to service cases in a single operation."
			descriptionInHeader
		>
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-blue-600" />
						<p className="text-sm font-semibold text-slate-800">Upload queue</p>
						<span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">{files.length} / {MAX_FILES}</span>
					</div>
					<div className="flex gap-2">
						<button type="button" onClick={() => void loadServices()} disabled={servicesLoading} title="Refresh service matches" aria-label="Refresh service matches" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
							<LoaderCircle className={`h-4 w-4 ${servicesLoading ? "animate-spin" : ""}`} aria-hidden="true" />
						</button>
						<button type="button" onClick={uploadBatch} disabled={uploading || matchedCount === 0} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
							{uploading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UploadCloud className="h-4 w-4" aria-hidden="true" />}
							Upload matched ({matchedCount})
						</button>
					</div>
				</div>

				{servicesError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{servicesError}</p>}
				{!servicesLoading && !servicesError && services.length === 0 && (
					<p role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
						No services are available to match files. Create a service first, then refresh the service list.
					</p>
				)}
				{notice && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">{notice}</p>}
				{uploadProgress && (
					<div role="status" aria-live="polite" className="rounded-xl border border-blue-100 bg-white px-4 py-3 shadow-sm">
						<div className="mb-2 flex items-center justify-between gap-3 text-sm">
							<span className="font-medium text-slate-800">Uploading files</span>
							<span className="text-slate-500">{uploadProgress.completed} of {uploadProgress.total} processed</span>
						</div>
						<div
							role="progressbar"
							aria-label="Bulk upload progress"
							aria-valuemin={0}
							aria-valuemax={uploadProgress.total}
							aria-valuenow={uploadProgress.completed}
							className="h-2 overflow-hidden rounded-full bg-slate-100"
						>
							<div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.round((uploadProgress.completed / uploadProgress.total) * 100)}%` }} />
						</div>
					</div>
				)}

				<button
					type="button"
					aria-label="Choose files to upload or drop them here"
					onClick={() => inputRef.current?.click()}
					onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
					onDragLeave={() => setDragging(false)}
					onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}
					className={`group flex min-h-52 w-full flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 ${dragging ? "border-blue-600 bg-blue-50 ring-4 ring-blue-100" : "border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/40"}`}
				>
					<span className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition ${dragging ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-800"}`}>
						<UploadCloud className="h-6 w-6" aria-hidden="true" />
					</span>
					<span className="text-base font-semibold text-slate-900">Drop files here to upload</span>
					<span className="mt-1 text-sm text-slate-500">Up to {MAX_FILES} files, 25 MB each. Files match to services by reference in the filename.</span>
					<span className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition group-hover:border-blue-200 group-hover:text-blue-800">
						<UploadCloud className="h-4 w-4" aria-hidden="true" />
						Browse files
					</span>
				</button>
				<input
					ref={inputRef}
					type="file"
					accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv"
					multiple
					className="sr-only"
					onChange={(event) => {
						addFiles(Array.from(event.currentTarget.files ?? []));
						event.currentTarget.value = "";
					}}
				/>

				{files.length > 0 && (
					<section aria-label="Files to upload" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
						<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
							<div><h3 className="text-sm font-semibold text-slate-900">Selected files</h3><p className="mt-0.5 text-xs text-slate-500">{files.length} of {MAX_FILES} files · {matchedCount} ready to upload</p></div>
							<button type="button" onClick={() => setFiles([])} disabled={uploading} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">Clear list</button>
						</div>
						<ul className="divide-y divide-slate-100">
							{files.map((entry) => (
								<li key={entry.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(200px,0.8fr)_minmax(140px,0.6fr)_auto] sm:items-center sm:px-5">
									<div className="flex min-w-0 items-center gap-2.5">
										<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><FileText className="h-4 w-4" aria-hidden="true" /></span>
										<div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800" title={entry.file.name}>{entry.file.name}</p><p className="mt-0.5 text-xs text-slate-500">{formatFileSize(entry.file.size)}</p></div>
									</div>
									<label className="sr-only" htmlFor={`service-match-${entry.id}`}>Match {entry.file.name} to service</label>
									<select id={`service-match-${entry.id}`} value={entry.serviceId} disabled={entry.status === "uploaded" || entry.status === "uploading" || servicesLoading} onChange={(event) => assignService(entry, event.target.value)} className="h-10 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50">
										<option value="">Select a service to match</option>
										{services.map((service) => <option key={service.id} value={service.id}>{service.label}</option>)}
									</select>
									<span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${entry.status === "failed" ? "bg-rose-50 text-rose-700" : entry.status === "uploaded" ? "bg-emerald-50 text-emerald-700" : entry.status === "uploading" ? "bg-blue-50 text-blue-700" : entry.serviceId ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{statusLabel(entry)}</span>
									<button type="button" onClick={() => setFiles((current) => current.filter((file) => file.id !== entry.id))} disabled={uploading || entry.status === "uploaded"} aria-label={`Remove ${entry.file.name}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"><X className="h-4 w-4" aria-hidden="true" /></button>
								</li>
							))}
						</ul>
					</section>
				)}

				{batchResults.length > 0 && (
					<section aria-label="Last batch" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
						<div className="border-b border-slate-200 px-4 py-4 sm:px-5"><h3 className="text-sm font-semibold text-slate-900">Last batch</h3><p className="mt-0.5 text-xs text-slate-500">Processed {batchProcessedAt ? new Date(batchProcessedAt).toLocaleString() : "just now"}</p></div>
						<ul className="divide-y divide-slate-100">
							{batchResults.map((result) => <li key={result.key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm sm:px-5"><span className="min-w-0 truncate font-medium text-slate-800">{result.name}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{result.message}</span></li>)}
						</ul>
					</section>
				)}
			</div>
		</EncoderSectionLayout>
	);
}