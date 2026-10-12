"use client";

import React from "react";
import { useEffect } from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { Search, Clock, RefreshCw } from "lucide-react";

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

  const filteredCases = cases.filter(
    (c) =>
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.importer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Review queue</h2>
            <p className="mt-1 text-xs text-slate-500">
              {filteredCases.length} of {cases.length} cases · Assessor pending reviews
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchCases()}
            disabled={loading}
            aria-label="Refresh pending service reviews"
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
            <p>{cases.length ? "No cases match your search." : "No pending service reviews were returned by the Assessor API."}</p>
            {!cases.length && <p className="mt-1 text-xs text-slate-400">Submitted services appear here after the backend marks them ready for assessment.</p>}
          </div>
        ) : filteredCases.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedCaseId(item.id)}
            className={`cursor-pointer border-l-2 p-4 transition-colors ${
              selectedCaseId === item.id ? "border-l-cyan-500 bg-blue-50/70" : "border-l-transparent hover:bg-slate-50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-sky-700">{item.id}</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                  <Clock className="h-3 w-3 text-amber-600" />
                  {item.status}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {item.updatedAt === "Not recorded"
                  ? item.updatedAt
                  : new Date(item.updatedAt).toLocaleString()}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mt-1.5">
              {item.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {item.importer} · {item.trackingNumber}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}