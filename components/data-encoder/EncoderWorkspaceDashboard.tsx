"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	BriefcaseBusiness,
	CheckCircle2,
	ChevronDown,
	CircleHelp,
	Clock3,
	FileText,
	LayoutDashboard,
	Menu,
	Search,
	UsersRound,
	X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/modules/auth/auth.store";
import { useDataEncoderStore } from "@/modules/dataencoder/data-encoder.store";
import type {
	DataEncoderRecentCustomer,
	DataEncoderRecentService,
} from "@/modules/dataencoder/data-encoder.type";

type ActivityItem = {
	key: string;
	title: string;
	detail: string;
	time: string;
	searchable: string;
	timestamp: number;
};

const getText = (...values: unknown[]): string => {
	const value = values.find(
		(candidate) =>
			(typeof candidate === "string" && candidate.trim()) ||
			typeof candidate === "number",
	);
	return value === undefined ? "" : String(value).trim();
};

const getRelatedName = (value: unknown): string => {
	if (typeof value === "string" || typeof value === "number") {
		return String(value);
	}
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return "";
	}
	const record = value as Record<string, unknown>;
	return getText(record.businessName, record.name, record.companyName);
};

const getDateValue = (
	record: DataEncoderRecentCustomer | DataEncoderRecentService,
): string =>
	getText(
		record.updatedAt,
		record.createdDate,
		record.createAt,
		"registeredDate" in record ? record.registeredDate : undefined,
	);

const formatRelativeTime = (value: string): string => {
	if (!value) return "Time unavailable";
	const timestamp = new Date(value).getTime();
	if (Number.isNaN(timestamp)) return "Time unavailable";
	const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
	const units: [number, Intl.RelativeTimeFormatUnit][] = [
		[60, "second"],
		[60, "minute"],
		[24, "hour"],
		[7, "day"],
		[4.345, "week"],
		[12, "month"],
		[Number.POSITIVE_INFINITY, "year"],
	];
	let amount = deltaSeconds;
	for (const [limit, unit] of units) {
		if (Math.abs(amount) < limit) {
			return new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(
				amount,
				unit,
			);
		}
		amount = Math.round(amount / limit);
	}
	return "Time unavailable";
};

const getStatusTone = (status: string): string => {
	const normalized = status.toLowerCase();
	if (normalized.includes("reject") || normalized.includes("block") || normalized.includes("fail")) {
		return "bg-rose-50 text-rose-700 ring-rose-200";
	}
	if (normalized.includes("approv") || normalized.includes("complete") || normalized.includes("clear")) {
		return "bg-emerald-50 text-emerald-700 ring-emerald-200";
	}
	if (normalized.includes("pending") || normalized.includes("draft") || normalized.includes("review")) {
		return "bg-amber-50 text-amber-800 ring-amber-200";
	}
	return "bg-slate-100 text-slate-700 ring-slate-200";
};

const getServiceStatus = (service: DataEncoderRecentService): string =>
	getText(service.status) || "Status unavailable";

export default function EncoderWorkspaceDashboard() {
	const pathname = usePathname();
	const user = useAuthStore((state) => state.user);
	const { dashboardData, loading, error, fetchDashboard } = useDataEncoderStore();
	const [searchTerm, setSearchTerm] = useState("");
	const [menuOpen, setMenuOpen] = useState(false);
	const [helpOpen, setHelpOpen] = useState(false);
	const [notificationsOpen, setNotificationsOpen] = useState(false);

	useEffect(() => {
		void fetchDashboard();
	}, [fetchDashboard]);

	const localeSegment = pathname.split("/").filter(Boolean)[0] ?? "";
	const locale = localeSegment === "am" || localeSegment === "en" ? localeSegment : "en";
	const captureUrl = `/${locale}/admin/data-encoder/dashboard`;
	const displayName =
		[getText(user?.firstName), getText(user?.lastName)].filter(Boolean).join(" ") ||
		getText(user?.username, user?.email) ||
		"Data Encoder";
	const initials = displayName
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0])
		.join("")
		.toUpperCase();

	const activityItems = useMemo<ActivityItem[]>(() => {
		const customerItems = dashboardData.recentCustomers.map((customer, index) => {
			const name = getText(customer.businessName, customer.name) || "Customer record";
			const detail = getText(customer.email) || "Customer record created";
			const time = getDateValue(customer);
			return {
				key: `customer-${customer.id ?? index}`,
				title: name,
				detail,
				time: formatRelativeTime(time),
				searchable: `${name} ${detail}`,
				timestamp: time ? new Date(time).getTime() : 0,
			};
		});
		const serviceItems = dashboardData.recentServices.map((service, index) => {
			const name = getText(service.trackingNumber, service.serviceNumber) || "Service record";
			const detail =
				getText(service.description, service.itemDescription) ||
				getServiceStatus(service);
			const time = getDateValue(service);
			return {
				key: `service-${service.id ?? index}`,
				title: name,
				detail,
				time: formatRelativeTime(time),
				searchable: `${name} ${detail} ${getText(service.importerName)} ${getRelatedName(service.importer)}`,
				timestamp: time ? new Date(time).getTime() : 0,
			};
		});
		return [...customerItems, ...serviceItems]
			.sort((first, second) => second.timestamp - first.timestamp)
			.slice(0, 6);
	}, [dashboardData.recentCustomers, dashboardData.recentServices]);

	const visibleServices = useMemo(() => {
		const query = searchTerm.trim().toLowerCase();
		if (!query) return dashboardData.recentServices;
		return dashboardData.recentServices.filter((service) =>
			[
				service.trackingNumber,
				service.serviceNumber,
				service.description,
				service.itemDescription,
				service.importerName,
				getRelatedName(service.importer),
				service.origin,
				service.destination,
				service.status,
			]
				.map((value) => getText(value).toLowerCase())
				.some((value) => value.includes(query)),
		);
	}, [dashboardData.recentServices, searchTerm]);

	const visibleActivity = activityItems.filter((item) =>
		item.searchable.toLowerCase().includes(searchTerm.trim().toLowerCase()),
	);

	const metrics = [
		{
			title: "Services created",
			value: dashboardData.totalServicesCreated,
			caption: "Total service records",
			icon: BriefcaseBusiness,
			tone: "text-blue-700 bg-blue-50",
			border: "border-l-blue-600",
		},
		{
			title: "Needs attention",
			value: dashboardData.pendingServiceApprovals,
			caption: "Awaiting service review",
			icon: AlertTriangle,
			tone: "text-amber-800 bg-amber-50",
			border: "border-l-amber-600",
		},
		{
			title: "Customer approvals",
			value: dashboardData.pendingCustomerApprovals,
			caption: "Waiting for review",
			icon: UsersRound,
			tone: "text-violet-700 bg-violet-50",
			border: "border-l-violet-600",
		},
		{
			title: "Draft services",
			value: dashboardData.draftServices,
			caption: "Saved, not submitted",
			icon: FileText,
			tone: "text-emerald-700 bg-emerald-50",
			border: "border-l-emerald-600",
		},
	];

	const closeMenu = () => setMenuOpen(false);
	const navLinkClass =
		"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";

	return (
		<div className="min-h-screen bg-[#f6f7f9] text-slate-900">
			{menuOpen && (
				<button
					type="button"
					aria-label="Close navigation"
					onClick={closeMenu}
					className="fixed inset-0 z-40 bg-slate-950/45 lg:hidden"
				/>
			)}
			<aside
				className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-slate-200 bg-white text-slate-900 transition-transform duration-200 lg:translate-x-0 ${
					menuOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex h-[76px] items-center gap-3 border-b border-slate-200 px-4">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
						M
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-bold text-slate-900">MOT Import Services</p>
						<p className="text-xs text-slate-500">Data Operations</p>
					</div>
					<button
						type="button"
						aria-label="Close navigation"
						onClick={closeMenu}
						className="ml-auto rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<nav aria-label="Data Encoder navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
					<div>
						<p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Overview</p>
						<Link href="/encoder" onClick={closeMenu} aria-current="page" className="flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm">
							<LayoutDashboard className="h-4 w-4" />
							Dashboard
						</Link>
						<Link href="/encoder/drafts" onClick={closeMenu} className={navLinkClass}>
							<FileText className="h-4 w-4" />
							Draft Services
						</Link>
					</div>
					<div>
						<p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Data Entry</p>
						<a href={`${captureUrl}#customer-registration`} onClick={closeMenu} className={navLinkClass}>
							<UsersRound className="h-4 w-4" />
							Create Customer
						</a>
						<a href={`${captureUrl}#recent-customers`} onClick={closeMenu} className={navLinkClass}>
							<UsersRound className="h-4 w-4" />
							Customer List
						</a>
						<a href={`${captureUrl}#service-registration`} onClick={closeMenu} className={navLinkClass}>
							<BriefcaseBusiness className="h-4 w-4" />
							Create Service
						</a>
						<a href="#priority-queue" onClick={closeMenu} className={navLinkClass}>
							<BriefcaseBusiness className="h-4 w-4" />
							Services
						</a>
					</div>
					<div>
						<p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Records</p>
						<a href="#customer-records" onClick={closeMenu} className={navLinkClass}>
							<UsersRound className="h-4 w-4" />
							Recent Customers
						</a>
						<a href="#latest-activity" onClick={closeMenu} className={navLinkClass}>
							<Activity className="h-4 w-4" />
							Latest Activity
						</a>
					</div>
				</nav>
				<div className="border-t border-slate-200 p-3">
					<div className="mb-2 rounded-xl bg-slate-50 px-3 py-2">
						<p className="text-[9px] uppercase tracking-wide text-slate-400">Prototype role</p>
						<p className="text-xs font-medium text-slate-700">Data Encoder</p>
					</div>
					<div className="flex items-center gap-2.5 rounded-md px-2 py-2">
						<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
							{initials || "DE"}
						</div>
						<div className="min-w-0">
							<p className="truncate text-xs font-semibold text-slate-900">{displayName}</p>
							<p className="text-[10px] text-slate-500">Data Encoder</p>
						</div>
						<ChevronDown className="ml-auto h-4 w-4 text-slate-500" />
					</div>
				</div>
			</aside>

			<div className="min-h-screen lg:pl-[270px]">
				<header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
					<button
						type="button"
						aria-label="Open navigation"
						onClick={() => setMenuOpen(true)}
						className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
					>
						<Menu className="h-5 w-5" />
					</button>
					<label className="flex h-10 min-w-0 max-w-[540px] flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-slate-500 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
						<Search className="h-4 w-4 shrink-0" />
						<input
							type="search"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
							placeholder="Search services, customers, documents…"
							aria-label="Search encoder records"
							className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
						/>
						<span className="hidden rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">⌘K</span>
					</label>
					<div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-3">
						<div className="relative">
							<button
								type="button"
								aria-label="Notifications information"
								aria-expanded={notificationsOpen}
								onClick={() => setNotificationsOpen(!notificationsOpen)}
								className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
							>
								<Activity className="h-[18px] w-[18px]" />
							</button>
							{notificationsOpen && (
								<div className="absolute right-0 top-11 z-50 w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600 shadow-lg">
									Notifications are not available from the current encoder API.
								</div>
							)}
						</div>
						<div className="relative">
							<button
								type="button"
								aria-label="Help and guidance"
								aria-expanded={helpOpen}
								onClick={() => setHelpOpen(!helpOpen)}
								className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
							>
								<CircleHelp className="h-[18px] w-[18px]" />
							</button>
							{helpOpen && (
								<div className="absolute right-0 top-11 z-50 w-64 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-600 shadow-lg">
									Use the data entry links in the sidebar to register customers and create service records.
								</div>
							)}
						</div>
						<div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
							<div className="flex h-9 w-9 items-center justify-center rounded-md bg-sky-50 text-xs font-semibold text-sky-800">
								{initials || "DE"}
							</div>
							<div className="max-w-36">
								<p className="truncate text-xs font-semibold text-slate-800">{displayName}</p>
								<p className="text-[10px] text-slate-500">Data Encoder</p>
							</div>
						</div>
					</div>
				</header>

				<main className="mx-auto max-w-[1500px]">
					<section className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-6 sm:px-8">
						<div>
							<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Import Directorate</p>
							<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">Data capture desk</h1>
							<p className="mt-1 text-sm text-slate-500">Records you have created and their approval state.</p>
							{error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">Dashboard update failed: {error}</p>}
						</div>
						<a href="#priority-queue" className="inline-flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50">
							Open case register
							<ArrowRight className="h-4 w-4" />
						</a>
					</section>

					<div className="space-y-6 px-4 py-6 sm:px-6 lg:px-8">
						<section aria-label="Encoder activity summary" className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
							{metrics.map(({ title, value, caption, icon: Icon, tone, border }) => (
								<div key={title} className={`rounded-md border border-slate-200 border-l-[3px] ${border} bg-white p-5 shadow-sm`}>
									<div className="flex items-center justify-between gap-3">
										<p className="text-sm font-medium text-slate-600">{title}</p>
										<span className={`flex h-8 w-8 items-center justify-center rounded-md ${tone}`}><Icon className="h-4 w-4" /></span>
									</div>
									<p className="mt-3 text-[30px] font-semibold leading-none tracking-tight text-slate-950">
										{loading ? <span className="text-slate-300">—</span> : value.toLocaleString()}
									</p>
									<p className="mt-2 text-xs text-slate-500">{caption}</p>
								</div>
							))}
						</section>

						<div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">
							<section id="priority-queue" className="scroll-mt-20 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
								<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
									<div>
										<h2 className="text-base font-semibold text-slate-900">Priority queue</h2>
										<p className="mt-0.5 text-xs text-slate-500">Recent service records and their current status</p>
									</div>
									<span className="text-xs text-slate-500">{visibleServices.length} records</span>
								</div>
								<div className="divide-y divide-slate-100">
									{visibleServices.map((service, index) => {
										const number = getText(service.trackingNumber, service.serviceNumber) || `Service ${service.id ?? index + 1}`;
										const description = getText(service.description, service.itemDescription) || "Service description unavailable";
										const importer = getText(service.importerName) || getRelatedName(service.importer) || "Customer unavailable";
										const route = [getText(service.origin), getText(service.destination)].filter(Boolean).join(" → ");
										const status = getServiceStatus(service);
										const lastUpdated = formatRelativeTime(getDateValue(service));
										return (
											<article key={service.id ?? number} className="px-5 py-4 transition hover:bg-slate-50/70">
												<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
													<p className="font-mono text-xs font-semibold text-sky-800">{number}</p>
													<span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${getStatusTone(status)}`}>{status}</span>
													<span className="ml-auto text-[11px] text-slate-400">{lastUpdated}</span>
												</div>
												<h3 className="mt-2 text-sm font-semibold text-slate-900">{description}</h3>
												<p className="mt-1 text-xs text-slate-500">
													{importer}{route ? ` · ${route}` : ""}
												</p>
											</article>
										);
									})}
									{!loading && visibleServices.length === 0 && (
										<div className="px-5 py-12 text-center">
											<BriefcaseBusiness className="mx-auto h-8 w-8 text-slate-300" />
											<p className="mt-3 text-sm font-medium text-slate-700">{searchTerm ? "No matching services" : "No recent service records"}</p>
											<p className="mt-1 text-xs text-slate-500">{searchTerm ? "Try a different search term." : "Service records returned by the encoder API will appear here."}</p>
										</div>
									)}
									{loading && visibleServices.length === 0 && (
										<div className="px-5 py-12 text-center text-sm text-slate-500">Loading service records…</div>
									)}
								</div>
							</section>

							<section id="latest-activity" className="scroll-mt-20 overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
								<div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
									<div>
										<h2 className="text-base font-semibold text-slate-900">Latest activity</h2>
										<p className="mt-0.5 text-xs text-slate-500">Latest customer and service records</p>
									</div>
									<Clock3 className="h-4 w-4 text-slate-400" />
								</div>
								<div id="customer-records" className="divide-y divide-slate-100">
									{visibleActivity.map((item) => (
										<div key={item.key} className="px-5 py-4">
											<p className="text-sm font-medium text-slate-800">{item.title}</p>
											<p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{item.detail}</p>
											<p className="mt-2 text-[10px] font-medium text-slate-400">Encoder records · {item.time}</p>
										</div>
									))}
									{!loading && visibleActivity.length === 0 && (
										<p className="px-5 py-10 text-center text-xs text-slate-500">
											{searchTerm ? "No matching activity." : "Recent customer and service records will appear here."}
										</p>
									)}
									{loading && visibleActivity.length === 0 && (
										<p className="px-5 py-10 text-center text-xs text-slate-500">Loading recent activity…</p>
									)}
								</div>
								{!error && !loading && (
									<div className="flex items-center gap-2 border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
										<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
										Synced with the encoder dashboard
									</div>
								)}
							</section>
						</div>

						<section id="draft-services" className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
							<div className="flex items-center gap-3">
								<span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-600"><FileText className="h-4 w-4" /></span>
								<div>
									<h2 className="text-sm font-semibold text-slate-900">Draft workspace</h2>
									<p className="mt-0.5 text-xs text-slate-500">Draft services saved and awaiting submission.</p>
								</div>
							</div>
							<p className="text-2xl font-semibold text-slate-900">{loading ? "—" : dashboardData.draftServices.toLocaleString()}</p>
						</section>
					</div>
				</main>
			</div>
		</div>
	);
}
