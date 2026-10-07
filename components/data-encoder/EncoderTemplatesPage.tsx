"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileText, RefreshCw, Search } from "lucide-react";
import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import { useDocumentStore } from "@/features/documents/document.store";
import type { DocumentRecord } from "@/features/documents/document.types";
import { DataEncoderEndpoints } from "@/modules/dataencoder/data-encoder.endpoint";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const readServiceIds = (value: unknown): string[] => {
	let current = value;

	for (let depth = 0; depth < 6; depth += 1) {
		if (Array.isArray(current)) {
			return [...new Set(current.flatMap((row) => {
				if (!isRecord(row)) return [];
				const id = Object.entries(row).find(([key]) => ["id", "serviceid"].includes(key.toLowerCase()))?.[1];
				return (typeof id === "string" || typeof id === "number") && /^\d+$/.test(String(id)) && Number(id) > 0
					? [String(id)]
					: [];
			}))];
		}

		if (!isRecord(current)) return [];
		const nextKey = Object.keys(current).find((key) =>
			["items", "services", "records", "servicelist", "servicerecords", "rows", "data", "payload", "response", "result"]
				.includes(key.toLowerCase()),
		);
		if (!nextKey) return [];
		current = current[nextKey];
	}

	return [];
};

const readFileBlob = (value: unknown): Blob | null => {
	if (value instanceof Blob) return value;
	if (isRecord(value) && value.data instanceof Blob) return value.data;
	return null;
};

const downloadDocument = (document: DocumentRecord, blob: Blob) => {
	const objectUrl = URL.createObjectURL(blob);
	const anchor = window.document.createElement("a");
	anchor.href = objectUrl;
	anchor.download = document.name || `document-${document.id}`;
	window.document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export default function EncoderTemplatesPage() {
	const documents = useDocumentStore((state) => state.documents);
	const loading = useDocumentStore((state) => state.loading);
	const error = useDocumentStore((state) => state.error);
	const fetchDocumentsForServices = useDocumentStore((state) => state.fetchDocumentsForServices);
	const [query, setQuery] = useState("");
	const [servicesError, setServicesError] = useState<string | null>(null);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const [downloadingId, setDownloadingId] = useState<string | null>(null);

	const fetchDocuments = useCallback(async () => {
		try {
			const response = await fetch("/api/encoder/services", { cache: "no-store" });
			const body: unknown = await response.json().catch(() => null);
			setServicesError(null);
			if (!response.ok) {
				const message = isRecord(body) && typeof body.error === "string"
					? body.error
					: "Unable to load services.";
				throw new Error(response.status === 401 ? `${message} Sign in and try again.` : message);
			}

			await fetchDocumentsForServices(readServiceIds(body));
		} catch (loadError: unknown) {
			setServicesError(loadError instanceof Error ? loadError.message : "Unable to load service documents.");
		}
	}, [fetchDocumentsForServices]);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => void fetchDocuments(), 0);
		return () => window.clearTimeout(timeoutId);
	}, [fetchDocuments]);

	const filteredDocuments = useMemo(() => {
		const search = query.trim().toLowerCase();
		if (!search) return documents;
		return documents.filter((document) =>
			[document.name, document.type, document.serviceId, document.serviceStage]
				.some((value) => value.toLowerCase().includes(search)),
		);
	}, [documents, query]);

	const handleDownload = async (document: DocumentRecord) => {
		setDownloadingId(document.id);
		setDownloadError(null);
		try {
			const response = await DataEncoderEndpoints.downloadDocument(document.id);
			const blob = readFileBlob(response);
			if (!blob) throw new Error("The document endpoint did not return a file.");
			downloadDocument(document, blob);
		} catch (requestError: unknown) {
			setDownloadError(requestError instanceof Error ? requestError.message : "Unable to download this document.");
		} finally {
			setDownloadingId(null);
		}
	};

	return (
		<EncoderSectionLayout
			activeSection="templates"
			title="Service documents"
			description="Browse and download documents uploaded to your services."
		>
			<div className="space-y-5">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Document library</p>
						<h2 className="mt-1 text-2xl font-semibold text-slate-950">Service documents</h2>
					</div>
					<div className="flex w-full gap-2 sm:w-auto">
						<label className="relative block min-w-0 flex-1 sm:w-72">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
							<span className="sr-only">Search documents</span>
							<input
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search documents"
								className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
							/>
						</label>
						<button
							type="button"
							onClick={() => void fetchDocuments()}
							disabled={loading}
							aria-label="Refresh documents"
							className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							<span className="sr-only sm:not-sr-only">Refresh</span>
						</button>
					</div>
				</div>

				{servicesError && (
					<p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
						{servicesError}
					</p>
				)}
				{error && (
					<p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
						{error}
					</p>
				)}
				{downloadError && (
					<p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
						{downloadError}
					</p>
				)}

				{loading && documents.length === 0 ? (
					<p role="status" className="rounded-md border border-slate-200 bg-white px-4 py-12 text-center text-sm text-slate-500">
						Loading service documents...
					</p>
				) : filteredDocuments.length > 0 ? (
					<ul className="grid gap-3 lg:grid-cols-2">
						{filteredDocuments.map((document) => (
							<li key={document.id} className="flex min-h-[66px] items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
								<div className="flex min-w-0 items-center gap-2.5">
									<FileText className="h-4 w-4 shrink-0 text-slate-500" />
									<div className="min-w-0">
										<p className="truncate text-sm font-medium text-slate-800" title={document.name}>{document.name}</p>
										<p className="truncate text-xs text-slate-500">
											{document.type} · Service {document.serviceId}
										</p>
									</div>
								</div>
								<button
									type="button"
									onClick={() => void handleDownload(document)}
									disabled={downloadingId !== null}
									className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
								>
									<Download className="h-4 w-4" />
									{downloadingId === document.id ? "Downloading..." : "Download"}
								</button>
							</li>
						))}
					</ul>
				) : (
					<div className="rounded-md border border-slate-200 bg-white px-4 py-12 text-center">
						<FileText className="mx-auto mb-2 h-6 w-6 text-slate-300" />
						<p className="text-sm font-medium text-slate-700">
							{query.trim() ? "No matching documents" : "No service documents found"}
						</p>
						<p className="mt-1 text-xs text-slate-500">
							{query.trim() ? "Try another search." : "Documents uploaded to your services will appear here."}
						</p>
					</div>
				)}
			</div>
		</EncoderSectionLayout>
	);
}
