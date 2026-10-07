"use client";

import { useEffect } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { useDashboardStore } from "@/modules/dashboard";

const getString = (value: unknown, fallback = "—") => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const getNested = (row: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    if (key in row && row[key] !== undefined && row[key] !== null) {
      return row[key];
    }
  }

  return undefined;
};

export default function DashboardOverview() {
  const { view, loading, error, fetchView } = useDashboardStore();

  useEffect(() => {
    void fetchView();
  }, [fetchView]);

  const rows = Array.isArray(view) ? view : [];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Dashboard API</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Portfolio overview</h2>
        </div>

        <button
          type="button"
          onClick={() => void fetchView()}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="p-5 sm:p-6">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {rows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-3 pr-4 font-semibold">Name</th>
                  <th className="pb-3 pr-4 font-semibold">Status</th>
                  <th className="pb-3 pr-4 font-semibold">Total</th>
                  <th className="pb-3 pr-4 font-semibold">Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const record = row as Record<string, unknown>;
                  const name = getString(getNested(record, ["name", "title", "label", "dashboardName"])) ?? `Record ${index + 1}`;
                  const status = getString(getNested(record, ["status", "state", "currentStatus"])) ?? "Active";
                  const total = getString(getNested(record, ["total", "count", "value", "amount"])) ?? "0";
                  const updated = getString(getNested(record, ["updatedAt", "lastUpdated", "updatedOn", "createdAt"])) ?? "—";

                  return (
                    <tr key={`${name}-${index}`} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <BarChart3 className="h-4 w-4" />
                          </span>
                          {name}
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          {status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-semibold text-slate-900">{total}</td>
                      <td className="py-3 pr-4 text-slate-500">{updated}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            {loading ? "Loading dashboard data..." : "No dashboard records have been returned by the Dashboard/View endpoint yet."}
          </div>
        )}
      </div>
    </section>
  );
}
