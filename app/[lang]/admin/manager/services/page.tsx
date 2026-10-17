"use client";

import { useEffect, useState } from "react";
import { ServiceFilters } from "@/features/services/components/ServiceFilters";
import { ServiceTable } from "@/features/services/components/ServiceTable";
import { useServiceStore } from "@/features/services/service.store";

export default function ManagerServicesPage() {
  const fetchManagerServices = useServiceStore((state) => state.fetchManagerServices);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    void fetchManagerServices({ page, pageSize });
  }, [fetchManagerServices, page]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 font-sans text-slate-800">
      <header>
        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Case register
        </span>
        <h1 className="mt-1 text-3xl font-semibold text-slate-900">
          Service management
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          All import cases with status, risk channel, executor and SLA position.
        </p>
      </header>

      <div className="space-y-4">
        <ServiceFilters managerView />
        <ServiceTable managerView onPageChange={setPage} />
      </div>
    </div>
  );
}
