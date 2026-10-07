'use client';

import { useEffect } from 'react';
import {
	Activity,
	Bell,
	BriefcaseBusiness,
	CheckCircle2,
	ChevronRight,
	CircleAlert,
	ClipboardCheck,
	FileText,
	LayoutDashboard,
	PackageCheck,
	UsersRound,
} from 'lucide-react';
import {
	useDataEncoderStore,
	type DataEncoderDashboardMetric,
} from '@/modules/dataencoder/data-encoder.store';

const getText = (...values: unknown[]): string => {
	const value = values.find(
		(candidate) =>
			(typeof candidate === 'string' && candidate.trim()) ||
			typeof candidate === 'number',
	);

	return value === undefined ? '' : String(value).trim();
};

const formatDate = (...values: unknown[]): string => {
	const value = getText(...values);
	if (!value) return 'Date unavailable';

	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? 'Date unavailable'
		: date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const getImporterName = (value: unknown): string => {
	if (!value || typeof value !== 'object') return getText(value);
	const importer = value as Record<string, unknown>;
	return getText(importer.businessName, importer.name, importer.companyName);
};

const getStatusClass = (status: string): string => {
	const normalized = status.toLowerCase();
	if (normalized.includes('approved') || normalized.includes('complete')) {
		return 'bg-emerald-50 text-emerald-700';
	}
	if (normalized.includes('pending') || normalized.includes('draft')) {
		return 'bg-amber-50 text-amber-700';
	}
	return 'bg-blue-50 text-blue-700';
};

const getPercent = (count: number, total: number): number =>
	total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;

export default function DataEncoderDashboard() {
	const { dashboardData, unavailableMetrics, loading, error, fetchDashboard } = useDataEncoderStore();

	useEffect(() => {
		void fetchDashboard();
	}, [fetchDashboard]);

	const stats: {
		metric: DataEncoderDashboardMetric;
		title: string;
		value: number;
		description: string;
		Icon: typeof UsersRound;
		color: string;
	}[] = [
		{ metric: 'totalCustomersCreated', title: 'Customers created', value: dashboardData.totalCustomersCreated, description: 'All registered customers', Icon: UsersRound, color: 'bg-blue-50 text-blue-700' },
		{ metric: 'pendingCustomerApprovals', title: 'Pending customer approvals', value: dashboardData.pendingCustomerApprovals, description: 'Waiting for review', Icon: ClipboardCheck, color: 'bg-amber-50 text-amber-700' },
		{ metric: 'totalServicesCreated', title: 'Services created', value: dashboardData.totalServicesCreated, description: 'Submitted from this account', Icon: PackageCheck, color: 'bg-emerald-50 text-emerald-700' },
		{ metric: 'pendingServiceApprovals', title: 'Pending service approvals', value: dashboardData.pendingServiceApprovals, description: 'Awaiting assessment', Icon: CircleAlert, color: 'bg-orange-50 text-orange-700' },
		{ metric: 'draftServices', title: 'Draft services', value: dashboardData.draftServices, description: 'Saved, not submitted', Icon: FileText, color: 'bg-slate-100 text-slate-700' },
	];

	const navigation = [
		{ label: 'Dashboard', href: '#overview', Icon: LayoutDashboard },
		{ label: 'Customer approvals', href: '#customer-approvals', Icon: ClipboardCheck },
		{ label: 'Service register', href: '#recent-services', Icon: BriefcaseBusiness },
		{ label: 'Draft services', href: '#draft-services', Icon: FileText },
	];

	return (
		<div className="min-h-screen bg-[#f7f8fa] text-slate-900">
			<aside className="fixed inset-y-0 left-0 z-40 hidden w-[270px] flex-col border-r border-slate-200 bg-white lg:flex">
				<div className="flex h-[76px] items-center gap-3 border-b border-slate-200 px-5">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
						<span className="text-sm font-bold">M</span>
					</div>
					<div className="min-w-0">
						<p className="truncate text-sm font-bold text-slate-900">MOT Import Services</p>
						<p className="text-xs text-slate-500">Data Operations</p>
					</div>
				</div>

				<nav aria-label="Data Encoder navigation" className="flex-1 overflow-y-auto px-3 py-5">
					<p className="mb-2 px-2 text-xs font-semibold uppercase text-slate-400">Overview</p>
					<a
						href="#overview"
						className="flex items-center gap-3 rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-medium text-white shadow-sm"
					>
						<LayoutDashboard className="h-[19px] w-[19px]" strokeWidth={1.9} />
						Dashboard
					</a>

					<p className="mb-2 mt-7 px-2 text-xs font-semibold uppercase text-slate-400">Capture operations</p>
					<div className="space-y-1">
						{navigation.slice(1).map(({ label, href, Icon }) => (
							<a
								key={href}
								href={href}
								className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
							>
								<Icon className="h-[19px] w-[19px] shrink-0 text-slate-500 group-hover:text-slate-700" strokeWidth={1.9} />
								<span className="truncate">{label}</span>
							</a>
						))}
					</div>
				</nav>

				<div className="border-t border-slate-200 p-4">
					<div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">DE</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold text-slate-900">Data Encoder</p>
							<p className="text-xs text-slate-500">Import Operations</p>
						</div>
					</div>
				</div>
			</aside>

			<div className="lg:pl-[270px]">
				<header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
					<div className="flex h-[64px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[76px]">
						<div className="min-w-0">
							<div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
								<span>Data Encoder</span><ChevronRight className="h-4 w-4 text-slate-300" />
								<span className="font-medium text-slate-900">Dashboard</span>
							</div>
							<p className="truncate text-sm font-semibold text-slate-900 sm:hidden">Data Encoder Dashboard</p>
						</div>
						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
								<span className={`h-2 w-2 rounded-full ${error ? 'bg-amber-500' : loading ? 'bg-blue-500' : 'bg-emerald-500'}`} />
								<span className="text-xs font-medium text-slate-600">
									{error ? 'Sync issue' : loading ? 'Updating' : 'Live data'}
								</span>
							</div>
							<button
								type="button"
								aria-label="Notifications"
								className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
							>
								<Bell className="h-[19px] w-[19px]" />
								<span className="absolute right-[7px] top-[6px] h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" />
							</button>
						</div>
					</div>
					<nav aria-label="Mobile dashboard sections" className="flex gap-2 overflow-x-auto border-t border-slate-100 px-4 py-2 lg:hidden">
						{navigation.map(({ label, href }) => (
							<a key={href} href={href} className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100">
								{label}
							</a>
						))}
					</nav>
				</header>

				<main id="overview" className="mx-auto max-w-[1600px] space-y-6 px-4 py-5 sm:px-6 lg:px-8">
					<section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
						<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase text-slate-400">
									<span>Ministry of Transport</span><span className="text-slate-300">/</span><span>Data Operations</span>
								</div>
								<h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">Data Encoder Dashboard</h1>
								<p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
									Track customer registrations, service drafts, and submissions awaiting review.
								</p>
								{error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
							</div>
							<div className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 sm:self-center">
								<Activity className="h-4 w-4 text-blue-700" />
								<span className="text-sm font-medium text-slate-600">{loading ? 'Refreshing dashboard' : 'Current snapshot'}</span>
							</div>
						</div>
					</section>

					<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
						{stats.map(({ metric, title, value, description, Icon, color }) => {
							const unavailable = unavailableMetrics.includes(metric);
							return (
							<div key={title} className="group min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
								<div className="flex items-start justify-between gap-3">
									<div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
									<span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${unavailable ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
										{loading ? "Loading" : unavailable ? "Unavailable" : "Live"}
									</span>
								</div>
								<div className="mt-5">
									<p className="text-sm font-medium text-slate-500">{title}</p>
									<p className="mt-1 text-3xl font-semibold text-slate-950">{unavailable ? "—" : value.toLocaleString()}</p>
									<p className="mt-1 text-xs text-slate-400">{description}</p>
								</div>
							</div>
							);
						})}
					</section>

					<section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
						<div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
							<div className="flex items-start justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase text-slate-400">Approval workflow</p>
									<h2 className="mt-1 text-lg font-semibold text-slate-950">Work awaiting review</h2>
									<p className="mt-1 text-sm text-slate-500">Current approval queues relative to created records.</p>
								</div>
								<span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Live data</span>
							</div>
							<div className="mt-7 space-y-6">
								{[
									{ label: 'Service approvals', count: dashboardData.pendingServiceApprovals, percent: getPercent(dashboardData.pendingServiceApprovals, dashboardData.totalServicesCreated), color: 'bg-blue-700', totalLabel: 'created services' },
									{ label: 'Customer approvals', count: dashboardData.pendingCustomerApprovals, percent: getPercent(dashboardData.pendingCustomerApprovals, dashboardData.totalCustomersCreated), color: 'bg-amber-500', totalLabel: 'created customers' },
								].map((item) => (
									<div key={item.label}>
										<div className="flex items-center justify-between gap-3 text-sm">
											<span className="font-medium text-slate-700">{item.label}</span>
											<span className="font-semibold text-slate-950">{item.count} pending</span>
										</div>
										<div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
											<div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
										</div>
										<p className="mt-1.5 text-xs text-slate-400">{item.percent}% of {item.totalLabel}</p>
									</div>
								))}
							</div>
							<div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
								{[
									['Customers created', dashboardData.totalCustomersCreated],
									['Services created', dashboardData.totalServicesCreated],
									['Draft services', dashboardData.draftServices],
								].map(([label, value]) => (
									<div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
										<p className="text-xs text-slate-500">{label}</p>
										<p className="mt-1 text-xl font-semibold text-slate-950">{value}</p>
									</div>
								))}
							</div>
						</div>

						<div id="draft-services" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-xs font-semibold uppercase text-slate-400">Capture status</p>
									<h2 className="mt-1 text-lg font-semibold text-slate-950">Draft workspace</h2>
								</div>
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700"><FileText className="h-5 w-5" /></div>
							</div>
							<div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5">
								<div className="flex items-center justify-between gap-4">
									<div>
										<p className="text-sm font-medium text-slate-700">Unsubmitted service drafts</p>
										<p className="mt-1 text-xs text-slate-500">Saved records not yet sent for approval</p>
									</div>
									<span className="text-2xl font-semibold text-slate-950">{dashboardData.draftServices}</span>
								</div>
							</div>
							<div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
								<CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
								<div>
									<p className="text-sm font-semibold text-blue-900">{error ? 'Dashboard needs attention' : loading ? 'Synchronizing dashboard' : 'Dashboard synchronized'}</p>
									<p className="mt-1 text-xs leading-5 text-blue-800">
										{error ? 'The latest dashboard data could not be loaded.' : 'Counts and recent records reflect the latest Data Encoder response.'}
									</p>
								</div>
							</div>
						</div>
					</section>

					<section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
						<div id="recent-services" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
							<div className="border-b border-slate-200 p-5 sm:p-6">
								<div className="flex items-center justify-between gap-4">
									<div>
										<p className="text-xs font-semibold uppercase text-slate-400">Work queue</p>
										<h2 className="mt-1 text-lg font-semibold text-slate-950">Recent services</h2>
									</div>
									<span className="text-xs font-medium text-slate-400">{dashboardData.recentServices.length} records</span>
								</div>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full min-w-[620px] text-left">
									<thead className="bg-slate-50">
										<tr className="text-xs font-semibold uppercase text-slate-400">
											<th className="px-5 py-3.5">Service</th><th className="px-5 py-3.5">Customer</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5">Updated</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-100">
										{dashboardData.recentServices.length ? dashboardData.recentServices.map((service, index) => {
											const status = getText(service.status) || 'Created';
											return (
												<tr key={getText(service.id, service.trackingNumber, service.serviceNumber) || `service-${index}`} className="transition hover:bg-slate-50/70">
													<td className="px-5 py-4">
														<p className="text-sm font-semibold text-slate-900">{getText(service.trackingNumber, service.serviceNumber, service.id) || 'Service record'}</p>
														<p className="mt-0.5 max-w-[250px] truncate text-xs text-slate-400">{getText(service.description, service.itemDescription) || 'No description provided'}</p>
													</td>
													<td className="px-5 py-4 text-sm text-slate-600">{getText(service.importerName, getImporterName(service.importer)) || 'Customer unavailable'}</td>
													<td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}>{status}</span></td>
													<td className="px-5 py-4 text-xs text-slate-500">{formatDate(service.updatedAt, service.createdDate, service.createAt)}</td>
												</tr>
											);
										}) : (
											<tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">{loading ? 'Loading recent services...' : 'No recent services returned by the API.'}</td></tr>
										)}
									</tbody>
								</table>
							</div>
						</div>

						<div id="customer-approvals" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
							<div className="border-b border-slate-200 p-5 sm:p-6">
								<p className="text-xs font-semibold uppercase text-slate-400">Customer register</p>
								<div className="mt-1 flex items-center justify-between gap-3">
									<h2 className="text-lg font-semibold text-slate-950">Recent customers</h2>
									<span className="text-xs font-medium text-slate-400">{dashboardData.recentCustomers.length} records</span>
								</div>
							</div>
							<div className="divide-y divide-slate-100">
								{dashboardData.recentCustomers.length ? dashboardData.recentCustomers.map((customer, index) => (
									<div key={getText(customer.id, customer.email) || `customer-${index}`} className="px-5 py-4">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate text-sm font-semibold text-slate-900">{getText(customer.businessName, customer.name) || `Customer ${getText(customer.id)}`}</p>
												<p className="mt-1 truncate text-xs text-slate-500">{getText(customer.email) || 'No email provided'}</p>
											</div>
											<span className="shrink-0 text-xs text-slate-400">{formatDate(customer.createdDate, customer.registeredDate, customer.createAt)}</span>
										</div>
									</div>
								)) : (
									<p className="px-5 py-10 text-center text-sm text-slate-500">{loading ? 'Loading recent customers...' : 'No recent customers returned by the API.'}</p>
								)}
							</div>
						</div>
					</section>

					<section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-400 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
						<span>Data Encoder activity is synchronized with Data Operations.</span>
						<span>MOT Import Services · Data Operations</span>
					</section>
				</main>
			</div>
		</div>
	);
}
