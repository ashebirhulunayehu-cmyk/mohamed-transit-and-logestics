"use client";

import { useEffect } from "react";
import { ServiceFilters } from "@/features/services/components/ServiceFilters";
import { ServiceTable } from "@/features/services/components/ServiceTable";
import { useServiceStore } from "@/features/services/service.store";

export default function ServicesPage() {
	const fetchServices = useServiceStore((state) => state.fetchServices);

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
			</header>

			<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<ServiceFilters embedded />
				<ServiceTable embedded />
			</div>
		</div>
	);
}
