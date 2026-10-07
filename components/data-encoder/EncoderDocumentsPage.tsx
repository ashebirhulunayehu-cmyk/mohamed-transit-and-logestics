"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import {
	AlertCircle,
	Bell,
	Check,
	CheckCheck,
	Download,
	Eye,
	FileText,
	HelpCircle,
	LoaderCircle,
	Menu,
	RefreshCw,
	Search,
	Trash2,
	UploadCloud,
	X,
} from "lucide-react";
import EncoderSidebar from "@/components/data-encoder/EncoderSidebar";
import { deleteDocument as deleteDocumentById } from "@/features/documents/document.endpoint";
import { useDocumentStore } from "@/features/documents/document.store";
import type { DocumentRecord } from "@/features/documents/document.types";
import { DataEncoderEndpoints } from "@/modules/dataencoder/data-encoder.endpoint";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".jpg", ".jpeg", ".png", ".xlsx", ".csv"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const readUploadError = (value: unknown, status: number): string => {
	if (typeof value === "string" && value.trim()) return value;
	if (isRecord(value)) {
		if (Array.isArray(value.errors)) {
			const messages = value.errors.filter((message): message is string => typeof message === "string" && Boolean(message.trim()));
			if (messages.length) return messages.join("; ");
		}
		if (isRecord(value.errors)) {
			const messages = Object.entries(value.errors).flatMap(([field, errors]) => {
				if (!Array.isArray(errors)) return [];
				return errors.filter((message): message is string => typeof message === "string")
					.map((message) => `${field}: ${message}`);
			});
			if (messages.length) return messages.join("; ");
		}
		for (const key of ["message", "detail", "error", "title"]) {
			const message = value[key];
			if (typeof message === "string" && message.trim()) return message;
		}
	}
	return `Document upload failed (${status}).`;
};

const normalizeServiceId = (value: unknown): string => {
	if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) return String(value);
	if (typeof value === "string" && /^\d+$/.test(value.trim()) && Number(value) > 0) return value.trim();
	return "";
};

const readServiceIds = (value: unknown): string[] => {
	let current = value;
	for (let depth = 0; depth < 6; depth += 1) {
		if (Array.isArray(current)) {
			return [...new Set(current.flatMap((row) => {
				if (!isRecord(row)) return [];
				const id = Object.entries(row).find(([key]) => ["id", "serviceid"].includes(key.toLowerCase()))?.[1];
				const normalized = normalizeServiceId(id);
				return normalized ? [normalized] : [];
			}))];
		}
		if (!isRecord(current)) break;
		const listKey = Object.keys(current).find((key) =>
			["items", "services", "records", "servicelist", "servicerecords", "rows"].includes(key.toLowerCase()),
		);
		const envelopeKey = Object.keys(current).find((key) =>
			["data", "payload", "response", "result"].includes(key.toLowerCase()),
		);
		const nextKey = listKey ?? envelopeKey;
		if (!nextKey) break;
		current = current[nextKey];
	}
	return [];
};

const readServicesResponse = async (response: Response): Promise<unknown> => {
	const body: unknown = await response.json().catch(() => null);
	if (!response.ok) {
		const message = isRecord(body) && typeof body.error === "string"
			? body.error
			: "Unable to load services for document lookup.";
		throw new Error(response.status === 401 ? `${message} Sign in and try again.` : message);
	}
	return body;
};

const formatUploadedAt = (value: string): string => {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value || "Date unavailable";
	return new Intl.DateTimeFormat(undefined, {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(date);
};

const statusTone = (status: DocumentRecord["status"]): string => {
	switch (status) {
		case "Verified":
			return "border-emerald-200 bg-emerald-50 text-emerald-800";
		case "Flagged":
			return "border-amber-200 bg-amber-50 text-amber-800";
		case "Rejected":
			return "border-rose-200 bg-rose-50 text-rose-800";
		default:
			return "border-blue-200 bg-blue-50 text-blue-800";
	}
};

const fileValidationMessage = (file: File): string | null => {
	const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
	if (!ALLOWED_EXTENSIONS.has(extension)) return "Use a PDF, JPG, PNG, XLSX, or CSV file.";
	if (file.size > MAX_FILE_SIZE) return "Each document must be 25 MB or smaller.";
	return null;
};

const readDocumentBlob = (response: unknown): Blob | null => {
	if (response instanceof Blob) return response;
	if (isRecord(response) && response.data instanceof Blob) return response.data;
	return null;
};

const getPreviewType = (document: DocumentRecord, blob: Blob): string => {
	if (blob.type) return blob.type;
	const extension = document.name.slice(document.name.lastIndexOf(".")).toLowerCase();
	if (extension === ".pdf") return "application/pdf";
	if ([".jpg", ".jpeg"].includes(extension)) return "image/jpeg";
	if (extension === ".png") return "image/png";
	return "application/octet-stream";
};

export default function EncoderDocumentsPage() {
	const documents = useDocumentStore((state) => state.documents);
	const loading = useDocumentStore((state) => state.loading);
	const error = useDocumentStore((state) => state.error);
	const fetchDocumentsForServices = useDocumentStore((state) => state.fetchDocumentsForServices);
	const searchQuery = useDocumentStore((state) => state.searchQuery);
	const statusFilter = useDocumentStore((state) => state.statusFilter);
	const typeFilter = useDocumentStore((state) => state.typeFilter);
	const setSearchQuery = useDocumentStore((state) => state.setSearchQuery);
	const setStatusFilter = useDocumentStore((state) => state.setStatusFilter);
	const setTypeFilter = useDocumentStore((state) => state.setTypeFilter);
	const getFilteredDocuments = useDocumentStore((state) => state.getFilteredDocuments);
	const [serviceIds, setServiceIds] = useState<string[]>([]);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [uploadOpen, setUploadOpen] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [serviceId, setServiceId] = useState("");
	const [serviceStageId, setServiceStageId] = useState("");
	const [documentType, setDocumentType] = useState("");
	const [description, setDescription] = useState("");
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [servicesError, setServicesError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<DocumentRecord | null>(null);
	const [verifyingDocumentId, setVerifyingDocumentId] = useState<string | null>(null);
	const [preview, setPreview] = useState<{ document: DocumentRecord; url: string; contentType: string } | null>(null);
	const filteredDocuments = getFilteredDocuments();
	const types = [...new Set(documents.map((document) => document.type).filter(Boolean))].sort();
	const verifiedCount = documents.filter((document) => document.status === "Verified").length;
	const flaggedCount = documents.filter((document) => document.status === "Flagged").length;
	const rejectedCount = documents.filter((document) => document.status === "Rejected").length;

	useEffect(() => {
		const controller = new AbortController();
		const loadDocuments = async () => {
			setServicesError(null);
			try {
				const response = await fetch("/api/encoder/services", {
					cache: "no-store",
					signal: controller.signal,
				});
				const body = await readServicesResponse(response);
				const serviceIds = readServiceIds(body);
				setServiceIds(serviceIds);
				await fetchDocumentsForServices(serviceIds);
			} catch (loadError: unknown) {
				if (!controller.signal.aborted) {
					setServicesError(loadError instanceof Error ? loadError.message : "Unable to load services for document lookup.");
				}
			}
		};
		void loadDocuments();
		return () => controller.abort();
	}, [fetchDocumentsForServices]);

	useEffect(() => {
		if (!preview) return;
		return () => URL.revokeObjectURL(preview.url);
	}, [preview]);

	const refreshUploadedServiceDocuments = async (uploadedServiceId: number) => {
		const nextServiceIds = [...new Set([...serviceIds, String(uploadedServiceId)])];
		setServiceIds(nextServiceIds);
		await fetchDocumentsForServices(nextServiceIds);
	};

	const handleRefresh = async () => {
		setServicesError(null);
		try {
			const response = await fetch("/api/encoder/services", { cache: "no-store" });
			const body = await readServicesResponse(response);
			const nextServiceIds = readServiceIds(body);
			setServiceIds(nextServiceIds);
			await fetchDocumentsForServices(nextServiceIds);
		} catch (refreshError: unknown) {
			setServicesError(refreshError instanceof Error ? refreshError.message : "Unable to load services for document lookup.");
		}
	};

	const acceptFiles = (files: File[]) => {
		if (!files.length) return;
		const invalidFile = files.find((file) => fileValidationMessage(file));
		if (invalidFile) {
			setUploadError(`${invalidFile.name}: ${fileValidationMessage(invalidFile)}`);
			return;
		}
		setUploadError(null);
		setNotice(null);
		setSelectedFiles((current) => {
			const existing = new Set(current.map((file) => `${file.name}:${file.size}:${file.lastModified}`));
			return [...current, ...files.filter((file) => !existing.has(`${file.name}:${file.size}:${file.lastModified}`))];
		});
		setUploadOpen(true);
	};

	const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const serviceNumber = Number(serviceId);
		const stageNumber = Number(serviceStageId);
		if (!selectedFiles.length) {
			setUploadError("Select at least one file to upload.");
			return;
		}
		if (!Number.isSafeInteger(serviceNumber) || serviceNumber <= 0 || !Number.isSafeInteger(stageNumber) || stageNumber <= 0) {
			setUploadError("Service ID and service stage ID must be positive whole numbers.");
			return;
		}
		if (!documentType.trim()) {
			setUploadError("Enter a document type.");
			return;
		}

		setUploadError(null);
		setNotice(null);
		setUploading(true);
		let uploadedCount = 0;
		for (const file of selectedFiles) {
			const formData = new FormData();
			formData.append("File", file, file.name);
			formData.append("ServiceId", String(serviceNumber));
			formData.append("ServiceStageId", String(stageNumber));
			formData.append("DocumentType", documentType.trim());
			formData.append("Description", description.trim());
			try {
				const response = await fetch("/api/encoder/documents", {
					method: "POST",
					body: formData,
				});
				const responseText = await response.text();
				let responseBody: unknown = responseText;
				if (responseText.trim()) {
					try {
						responseBody = JSON.parse(responseText) as unknown;
					} catch {
						responseBody = responseText;
					}
				}
				if (!response.ok) throw new Error(readUploadError(responseBody, response.status));
				uploadedCount += 1;
			} catch (uploadFailure: unknown) {
				const message = uploadFailure instanceof Error
					? uploadFailure.message
					: typeof uploadFailure === "string" && uploadFailure.trim()
						? uploadFailure
						: "Document upload failed.";
				setSelectedFiles((current) => current.slice(uploadedCount));
				if (uploadedCount) await refreshUploadedServiceDocuments(serviceNumber);
				setUploadError(uploadedCount ? `Uploaded ${uploadedCount} of ${selectedFiles.length} files. ${message}` : message);
				setUploading(false);
				return;
			}
		}

		await refreshUploadedServiceDocuments(serviceNumber);
		setUploading(false);
		setNotice(`${uploadedCount} ${uploadedCount === 1 ? "document" : "documents"} uploaded successfully.`);
		setSelectedFiles([]);
		setServiceId("");
		setServiceStageId("");
		setDocumentType("");
		setDescription("");
		setUploadOpen(false);
	};

	const handleDownload = async (document: DocumentRecord) => {
		try {
			const response = await DataEncoderEndpoints.downloadDocument(document.id);
			const blob = readDocumentBlob(response);
			if (!blob) throw new Error("The document endpoint did not return a file.");
			const objectUrl = URL.createObjectURL(blob);
			const link = window.document.createElement("a");
			link.href = objectUrl;
			link.download = document.name;
			link.click();
			window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
		} catch (downloadError: unknown) {
			setNotice(downloadError instanceof Error ? downloadError.message : "Unable to download this document.");
		}
	};

	const handlePreview = async (document: DocumentRecord) => {
		try {
			const response = await DataEncoderEndpoints.downloadDocument(document.id);
			const blob = readDocumentBlob(response);
			if (!blob) throw new Error("The document endpoint did not return a file.");
			setPreview({ document, url: URL.createObjectURL(blob), contentType: getPreviewType(document, blob) });
		} catch (previewError: unknown) {
			setNotice(previewError instanceof Error ? previewError.message : "Unable to preview this document.");
		}
	};

	const handleVerify = async (document: DocumentRecord) => {
		setVerifyingDocumentId(document.id);
		try {
			await DataEncoderEndpoints.verifyDocument({
				documentId: document.id,
				isVerified: true,
				notes: "Verified by data encoder",
				verificationNotes: "Verified by data encoder",
			});
			await fetchDocumentsForServices(serviceIds);
			setNotice(`${document.name} was verified.`);
		} catch (verificationError: unknown) {
			setNotice(verificationError instanceof Error ? verificationError.message : "Unable to verify this document.");
		} finally {
			setVerifyingDocumentId(null);
		}
	};

	const confirmDelete = async () => {
		if (!deleteTarget) return;
		try {
			await deleteDocumentById(deleteTarget.id);
			await fetchDocumentsForServices(serviceIds);
			setNotice(`${deleteTarget.name} was deleted.`);
			setDeleteTarget(null);
		} catch (deleteError: unknown) {
			setNotice(deleteError instanceof Error ? deleteError.message : "Unable to delete this document.");
		}
	};

	return (
		<div className="min-h-screen bg-[#f6f7f9] text-slate-900">
			<EncoderSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} activeSection="documents" />
			<div className="min-h-screen lg:pl-[270px]">
				<header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
					<button type="button" aria-label="Open navigation" aria-expanded={sidebarOpen} onClick={() => setSidebarOpen(true)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
					<label className="relative flex h-10 min-w-0 max-w-[540px] flex-1 items-center">
						<Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
						<span className="sr-only">Search services, customers, and documents</span>
						<input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search services, customers, documents..." className="h-full w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100" />
					</label>
					<div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
						<button type="button" title="Notifications" aria-label="Notifications" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"><Bell className="h-4 w-4" /></button>
						<button type="button" title="Help" aria-label="Help" className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"><HelpCircle className="h-4 w-4" /></button>
						<div className="flex items-center gap-2 border-l border-slate-200 pl-3"><div className="flex h-8 w-8 items-center justify-center rounded-sm bg-blue-100 text-xs font-semibold text-blue-800">DE</div><div className="hidden sm:block"><p className="text-xs font-semibold text-slate-800">Data Encoder</p><p className="text-[10px] text-slate-500">Import Operations</p></div></div>
					</div>
				</header>
				<main className="mx-auto max-w-[1600px] space-y-5 p-4 sm:p-6 lg:p-8">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Document centre</p>
						<h1 className="mt-1 text-2xl font-semibold text-slate-950">Documents</h1>
						<p className="mt-1 text-sm text-slate-600">Every file attached to a case, with its verification state and audit history.</p>
					</div>
			<section aria-label="Document totals" className="flex flex-wrap items-center gap-2">
				<span className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700">{documents.length} documents</span>
				<span className="rounded border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800">{verifiedCount} verified</span>
				<span className="rounded border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800">{flaggedCount} flagged</span>
				<span className="rounded border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-800">{rejectedCount} rejected</span>
				<div className="ml-auto flex gap-2">
					<button type="button" onClick={() => void handleRefresh()} disabled={loading} title="Refresh documents" aria-label="Refresh documents" className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50">
						<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
					</button>
					<button type="button" onClick={() => { setUploadError(null); setUploadOpen(true); }} className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800">
						<UploadCloud className="h-4 w-4" /> Upload document
					</button>
				</div>
			</section>

			{notice && (
				<div role="status" className="flex items-center justify-between gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
					<span className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" />{notice}</span>
					<button type="button" onClick={() => setNotice(null)} aria-label="Dismiss message" className="rounded p-1 hover:bg-emerald-100"><X className="h-4 w-4" /></button>
				</div>
			)}
			{(servicesError || error) && (
				<div role="alert" className="space-y-1 rounded-md border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
					{servicesError && <p>Service lookup: {servicesError}</p>}
					{error && <p>Document list: {error}</p>}
				</div>
			)}

			<section aria-label="Document list" className="overflow-hidden rounded-lg border border-slate-200 bg-white">
				<div className="flex justify-end gap-2 border-b border-slate-200 p-3">
					<div className="flex gap-2">
						<label>
							<span className="sr-only">Filter by status</span>
							<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
								<option value="ALL">All statuses</option>
								<option value="Verified">Verified</option>
								<option value="Flagged">Flagged</option>
								<option value="Pending check">Pending check</option>
								<option value="Rejected">Rejected</option>
							</select>
						</label>
						<label>
							<span className="sr-only">Filter by document type</span>
							<select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-10 max-w-[170px] rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
								<option value="ALL">All types</option>
								{types.map((type) => <option key={type} value={type}>{type}</option>)}
							</select>
						</label>
					</div>
				</div>

				<div className="overflow-x-auto">
					<table className="w-full min-w-[850px] border-collapse text-left">
						<thead className="bg-slate-50 text-[11px] font-semibold uppercase text-slate-500">
							<tr className="border-b border-slate-200">
								<th className="px-4 py-3">Document</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Service / stage</th><th className="px-4 py-3">Uploaded by</th><th className="px-4 py-3">Uploaded</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 text-sm">
							{loading && !documents.length ? (
								<tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500"><LoaderCircle className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading documents</td></tr>
							) : filteredDocuments.length ? filteredDocuments.map((document) => (
								<tr key={document.id} className="hover:bg-slate-50/70">
									<td className="max-w-[300px] px-4 py-3.5"><span className="flex min-w-0 items-center gap-2.5"><FileText className="h-4 w-4 shrink-0 text-slate-500" /><span className="truncate font-medium text-slate-800" title={document.name}>{document.name}</span></span></td>
									<td className="px-4 py-3.5 text-slate-600">{document.type}</td>
									<td className="px-4 py-3.5"><span className="block font-semibold text-slate-800">{document.serviceId}</span><span className="mt-0.5 block text-xs text-slate-500">{document.serviceStage}</span></td>
									<td className="px-4 py-3.5 text-slate-700">{document.uploadedBy}</td>
									<td className="px-4 py-3.5 whitespace-nowrap text-slate-500">{formatUploadedAt(document.uploadedAt)}</td>
									<td className="px-4 py-3.5"><span className={`inline-flex whitespace-nowrap rounded border px-2 py-1 text-xs font-medium ${statusTone(document.status)}`}>{document.status}</span></td>
									<td className="px-4 py-3.5"><div className="flex justify-end gap-1">
										<button type="button" onClick={() => void handlePreview(document)} disabled={loading} title={`Preview ${document.name}`} aria-label={`Preview ${document.name}`} className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"><Eye className="h-4 w-4" /></button>
										<button type="button" onClick={() => void handleDownload(document)} disabled={loading} title={`Download ${document.name}`} aria-label={`Download ${document.name}`} className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"><Download className="h-4 w-4" /></button>
										{document.status === "Pending check" && <button type="button" onClick={() => void handleVerify(document)} disabled={loading || verifyingDocumentId === document.id} title={`Verify ${document.name}`} aria-label={`Verify ${document.name}`} className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"><CheckCheck className="h-4 w-4" /></button>}
										<button type="button" onClick={() => setDeleteTarget(document)} disabled={loading} title={`Delete ${document.name}`} aria-label={`Delete ${document.name}`} className="flex h-8 w-8 items-center justify-center rounded text-slate-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
									</div></td>
								</tr>
							)) : (
								<tr><td colSpan={7} className="px-4 py-14 text-center"><FileText className="mx-auto mb-2 h-6 w-6 text-slate-300" /><p className="text-sm font-medium text-slate-700">No documents found</p><p className="mt-1 text-xs text-slate-500">Try another filter or upload a service document.</p></td></tr>
							)}
						</tbody>
					</table>
				</div>
				<div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Showing {filteredDocuments.length} of {documents.length} documents</div>
			</section>

			{uploadOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
					<section role="dialog" aria-modal="true" aria-labelledby="upload-title" className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
						<div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
							<div><h2 id="upload-title" className="text-base font-semibold text-slate-900">Upload service documents</h2><p className="mt-1 text-sm text-slate-500">Attach files to a service and stage.</p></div>
							<button type="button" onClick={() => setUploadOpen(false)} aria-label="Close upload dialog" className="rounded p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
						</div>
						<form onSubmit={(event) => void handleUpload(event)} className="space-y-4 px-5 py-4">
							<label className="block text-sm font-medium text-slate-700">Files
								<input type="file" multiple required={!selectedFiles.length} accept=".pdf,.jpg,.jpeg,.png,.xlsx,.csv" onChange={(event) => acceptFiles(Array.from(event.currentTarget.files ?? []))} className="mt-1.5 block w-full rounded-md border border-slate-200 text-sm text-slate-700 file:mr-3 file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium" />
							</label>
							{selectedFiles.length > 0 && <ul className="max-h-24 space-y-1 overflow-y-auto rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">{selectedFiles.map((file) => <li key={`${file.name}:${file.lastModified}`} className="truncate">{file.name} <span className="text-slate-400">({(file.size / 1024 / 1024).toFixed(1)} MB)</span></li>)}</ul>}
							<div className="grid gap-3 sm:grid-cols-2">
								<label className="block text-sm font-medium text-slate-700">Service ID<input required type="number" min="1" step="1" value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
								<label className="block text-sm font-medium text-slate-700">Service stage ID<input required type="number" min="1" step="1" value={serviceStageId} onChange={(event) => setServiceStageId(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
							</div>
							<label className="block text-sm font-medium text-slate-700">Document type<input required value={documentType} onChange={(event) => setDocumentType(event.target.value)} placeholder="e.g. Commercial Invoice" className="mt-1.5 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
							<label className="block text-sm font-medium text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
							{uploadError && <p role="alert" className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{uploadError}</p>}
							<div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
								<button type="button" onClick={() => setUploadOpen(false)} className="h-9 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
								<button type="submit" disabled={loading || uploading} className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{uploading && <LoaderCircle className="h-4 w-4 animate-spin" />}Upload {selectedFiles.length || "documents"}</button>
							</div>
						</form>
					</section>
				</div>
			)}

			{deleteTarget && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
					<section role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
						<h2 id="delete-title" className="text-base font-semibold text-slate-900">Delete document?</h2>
						<p className="mt-2 break-words text-sm text-slate-600">{deleteTarget.name} will be removed from this service.</p>
						<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setDeleteTarget(null)} className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-700 hover:bg-slate-50">Cancel</button><button type="button" onClick={() => void confirmDelete()} disabled={loading} className="h-9 rounded-md bg-rose-700 px-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60">Delete</button></div>
					</section>
				</div>
			)}

			{preview && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
					<section role="dialog" aria-modal="true" aria-labelledby="preview-title" className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
						<header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
							<div className="min-w-0"><h2 id="preview-title" className="truncate text-sm font-semibold text-slate-900">{preview.document.name}</h2><p className="mt-0.5 text-xs text-slate-500">{preview.document.type} · {preview.document.serviceId}</p></div>
							<div className="flex shrink-0 items-center gap-1">
								<button type="button" onClick={() => void handleDownload(preview.document)} title="Download document" aria-label="Download document" className="flex h-9 w-9 items-center justify-center rounded text-slate-600 hover:bg-slate-100"><Download className="h-4 w-4" /></button>
								<button type="button" onClick={() => setPreview(null)} title="Close preview" aria-label="Close preview" className="flex h-9 w-9 items-center justify-center rounded text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button>
							</div>
						</header>
						<div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-3 sm:p-5">
							{preview.contentType === "application/pdf" ? (
								<iframe title={`Preview ${preview.document.name}`} src={preview.url} className="h-[70dvh] min-h-[360px] w-full rounded border border-slate-200 bg-white" />
							) : preview.contentType.startsWith("image/") ? (
								<Image src={preview.url} alt={preview.document.name} width={1200} height={900} unoptimized className="mx-auto h-auto max-h-[75dvh] w-auto max-w-full object-contain" />
							) : (
								<div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded border border-slate-200 bg-white p-6 text-center">
									<FileText className="h-8 w-8 text-slate-400" />
									<div><p className="text-sm font-medium text-slate-800">Preview isn’t available for this file type.</p><p className="mt-1 text-xs text-slate-500">Download the document to open it.</p></div>
									<button type="button" onClick={() => void handleDownload(preview.document)} className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-700 px-3 text-sm font-semibold text-white hover:bg-blue-800"><Download className="h-4 w-4" />Download</button>
								</div>
							)}
						</div>
					</section>
				</div>
			)}
				</main>
			</div>
		</div>
	);
}