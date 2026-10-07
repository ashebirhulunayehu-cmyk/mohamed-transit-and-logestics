"use client";

import React from "react";
import { useEffect } from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { Search, Lock, Clock } from "lucide-react";
import { CaseStatusTag } from "../serviceReview.types";

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

  const renderStatusBadge = (status: CaseStatusTag) => {
    switch (status) {
      case "Requires customer action":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
            {status}
          </span>
        );
      case "Blocked":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700">
            <Lock className="w-3 h-3 text-rose-500" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            <Clock className="w-3 h-3 text-amber-600" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/50 p-5">
        <h2 className="text-sm font-bold text-slate-900">Review queue</h2>
        <p className="mt-1 text-xs text-slate-500">
          {filteredCases.length} of {cases.length} cases
        </p>

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
          <p role="alert" className="p-5 text-sm text-red-700">{error}</p>
        ) : loading && cases.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">Loading service reviews...</p>
        ) : filteredCases.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No pending service reviews.</p>
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
                {renderStatusBadge(item.statusTag)}
              </div>
              <span className="text-xs text-slate-400">{item.timeAgo}</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mt-1.5">
              {item.title} — {item.containerCount}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{item.importer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}