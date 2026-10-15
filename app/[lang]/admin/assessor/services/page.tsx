"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { ServiceFilters } from "@/features/services/components/ServiceFilters";
import { ServiceTable } from "@/features/services/components/ServiceTable";
import { useServiceStore } from "@/features/services/service.store";

export default function ServicesPage() {
	const fetchServices = useServiceStore((state) => state.fetchServices);
	const loading = useServiceStore((state) => state.loading);

	useEffect(() => {
		void fetchServices();
	}, [fetchServices]);

	return (
		<div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800">
			<header className="flex flex-wrap items-end justify-between gap-3">
				<div>
					<span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
						Case register
					</span>
					<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
						Services
					</h1>
					<p className="mt-1 text-sm text-slate-500">
						Cases visible to you for valuation and compliance assessment.
					</p>
				</div>
				<button
					type="button"
					onClick={() => void fetchServices()}
					disabled={loading}
					aria-label="Refresh assessor services"
					className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
				>
					<RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
					Refresh
				</button>
			</header>

			<div className="space-y-3">
				<ServiceFilters />
				<ServiceTable />
			</div>
		</div>
	);
}
