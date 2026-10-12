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
			<header>
				<span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
					Case register
				</span>
				<h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
					Services
				</h1>
				<p className="mt-1 text-sm text-slate-500">
					Cases visible to you for valuation and compliance assessment.
				</p>
			</header>

			<div className="space-y-3">
				<ServiceFilters />
				<ServiceTable />
			</div>
		</div>
	);
}
