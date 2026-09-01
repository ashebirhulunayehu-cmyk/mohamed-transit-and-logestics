"use client";

import React from "react";
import { useAssessmentLogStore } from "../assessmentLog.store";
import { Search, Filter } from "lucide-react";

export function AssessmentLogFilters() {
  const { searchQuery, setSearchQuery, status, setStatusFilter } = useAssessmentLogStore();

  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
      {/* Search Bar */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search by reference ID, description, action..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 placeholder:text-slate-400"
        />
      </div>

      {/* Action Filter Dropdown */}
      <div className="relative w-full sm:w-auto">
        <select
          value={status}
          onChange={(e) => setStatusFilter(e.target.value as typeof status)}
          className="w-full sm:w-auto pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none"
        >
          <option value="All">All Actions</option>
          <option value="Issued assessment">Issued assessment</option>
          <option value="Blocked stage">Blocked stage</option>
          <option value="Submitted for approval">Submitted for approval</option>
          <option value="Requested revision">Requested revision</option>
          <option value="Returned KYC">Returned KYC</option>
        </select>
        <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
      </div>
    </div>
  );
}