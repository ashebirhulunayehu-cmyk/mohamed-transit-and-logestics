"use client";

import React, { useEffect, useMemo } from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { Search, RefreshCw, ShieldAlert } from "lucide-react";

const getRelativeTime = (value: string): string => {
  if (!value || value === "Not recorded") return "Time not recorded";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "Time not recorded";

  const elapsedHours = Math.max(0, Math.floor((Date.now() - timestamp) / 3_600_000));
  if (elapsedHours < 1) return "Just now";
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  const elapsedDays = Math.floor(elapsedHours / 24);
  return `${elapsedDays}d ago`;
};

const getStatusClasses = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("block") || normalized.includes("reject")) {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }
  if (normalized.includes("customer action") || normalized.includes("attention")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }
  if (normalized.includes("review") || normalized.includes("submit")) {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }
  if (normalized.includes("approv") || normalized.includes("complete")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
};

const getChannelClasses = (channel: string): string => {
  switch (channel) {
    case "Red channel":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "Yellow channel":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "Green channel":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Blue channel":
      return "border-blue-200 bg-blue-50 text-blue-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
};

export function ServiceReviewQueue() {
  const {
    cases,
    selectedCaseId,
    setSelectedCaseId,
    searchTerm,
    setSearchTerm,
    fetchCases,
    loading,
    error,
    reviewedService,
  } = useServiceReviewStore();

  useEffect(() => {
    void fetchCases();
  }, [fetchCases]);

  const filteredCases = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return cases;
    return cases.filter((item) =>
      [
        item.id,
        item.trackingNumber,
        item.title,
        item.commodity,
        item.importer,
        item.route,
        item.currentStage,
        item.status,
        item.channel,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [cases, searchTerm]);

  useEffect(() => {
    if (filteredCases.some((item) => item.id === selectedCaseId)) return;
    setSelectedCaseId(filteredCases[0]?.id ?? null);
  }, [filteredCases, selectedCaseId, setSelectedCaseId]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Review queue</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredCases.length} of {cases.length} cases
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchCases()}
            disabled={loading}
            aria-label="Refresh assessor service reviews"
            className="inline-flex shrink-0 items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search case, importer or commodity"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {reviewedService && (
        <p role="status" className="border-b border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800">
          Review saved for {reviewedService.trackingNumber} (service #{reviewedService.id}).
        </p>
      )}

      <div className="divide-y divide-slate-100">
        {error ? (
          <div role="alert" className="flex items-center justify-between gap-3 p-5 text-sm text-red-700">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => void fetchCases()}
              disabled={loading}
              className="inline-flex shrink-0 items-center gap-1.5 rounded border border-red-200 px-2.5 py-1.5 text-xs font-semibold hover:bg-red-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Retry
            </button>
          </div>
        ) : loading && cases.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Loading service reviews...</p>
        ) : filteredCases.length === 0 ? (
          <div className="p-5 text-sm text-slate-500">
            <p>{cases.length ? "No cases match your search." : "No services requiring assessor review were returned by the Assessor API."}</p>
            {!cases.length && <p className="mt-1 text-xs text-slate-400">Submitted services and active services flagged for review, customer action, or blocking appear here.</p>}
          </div>
        ) : filteredCases.map((item) => {
          const isSelected = selectedCaseId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => setSelectedCaseId(item.id)}
              className={`block w-full border-l-2 p-4 text-left transition-colors ${
                isSelected
                  ? "border-l-cyan-500 bg-blue-50/70"
                  : "border-l-transparent hover:bg-slate-50"
              }`}
            >
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-sky-700">
                    {item.trackingNumber}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${getStatusClasses(item.status)}`}
                  >
                    {item.status}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {getRelativeTime(item.updatedAt)}
                </span>
              </span>
              <span className="mt-2 flex flex-wrap items-center gap-2">
                <span
                  title={item.channel === "Red channel" ? "Physical inspection and valuation review" : undefined}
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${getChannelClasses(item.channel)}`}
                >
                  <ShieldAlert aria-hidden="true" className="h-3 w-3" />
                  {item.channel}
                </span>
              </span>
              <span className="mt-2 block text-sm font-semibold text-slate-900">
                {item.title}
              </span>
              <span className="mt-0.5 block truncate text-xs text-slate-500">
                {item.importer}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}