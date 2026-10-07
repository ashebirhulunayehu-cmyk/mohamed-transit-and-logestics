"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	AlertCircle,
	AlertTriangle,
	CheckCircle2,
	FileText,
	Filter,
	LoaderCircle,
	PenLine,
	Plus,
	Search,
	RefreshCw,
	Send,
	Trash2,
	UsersRound,
} from "lucide-react";
import EncoderSectionLayout from "@/components/data-encoder/EncoderSectionLayout";
import {
	deleteEncoderServiceDraft,
	getEncoderServiceDrafts,
	type EncoderServiceDraft,
} from "@/modules/dataencoder/data-encoder.drafts";

type DraftFilter = "All" | "Service" | "Customer";

const requiredFields: Array<
	"customerId" | "serviceType" | "routeCategory" | "itemDescription" |
	"countryOfOrigin" | "declaredValue" | "taxCategory"
> = [
	"customerId",
	"serviceType",
	"routeCategory",
	"itemDescription",
	"countryOfOrigin",
	"declaredValue",
	"taxCategory",
];

const getMissingFields = (draft: EncoderServiceDraft): string[] => {
	const labels: Record<string, string> = {
		customerId: "Customer",
		serviceType: "Service type",
		routeCategory: "Route category",
		itemDescription: "Goods description",
		countryOfOrigin: "Country of origin",
		declaredValue: "Declared value",
		taxCategory: "Tax category",
	};
	return requiredFields
		.filter((field) => {
			const value = draft[field].trim();
			if (!value) return true;
			if (field === "customerId") {
				const id = Number(value);
				return !Number.isSafeInteger(id) || id <= 0;
			}
			if (field === "declaredValue") {
				const amount = Number(value);
				return !Number.isFinite(amount) || amount < 0;
			}
			return false;
		})
		.map((field) => labels[field]);
};

const formatSavedTime = (value: string): string => {
	const timestamp = new Date(value).getTime();
	if (Number.isNaN(timestamp)) return "Saved time unavailable";
	const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000));
	if (minutes < 1) return "Saved just now";
	if (minutes < 60) return `Saved ${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `Saved ${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `Saved ${days}d ago`;
	return `Saved ${new Date(value).toLocaleDateString()}`;
};

export default function EncoderDraftsDashboard() {
	const pathname = usePathname();
	const [drafts, setDrafts] = useState<EncoderServiceDraft[]>([]);
	const [filter, setFilter] = useState<DraftFilter>("All");
	const [search, setSearch] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [loadedAt, setLoadedAt] = useState(0);
	const [busyDraftId, setBusyDraftId] = useState<string | null>(null);

	const loadDrafts = useCallback(() => {
		try {
			setDrafts(getEncoderServiceDrafts());
			setError(null);
		} catch (loadError: unknown) {
			setError(
				loadError instanceof Error ? loadError.message : "Unable to load saved drafts.",
			);
		} finally {
			setLoadedAt(Date.now());
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		const timeoutId = window.setTimeout(loadDrafts, 0);
		return () => window.clearTimeout(timeoutId);
	}, [loadDrafts]);

	const localeSegment = pathname.split("/").filter(Boolean)[0] ?? "";
	const locale = localeSegment === "am" || localeSegment === "en" ? localeSegment : "en";
	const encoderBase = `/${locale}/admin/data-encoder`;
	const resumeUrl = (id: string) =>
		`${encoderBase}/services/new?draftId=${encodeURIComponent(id)}`;

	const filteredDrafts = useMemo(() => {
		const query = search.trim().toLowerCase();
		return drafts.filter((draft) => {
			const matchesType = filter === "All" || filter === draft.type;
			const matchesSearch =
				!query ||
				[
					draft.id,
					draft.itemDescription,
					draft.countryOfOrigin,
					draft.serviceType,
					draft.routeCategory,
				].some((value) => value.toLowerCase().includes(query));
			return matchesType && matchesSearch;
		});
	}, [drafts, filter, search]);

	const counts = useMemo(() => {
		const ready = drafts.filter((draft) => getMissingFields(draft).length === 0).length;
		const idle = drafts.filter(
			(draft) => loadedAt - new Date(draft.updatedAt).getTime() > 72 * 60 * 60 * 1000,
		).length;
		return { ready, incomplete: drafts.length - ready, idle };
	}, [drafts, loadedAt]);

	const discardDraft = (draft: EncoderServiceDraft) => {
		if (!window.confirm(`Discard draft ${draft.id}? This removes it from this browser.`)) return;
		setBusyDraftId(draft.id);
		try {
			deleteEncoderServiceDraft(draft.id);
			loadDrafts();
		} catch (deleteError: unknown) {
			setError(
				deleteError instanceof Error ? deleteError.message : "Unable to discard this draft.",
			);
		} finally {
			setBusyDraftId(null);
		}
	};

	return (
		<EncoderSectionLayout
			activeSection="draft-services"
			title="Draft services"
			description="Review and continue service records saved in this browser."
		>
			<div className="mx-auto max-w-[1500px]">
				<section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
					<div className="min-w-0">
						<p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Capture operations</p>
						<h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950">Draft services</h2>
						<p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">Review and continue service records saved in this browser. Drafts are private to this device until submitted.</p>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<button
							type="button"
							onClick={loadDrafts}
							disabled={loading}
							className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-wait disabled:opacity-60"
						>
							<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
							Refresh
						</button>
						<Link href={`${encoderBase}/customers`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
							<UsersRound className="h-4 w-4" /> New customer
						</Link>
						<Link href={`${encoderBase}/services/new`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-700 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
							<Plus className="h-4 w-4" /> New service
						</Link>
					</div>
				</section>

				<div className="space-y-5">
					{error && <p role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</p>}
					<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
						{[
							{ label: "Open drafts", value: drafts.length, icon: FileText, tone: "blue", hint: "Saved on this device" },
							{ label: "Ready to submit", value: counts.ready, icon: Send, tone: "emerald", hint: "All required fields complete" },
							{ label: "Incomplete", value: counts.incomplete, icon: AlertCircle, tone: "amber", hint: "Fields still required" },
							{ label: "Idle over 72h", value: counts.idle, icon: Filter, tone: "rose", hint: "No recent updates" },
						].map(({ label, value, icon: Icon, tone, hint }) => (
							<div key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
								<div className="flex items-center justify-between gap-3">
									<p className="text-sm font-medium text-slate-600">{label}</p>
									<span className={`flex h-10 w-10 items-center justify-center rounded-xl ${
										tone === "emerald" ? "bg-emerald-50 text-emerald-700" :
										tone === "amber" ? "bg-amber-50 text-amber-700" :
										tone === "rose" ? "bg-rose-50 text-rose-700" :
										"bg-blue-50 text-blue-700"
									}`}>
										<Icon className="h-5 w-5" />
									</span>
								</div>
								<p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{loading ? "—" : value.toLocaleString()}</p>
								<p className="mt-1 text-xs text-slate-500">{hint}</p>
							</div>
						))}
					</div>

					<section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
						<div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
							<div>
								<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Local workspace</p>
								<h3 className="mt-1 text-lg font-semibold text-slate-950">Draft register</h3>
								<p className="mt-1 text-xs text-slate-500">{filteredDrafts.length} of {drafts.length} drafts shown · stored in this browser</p>
							</div>
							<div className="flex flex-wrap items-center gap-2">
								<label className="flex h-10 min-w-[190px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 sm:flex-none">
									<Search className="h-4 w-4 shrink-0" />
									<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search drafts" aria-label="Search drafts" className="min-w-0 flex-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:w-36" />
								</label>
								<div className="flex rounded-lg border border-slate-200 p-1" aria-label="Filter draft type">
									{(["All", "Service", "Customer"] as const).map((value) => (
										<button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${filter === value ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"}`}>{value}</button>
									))}
								</div>
							</div>
						</div>

							{loading ? (
								<div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading drafts…</div>
							) : filteredDrafts.length === 0 ? (
								<div className="px-5 py-14 text-center">
									<FileText className="mx-auto h-9 w-9 text-slate-300" />
									<p className="mt-3 text-sm font-semibold text-slate-700">{search ? "No matching drafts" : filter === "Customer" ? "Customer drafts are not supported yet" : "No saved drafts"}</p>
									<p className="mt-1 text-xs text-slate-500">{filter === "Customer" ? "Customer records currently submit directly to the backend." : "Save an unfinished service form to keep it here in this browser."}</p>
									{!search && filter !== "Customer" && (
										<Link href={`${encoderBase}/services/new`} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
											<Plus className="h-4 w-4" />Create service draft
										</Link>
									)}
								</div>
							) : (
								<div className="divide-y divide-slate-200">
									{filteredDrafts.map((draft) => {
										const missing = getMissingFields(draft);
										const progress = Math.round(((requiredFields.length - missing.length) / requiredFields.length) * 100);
										const ready = missing.length === 0;
										return (
											<article key={draft.id} className="px-4 py-4 sm:px-5">
												<div className="flex flex-wrap items-center gap-2">
													<p className="font-mono text-xs font-semibold text-blue-800">{draft.id}</p>
													<span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">Service</span>
													<span className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600">{draft.serviceType || "Service type not set"}</span>
													<span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${ready ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}>
														{ready ? "Ready to submit" : `${missing.length} ${missing.length === 1 ? "field" : "fields"} missing`}
													</span>
													<span className="ml-auto text-[10px] text-slate-500">{formatSavedTime(draft.updatedAt)}</span>
												</div>
												<h3 className="mt-2 text-sm font-semibold">{draft.itemDescription || "Untitled service"}</h3>
												<p className="mt-0.5 text-xs text-slate-500">{draft.countryOfOrigin || "Origin not set"} · {draft.routeCategory || "Route category not set"}</p>
												<div className="mt-3 flex items-center gap-2">
													<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
														<div className={`h-full rounded-full ${ready ? "bg-emerald-600" : "bg-blue-600"}`} style={{ width: `${progress}%` }} />
													</div>
													<span className="w-9 text-[10px] text-slate-500">{progress}%</span>
												</div>
												<p className="mt-2 text-[10px] text-slate-500">
													{missing.length ? `Outstanding: ${missing.join(", ")}` : "All required service fields are complete"}
												</p>
												<div className="mt-3 flex flex-wrap items-center gap-2">
													<Link href={resumeUrl(draft.id)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"><PenLine className="h-3.5 w-3.5" />Resume</Link>
													<Link href={resumeUrl(draft.id)} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-800">
														<Send className="h-3.5 w-3.5" />Continue to submit
													</Link>
													<button type="button" disabled={busyDraftId === draft.id} onClick={() => discardDraft(draft)} className="inline-flex items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">
														{busyDraftId === draft.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}Discard
													</button>
												</div>
											</article>
										);
									})}
								</div>
							)}
							<div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-[10px] text-slate-500">
								<AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
								<span>Drafts stay on this device and are not synced to the backend until submitted.</span>
							</div>
						</section>

					{!error && <p className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-700" />Draft storage is available in this browser.</p>}
				</div>
			</div>
		</EncoderSectionLayout>
	);
}
