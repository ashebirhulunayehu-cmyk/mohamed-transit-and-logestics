"use client";

import React from "react";
import { useDocumentStore } from "../document.store";
import { Search, Filter } from "lucide-react";

export function DocumentFilters() {
  const { searchQuery, setSearchQuery, statusFilter, setStatusFilter, typeFilter, setTypeFilter } =
    useDocumentStore();

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2.5 w-full">
        {/* Search Input */}
        <div className="relative min-w-[260px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by file name, service ID, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none"
          >
            <option value="ALL">All statuses</option>
            <option value="Verified">Verified</option>
            <option value="Flagged">Flagged</option>
            <option value="Rejected">Rejected</option>
            <option value="Pending check">Pending check</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Type Dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          <option value="ALL">All document types</option>
          <option value="Proforma Invoice">Proforma Invoice</option>
          <option value="Payment Slip">Payment Slip</option>
          <option value="Transit Permit">Transit Permit</option>
          <option value="Inspection Report">Inspection Report</option>
          <option value="Certificate of Origin">Certificate of Origin</option>
        </select>
      </div>
    </div>
  );
}