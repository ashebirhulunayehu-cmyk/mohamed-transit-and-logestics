"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, Layers, LoaderCircle, RefreshCw } from "lucide-react";
import { useCaseExecutorStore } from "@/modules/case-Executer/case-Executer.store";
import type { CaseExecutorServiceRecord } from "@/modules/case-Executer/case-Executer.type";
import { getCaseExecutorServiceCategory } from "@/modules/case-Executer/service-category";

const readValue = (record: CaseExecutorServiceRecord, ...keys: string[]): unknown => {
  const key = Object.keys(record).find((candidate) =>
    keys.some((name) => candidate.toLowerCase() === name.toLowerCase()),
  );
  return key ? record[key] : undefined;
};

const isOpenService = (record: CaseExecutorServiceRecord): boolean => {
  const statusValue = readValue(record, "status", "serviceStatus", "currentStatus");
  const rawStatus =
    statusValue && typeof statusValue === "object" && !Array.isArray(statusValue)
      ? readValue(
          statusValue as CaseExecutorServiceRecord,
          "value",
          "id",
          "code",
          "name",
          "label",
          "status",
        )
      : statusValue;
  const statusLabels: Record<string, string> = {
    "1": "draft",
    "2": "submitted",
    "3": "under review",
    "4": "approved",
    "5": "in progress",
    "6": "completed",
    "7": "rejected",
    "8": "cancelled",
    "9": "delivered",
  };
  const status = typeof rawStatus === "number" || typeof rawStatus === "string"
    ? statusLabels[String(rawStatus)] ??
      String(rawStatus).replace(/([a-z])([A-Z])/g, "$1 $2").trim().toLowerCase()
    : "";

  return !["completed", "delivered", "deliverd", "rejected", "cancelled", "canceled"].includes(status);
};

export default function CaseExecutorServiceCategoriesPage() {
  const params = useParams();
  const lang = typeof params.lang === "string" ? params.lang : "en";
  const services = useCaseExecutorStore((state) => state.assignedServices);
  const loading = useCaseExecutorStore((state) => state.assignedServicesLoading);
  const error = useCaseExecutorStore((state) => state.assignedServicesError);
  const fetchAssignedServices = useCaseExecutorStore((state) => state.fetchAssignedServices);

  useEffect(() => {
    void fetchAssignedServices();
  }, [fetchAssignedServices]);

  const categories = useMemo(() => {
    const counts = new Map<string, { total: number; open: number }>();
    for (const service of services) {
      const category = getCaseExecutorServiceCategory(service);
      const count = counts.get(category) ?? { total: 0, open: 0 };
      count.total += 1;
      if (isOpenService(service)) count.open += 1;
      counts.set(category, count);
    }
    return [...counts.entries()]
      .map(([name, count]) => ({ name, ...count }))
      .sort((left, right) => left.name.localeCompare(right.name));
  }, [services]);

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 font-sans text-slate-800">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Workload</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">Service categories</h1>
          <p className="mt-1 text-sm text-slate-500">Your caseload grouped by service type.</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchAssignedServices()}
          disabled={loading}
          aria-label="Refresh service categories"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {error ? (
        <section role="alert" className="rounded-xl border border-rose-200 bg-white p-6 text-sm text-rose-700 shadow-sm">
          <p>Service categories could not be loaded. {error}</p>
          <button
            type="button"
            onClick={() => void fetchAssignedServices()}
            className="mt-3 font-semibold text-blue-700 hover:underline"
          >
            Try again
          </button>
        </section>
      ) : loading && categories.length === 0 ? (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          <LoaderCircle className="size-4 animate-spin" />
          Loading your service categories…
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Layers className="mx-auto size-8 text-slate-400" />
          <h2 className="mt-3 text-base font-semibold text-slate-900">No assigned services yet</h2>
          <p className="mt-1 text-sm text-slate-500">Categories will appear here when services are assigned to you.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map(({ name, total, open }) => (
            <Link
              key={name}
              href={`/${lang}/admin/case-Executer/services?category=${encodeURIComponent(name)}`}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/30"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{name}</p>
                <ArrowRight className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-blue-600" />
              </div>
              <div className="mt-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-slate-900">{open}</p>
                  <p className="mt-1 text-xs text-slate-500">open {open === 1 ? "case" : "cases"}</p>
                </div>
                <span className="rounded-lg bg-blue-50 p-2 text-blue-600">
                  <Layers className="size-5" />
                </span>
              </div>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                {total} assigned {total === 1 ? "service" : "services"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}