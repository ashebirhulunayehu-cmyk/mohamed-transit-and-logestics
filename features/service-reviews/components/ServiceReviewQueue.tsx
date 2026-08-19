"use client";

import React from "react";
import { useServiceReviewStore } from "../serviceReview.store";
import { Search, Lock, Clock } from "lucide-react";
import { CaseStatusTag } from "../serviceReview.types";

export function ServiceReviewQueue() {
  const { cases, selectedCaseId, setSelectedCaseId, searchTerm, setSearchTerm } =
    useServiceReviewStore();

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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {status}
          </span>
        );
      case "Blocked":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-500" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">Review queue</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {filteredCases.length} of {cases.length} cases
        </p>

        <div className="relative mt-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search case, importer or commodity"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {filteredCases.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelectedCaseId(item.id)}
            className={`p-4 cursor-pointer transition-colors ${
              selectedCaseId === item.id ? "bg-slate-50 border-l-4 border-l-sky-700" : "hover:bg-slate-50/50"
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