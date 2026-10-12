"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	AlertCircle,
	CheckCircle,
	Check,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	FileText,
	LoaderCircle,
	Save,
	UploadCloud,
	X,
} from "lucide-react";
import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import {
	deleteEncoderServiceDraft,
	getEncoderServiceDraft,
	saveEncoderServiceDraft,
	type EncoderServiceDraft,
} from "@/modules/dataencoder/data-encoder.drafts";
import {
	readCreatedServiceId,
	readCreatedServiceIdFromLocation,
	readJsonResponse,
} from "@/modules/dataencoder/data-encoder.response";

type CustomerOption = {
	id: string;
	businessName: string;
	tinNumber: string;
	contactPerson: string;
	contactEmail: string;
	contactPhone: string;
};

type ServiceForm = {
	customerId: string;
	serviceType: string;
	routeCategory: string;
	itemDescription: string;
	countryOfOrigin: string;
	declaredValue: string;
	taxCategory: string;
};

type DocumentUpload = {
	id: string;
	file: File;
};

type CreatedService = {
	serviceId: string;
	documentsUploaded: boolean;
};

const steps = ["Importer", "Service type", "Consignment", "Documents", "Review & submit"];
const MAX_DOCUMENT_SIZE = 25 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
	"application/pdf",
	"image/jpeg",
	"image/png",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);
const ALLOWED_DOCUMENT_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".xlsx"];
const emptyForm: ServiceForm = {
	customerId: "",
	serviceType: "",
	routeCategory: "",
	itemDescription: "",
	countryOfOrigin: "",
	declaredValue: "",
	taxCategory: "General",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const readText = (value: unknown): string =>
	typeof value === "string" || typeof value === "number" ? String(value) : "";

const findValue = (record: Record<string, unknown>, ...names: string[]): unknown => {
	const key = Object.keys(record).find((candidate) =>
		names.some((name) => name.toLowerCase() === candidate.toLowerCase()),
	);
	return key ? record[key] : undefined;
};

const unwrapRows = (value: unknown): Record<string, unknown>[] => {
	let current = value;
	for (let depth = 0; depth < 6; depth += 1) {
		if (Array.isArray(current)) {
			if (!current.every(isRecord)) throw new Error("The backend returned an invalid record list.");
			return current;
		}
		if (!isRecord(current)) break;
		const key = Object.keys(current).find((name) =>
			["data", "payload", "response", "items", "customers", "requirements", "result"].includes(name.toLowerCase()),
		);
		if (!key) break;
		current = current[key];
	}
	throw new Error("The backend response did not contain a record list.");
};

const responseError = (body: unknown, fallback: string): string => {
	if (!isRecord(body)) return typeof body === "string" && body.trim() ? body : fallback;
	for (const key of ["message", "detail", "error", "title"]) {
		const value = body[key];
		if (typeof value === "string" && value.trim()) return value;
	}
	if (Array.isArray(body.errors)) {
		const messages = body.errors.filter(
			(value): value is string => typeof value === "string" && Boolean(value.trim()),
		);
		if (messages.length) return messages.join("; ");
	}
	return fallback;
};

const readApiResponse = async (response: Response, fallback: string): Promise<unknown> => {
	const body = await readJsonResponse(response);
	if (
		!response.ok ||
		(isRecord(body) &&
			(body.error === true ||
				body.isError === true ||
				(typeof body.statusCode === "number" && body.statusCode >= 400)))
	) {
		throw new Error(responseError(body, `${fallback} (${response.status}).`));
	}
	return body;
};

const validateDocumentFile = (file: File): string | null => {
	const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
	if (!ALLOWED_DOCUMENT_TYPES.has(file.type) && !ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)) {
		return "Use a PDF, JPG, PNG, or XLSX file.";
	}
	if (file.size > MAX_DOCUMENT_SIZE) {
		return "Each document must be 25 MB or smaller.";
	}
	return null;
};

export default function EncoderServiceWizard() {
	const pathname = usePathname();
	const router = useRouter();
	const firstSegment = pathname.split("/").filter(Boolean)[0];
	const locale = firstSegment === "am" || firstSegment === "en" ? firstSegment : "en";
	const encoderBase = `/${locale}/admin/data-encoder`;
	const [step, setStep] = useState(0);
	const [form, setForm] = useState<ServiceForm>(emptyForm);
	const [notes, setNotes] = useState("");
	const [documentFiles, setDocumentFiles] = useState<DocumentUpload[]>([]);
	const [createdService, setCreatedService] = useState<CreatedService | null>(null);
	const [customers, setCustomers] = useState<CustomerOption[]>([]);
	const [customersLoading, setCustomersLoading] = useState(true);
	const [customerError, setCustomerError] = useState<string | null>(null);
	const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const selectedCustomer = useMemo(
		() => customers.find((customer) => customer.id === form.customerId),
		[customers, form.customerId],
	);

	useEffect(() => {
		const controller = new AbortController();
		const loadCustomers = async () => {
			setCustomersLoading(true);
			setCustomerError(null);
			try {
				const response = await fetch("/api/encoder/customers?recordStatus=1", {
					cache: "no-store",
					signal: controller.signal,
				});
				const body: unknown = response.status === 204 ? [] : await response.json();
				if (!response.ok) throw new Error(responseError(body, `Customer list failed (${response.status}).`));
				const nextCustomers = unwrapRows(body).map((record, index) => ({
						id: readText(findValue(record, "id", "customerId")) || `customer-${index + 1}`,
						businessName: readText(findValue(record, "businessName", "companyName")),
						tinNumber: readText(findValue(record, "tinNumber", "tin")),
						contactPerson: readText(findValue(record, "contactPerson", "fullName")),
						contactEmail: readText(findValue(record, "contactEmail", "email")),
						contactPhone: readText(findValue(record, "contactPhone", "phone")),
					}));
				setCustomers(nextCustomers);
				setForm((current) => (
					current.customerId || !nextCustomers.length
						? current
						: { ...current, customerId: nextCustomers[0].id }
				));
			} catch (loadError: unknown) {
				if (!controller.signal.aborted) {
					setCustomerError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
				}
			} finally {
				if (!controller.signal.aborted) setCustomersLoading(false);
			}
		};
		void loadCustomers();
		return () => controller.abort();
	}, []);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => {
			const draftId = new URLSearchParams(window.location.search).get("draftId");
			if (!draftId) return;
			try {
				const draft = getEncoderServiceDraft(draftId);
				if (!draft) {
					setError("This saved draft could not be found in this browser.");
					return;
				}
				setForm({
					customerId: draft.customerId,
					serviceType: draft.serviceType,
					routeCategory: draft.routeCategory,
					itemDescription: draft.itemDescription,
					countryOfOrigin: draft.countryOfOrigin,
					declaredValue: draft.declaredValue,
					taxCategory: draft.taxCategory,
				});
				setNotes(draft.notes ?? "");
				setActiveDraftId(draft.id);
				setNotice(`Draft ${draft.id} is ready to continue.`);
			} catch (loadError: unknown) {
				setError(loadError instanceof Error ? loadError.message : "Unable to open the saved draft.");
			}
		}, 0);
		return () => window.clearTimeout(timeoutId);
	}, []);

	const updateField = (field: keyof ServiceForm, value: string) => {
		setForm((current) => ({ ...current, [field]: value }));
		setError(null);
	};

	const validateStepFor = (index: number) => {
		if (index === 0 && (!Number.isSafeInteger(Number(form.customerId)) || Number(form.customerId) <= 0)) {
			return "Choose a valid importer before continuing.";
		}
		if (index === 1 && form.serviceType !== "Multimodal" && form.serviceType !== "Unimodal") {
			return "Choose a service type.";
		}
		if (index === 2) {
			if (!form.routeCategory.trim() || !form.itemDescription.trim() || !form.countryOfOrigin.trim()) {
				return "Complete the route, goods description, and country of origin.";
			}
			if (!form.declaredValue.trim()) {
				return "Enter the declared value.";
			}
			const declaredValue = Number(form.declaredValue);
			if (!Number.isFinite(declaredValue) || declaredValue < 0) {
				return "Enter a valid non-negative declared value.";
			}
			if (!form.taxCategory.trim()) {
				return "Enter a tax category.";
			}
		}
		return null;
	};

	const validateStep = () => validateStepFor(step);

	const moveNext = () => {
		const validationError = validateStep();
		if (validationError) {
			setError(validationError);
			return;
		}
		setError(null);
		setStep((current) => Math.min(current + 1, steps.length - 1));
	};

	const removeDocumentFile = (documentId: string) => {
		setError(null);
		setDocumentFiles((current) => current.filter((document) => document.id !== documentId));
	};

	const addDocumentFiles = (files: File[]) => {
		if (!files.length) return;
		const invalidFile = files.find((file) => validateDocumentFile(file) !== null);
		if (invalidFile) {
			setError(`${invalidFile.name}: ${validateDocumentFile(invalidFile)}`);
			return;
		}
		setError(null);
		setDocumentFiles((current) => [
			...current,
			...files.map((file) => ({ id: crypto.randomUUID(), file })),
		]);
	};

	const saveDraft = () => {
		setError(null);
		setNotice(null);
		const now = new Date().toISOString();
		const id = activeDraftId ?? `DRF-${now.slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
		try {
			const existing = activeDraftId ? getEncoderServiceDraft(activeDraftId) : undefined;
			const draft: EncoderServiceDraft = {
				id,
				type: "Service",
				createdAt: existing?.createdAt ?? now,
				updatedAt: now,
				customerId: form.customerId,
				serviceType: form.serviceType,
				routeCategory: form.routeCategory,
				itemDescription: form.itemDescription,
				countryOfOrigin: form.countryOfOrigin,
				declaredValue: form.declaredValue,
				taxCategory: form.taxCategory,
				notes,
			};
			saveEncoderServiceDraft(draft);
			setActiveDraftId(id);
			setNotice(`Draft ${id} saved in this browser.`);
		} catch (saveError: unknown) {
			setError(saveError instanceof Error ? saveError.message : "Unable to save this draft.");
		}
	};

	const submitService = async () => {
		for (let index = 0; index <= 3; index += 1) {
			const validationError = validateStepFor(index);
			if (validationError) {
				setStep(index);
				setError(validationError);
				return;
			}
		}
		setBusy(true);
		setError(null);
		setNotice(null);
		try {
			let currentService = createdService;
			if (!currentService) {
				const response = await fetch("/api/encoder/services", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						customerId: Number(form.customerId),
						itemDescription: form.itemDescription.trim(),
						routeCategory: form.routeCategory.trim(),
						declaredValue: Number(form.declaredValue),
						taxCategory: form.taxCategory.trim() || "General",
						countryOfOrigin: form.countryOfOrigin.trim(),
						serviceType: form.serviceType,
						notes: notes.trim(),
					}),
				});
				const body = await readApiResponse(response, "Service creation failed");
				const serviceId =
					readCreatedServiceId(body) ||
					readCreatedServiceIdFromLocation(response.headers.get("Location"));
				if (!serviceId || !Number.isSafeInteger(Number(serviceId)) || Number(serviceId) <= 0) {
					throw new Error("The service was created, but the API did not return a valid service ID. Contact support before retrying to avoid creating a duplicate.");
				}
				currentService = {
					serviceId,
					documentsUploaded: false,
				};
				setCreatedService(currentService);
			}

			if (!currentService.documentsUploaded && documentFiles.length) {
				const formData = new FormData();
				documentFiles.forEach(({ file }) => formData.append("files", file, file.name));
				formData.append("DocumentType", "Supporting Document");
				const response = await fetch(`/api/encoder/services/${encodeURIComponent(currentService.serviceId)}/documents`, {
					method: "POST",
					body: formData,
				});
				await readApiResponse(response, "Document upload failed");
				currentService = { ...currentService, documentsUploaded: true };
				setCreatedService(currentService);
			}

			const response = await fetch(`/api/encoder/services/${encodeURIComponent(currentService.serviceId)}/submit`, {
				method: "POST",
			});
			await readApiResponse(response, "Service submission failed");
			let successMessage = `Service ${currentService.serviceId} submitted successfully.`;
			if (activeDraftId) {
				try {
					deleteEncoderServiceDraft(activeDraftId);
				} catch (deleteError: unknown) {
					successMessage = `Service submitted successfully, but draft ${activeDraftId} could not be removed from this browser: ${
						deleteError instanceof Error ? deleteError.message : "storage error"
					}`;
				}
			}
			setActiveDraftId(null);
			setNotice(successMessage);
			setStep(4);
			const servicesHref = pathname === "/encoder/services/new"
				? "/encoder/services"
				: `${encoderBase}/services`;
			router.push(`${servicesHref}?serviceId=${encodeURIComponent(currentService.serviceId)}`);
		} catch (submitError: unknown) {
			setError(
				submitError instanceof Error
					? submitError.message
					: typeof submitError === "string" && submitError.trim()
						? submitError
						: "Unable to submit this service.",
			);
		} finally {
			setBusy(false);
		}
	};

	const inputClass = "mt-1.5 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
	const labelClass = "block text-xs font-semibold text-slate-700";
	const isStepComplete = (index: number) => {
		return validateStepFor(index) === null;
	};
	const renderStep = (label: string, index: number) => {
		const completed = isStepComplete(index);
		const active = index === step;
		return (
			<button
				key={label}
				type="button"
				disabled={busy || Boolean(createdService)}
				onClick={() => {
					setError(null);
					setStep(index);
				}}
				aria-current={active ? "step" : undefined}
				className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition ${
					active ? "bg-blue-50 font-semibold text-blue-800" : completed ? "text-slate-700 hover:bg-slate-50" : "text-slate-500 hover:bg-slate-50"
				}`}
			>
				<span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
					active ? "border-blue-700 bg-white text-blue-700" : completed ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300 bg-white text-slate-500"
				}`}>
					{completed ? <Check className="h-3.5 w-3.5" /> : index + 1}
				</span>
				{label}
			</button>
		);
	};

	return (
		<EncoderSectionLayout
			activeSection="create-service"
			title="Create service"
			description="Capture a new import case. Save your progress as a draft at any step."
		>
			<section className="rounded-xl border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-200 px-5 py-4 sm:px-7">
					<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Service registration</p>
					<h2 className="mt-1 text-xl font-semibold text-slate-900">Create service</h2>
					<p className="mt-1 text-sm text-slate-500">Capture a new import case — your progress can be saved as a draft.</p>
				</div>

				<div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8 lg:p-7">
					<nav aria-label="Service creation steps" className="space-y-1 lg:sticky lg:top-[92px] lg:max-h-[calc(100dvh-120px)] lg:self-start lg:overflow-y-auto">
						<div className="sticky top-0 z-10 bg-slate-50 pb-1">
							{renderStep("Importer", 0)}
						</div>
						{steps.slice(1).map((label, index) => renderStep(label, index + 1))}
						<p className="mt-4 px-3 text-xs text-slate-500">Step {step + 1} of {steps.length}</p>
					</nav>

					<div className="min-w-0">
						<div className="mb-5 border-b border-slate-200 pb-3">
							<h3 className="text-sm font-semibold text-slate-900">{steps[step]}</h3>
							<p className="mt-1 text-xs text-slate-500">
								{step === 0 && "Confirm the importer and contact details for this service."}
								{step === 1 && "Select the service processing type."}
								{step === 2 && "Enter the shipment and consignment details."}
								{step === 3 && "Attach any supporting documents to upload with the service."}
								{step === 4 && "Check the details before submitting for processing."}
							</p>
						</div>

						{customerError && step === 0 && <p role="alert" className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{customerError}</p>}
						{error && <p role="alert" className="mb-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
						{notice && <p role="status" className="mb-4 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{notice}</p>}

						{step === 0 && (
							<div className="space-y-4">
								<label className={labelClass}>
									Importer
									<select
										value={form.customerId}
										onChange={(event) => updateField("customerId", event.target.value)}
										disabled={customersLoading || Boolean(customerError)}
										className={inputClass}
									>
										<option value="">{customersLoading ? "Loading importers…" : "Select an importer"}</option>
										{customers.map((customer) => (
											<option key={customer.id} value={customer.id}>
												{customer.businessName || customer.id} · {customer.tinNumber || "TIN unavailable"}
											</option>
										))}
									</select>
								</label>
								{!customersLoading && customers.length === 0 && !customerError && (
									<div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
										<p className="font-semibold">No active importers are available.</p>
										<Link href={`${encoderBase}/customers`} className="mt-2 inline-flex font-semibold text-blue-800 underline underline-offset-2">Create a customer first</Link>
									</div>
								)}
								<div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
									<label className={labelClass}>
										Reference
										<input
											readOnly
											value=""
											className={`${inputClass} bg-slate-50 text-slate-600`}
										/>
										<span className="mt-1 block text-[11px] font-normal text-slate-500">Assigned by the service system after submission.</span>
									</label>
									<label className={labelClass}>
										Contact person
										<input readOnly value={selectedCustomer?.contactPerson ?? ""} placeholder="Full name" className={`${inputClass} bg-slate-50`} />
									</label>
									<label className={labelClass}>
										Email
										<input readOnly type="email" value={selectedCustomer?.contactEmail ?? ""} placeholder="name@company.et" className={`${inputClass} bg-slate-50`} />
									</label>
									<label className={labelClass}>
										Phone
										<input readOnly type="tel" value={selectedCustomer?.contactPhone ?? ""} placeholder="+251 ..." className={`${inputClass} bg-slate-50`} />
									</label>
									<label className={`${labelClass} sm:col-span-2`}>
										Notes
										<textarea
											value={notes}
											onChange={(event) => setNotes(event.target.value)}
											rows={3}
											maxLength={1000}
											placeholder="Anything the directorate should know"
											className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
										/>
										<span className="mt-1 block text-[11px] font-normal text-slate-500">Your notes are included with the submitted service.</span>
									</label>
								</div>
							</div>
						)}

						{step === 1 && (
							<div className="max-w-md">
								<label className={labelClass}>
									Service type
									<select
										required
										value={form.serviceType}
										onChange={(event) => updateField("serviceType", event.target.value)}
										className={inputClass}
									>
										<option value="">Select service type</option>
										<option value="Multimodal">Multimodal</option>
										<option value="Unimodal">Unimodal</option>
									</select>
								</label>
								<p className="mt-2 text-xs text-slate-500">
									Multimodal uses multiple transport modes; Unimodal uses a single transport mode.
								</p>
							</div>
						)}

						{step === 2 && (
							<div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
								<label className={`${labelClass} sm:col-span-2`}>
									Goods description
									<input required value={form.itemDescription} onChange={(event) => updateField("itemDescription", event.target.value)} maxLength={500} placeholder="Describe the goods" className={inputClass} />
								</label>
								<label className={labelClass}>
									Route category
									<input required value={form.routeCategory} onChange={(event) => updateField("routeCategory", event.target.value)} maxLength={120} placeholder="Enter route or destination" className={inputClass} />
								</label>
								<label className={labelClass}>
									Country of origin
									<input required value={form.countryOfOrigin} onChange={(event) => updateField("countryOfOrigin", event.target.value)} maxLength={120} placeholder="Country" className={inputClass} />
								</label>
								<label className={labelClass}>
									Declared value
									<input required value={form.declaredValue} onChange={(event) => updateField("declaredValue", event.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className={inputClass} />
								</label>
								<label className={labelClass}>
									Tax category
									<input required value={form.taxCategory} onChange={(event) => updateField("taxCategory", event.target.value)} maxLength={120} placeholder="Tax category" className={inputClass} />
								</label>
							</div>
						)}

						{step === 3 && (
							<div className="space-y-4">
								<div
									onDragOver={(event) => event.preventDefault()}
									onDrop={(event) => {
										event.preventDefault();
										addDocumentFiles(Array.from(event.dataTransfer.files));
									}}
									className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
								>
									<UploadCloud className="mx-auto h-8 w-8 text-slate-500" />
									<p className="mt-2 text-sm font-semibold text-slate-900">Attach supporting documents</p>
									<p className="mt-1 text-xs text-slate-500">Drag files here, or browse. PDF, JPG, PNG, XLSX up to 25 MB each.</p>
									<label className="mt-3 inline-flex cursor-pointer items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
										Browse files
										<input
											type="file"
											multiple
											disabled={Boolean(createdService?.documentsUploaded)}
											accept={ALLOWED_DOCUMENT_EXTENSIONS.join(",")}
											onChange={(event) => {
												addDocumentFiles(Array.from(event.currentTarget.files ?? []));
												event.currentTarget.value = "";
											}}
											className="sr-only"
										/>
									</label>
								</div>
								{documentFiles.length > 0 && (
									<div className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
										{documentFiles.map(({ id, file }) => {
											return (
												<div key={id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
													<div className="min-w-0">
														<p className="flex items-center gap-2 text-sm font-medium text-slate-800"><FileText className="h-4 w-4 shrink-0 text-slate-400" />{file.name}</p>
														<p className="mt-0.5 text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
													</div>
													<div className="flex items-center gap-2">
														{createdService?.documentsUploaded
															? <span className="text-xs font-semibold text-emerald-700">Uploaded</span>
															: <button type="button" onClick={() => removeDocumentFile(id)} aria-label={`Remove ${file.name}`} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"><X className="h-4 w-4" /></button>}
													</div>
												</div>
											);
										})}
									</div>
								)}
								<p className="rounded-md bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
									Selected files stay in this tab until submission and are not included in a browser draft. Documents upload after the service is created.
								</p>
							</div>
						)}

						{step === 4 && (
							<div className="space-y-4">
								<p className="text-sm text-slate-600">Check every section before submitting. Once submitted, the record is locked pending assessor approval.</p>
								<div className="space-y-2">
									{steps.slice(0, 4).map((section, index) => {
										const complete = isStepComplete(index);
										return (
											<button
												key={section}
												type="button"
												onClick={() => { setError(null); setStep(index); }}
												className="flex w-full items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50/40"
											>
												<span className="font-medium text-slate-800">{section}</span>
												<span className={`inline-flex items-center gap-1.5 text-xs font-medium ${complete ? "text-emerald-700" : "text-amber-700"}`}>
													{complete ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
													{complete ? "Complete" : "Incomplete"}
												</span>
											</button>
										);
									})}
								</div>
								<dl className="divide-y divide-slate-100 rounded-md border border-slate-200">
									{[
										["Importer", selectedCustomer?.businessName || "—"],
										["TIN", selectedCustomer?.tinNumber || "—"],
										["Contact person", selectedCustomer?.contactPerson || "—"],
										["Email", selectedCustomer?.contactEmail || "—"],
										["Phone", selectedCustomer?.contactPhone || "—"],
										["Service type", form.serviceType],
										["Route category", form.routeCategory || "—"],
										["Goods description", form.itemDescription || "—"],
										["Country of origin", form.countryOfOrigin || "—"],
										["Declared value", form.declaredValue || "—"],
										["Tax category", form.taxCategory || "General"],
										["Notes", notes || "—"],
										["Documents", documentFiles.map(({ file }) => file.name).join(", ") || "No documents attached"],
									].map(([label, value]) => (
										<div key={label} className="grid gap-1 px-4 py-3 sm:grid-cols-[170px_1fr] sm:gap-4">
											<dt className="text-xs font-medium text-slate-500">{label}</dt>
											<dd className="break-words text-sm font-medium text-slate-800">{value}</dd>
										</div>
									))}
								</dl>
								<p className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
									Importer and consignment details are sent with the service; your notes are included in the submission.
								</p>
								{!notice?.startsWith("Service submitted") && (
									<button type="button" onClick={() => void submitService()} disabled={busy || !customers.length} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
										{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
										{busy ? "Submitting…" : createdService ? "Retry submission" : "Submit service"}
									</button>
								)}
								{notice?.startsWith("Service submitted") && (
									<Link href={`${encoderBase}/services`} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
										View services <ChevronRight className="h-4 w-4" />
									</Link>
								)}
							</div>
						)}

						<div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
							<button type="button" onClick={saveDraft} disabled={busy || Boolean(createdService)} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
								<Save className="h-4 w-4" />
								{activeDraftId ? "Save draft" : "Save draft"}
							</button>
							<div className="flex items-center gap-2">
								<button type="button" onClick={() => { setError(null); setStep((current) => Math.max(current - 1, 0)); }} disabled={step === 0 || busy || Boolean(createdService)} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
									<ChevronLeft className="h-4 w-4" /> Back
								</button>
								{step < steps.length - 1 && (
									<button type="button" onClick={moveNext} disabled={busy || (step === 0 && customersLoading)} className="inline-flex items-center gap-2 rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50">
										Continue <ChevronRight className="h-4 w-4" />
									</button>
								)}
							</div>
						</div>
					</div>
				</div>
			</section>
		</EncoderSectionLayout>
	);
}
