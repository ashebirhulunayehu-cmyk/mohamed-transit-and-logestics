"use client";

import React from "react";
import { useServiceStore } from "../service.store";
import { Search, Filter, Columns, Download } from "lucide-react";

export function ServiceFilters() {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    modeFilter,
    setModeFilter,
    channelFilter,
    setChannelFilter,
  } = useServiceStore();

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
      {/* Search Input & Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto flex-1">
        <div className="relative min-w-[260px] flex-1 lg:flex-initial">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by service ID, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
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
            <option value="In progress">In progress</option>
            <option value="Needs review">Needs review</option>
            <option value="Requires customer action">Requires customer action</option>
            <option value="Pending">Pending</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Mode Dropdown */}
        <select
          value={modeFilter}
          onChange={(e) => setModeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          <option value="ALL">All modes</option>
          <option value="Unimodal">Unimodal</option>
          <option value="Multimodal">Multimodal</option>
        </select>

        {/* Channels Dropdown */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          <option value="ALL">All channels</option>
          <option value="Green">Green channel</option>
          <option value="Yellow">Yellow channel</option>
          <option value="Red">Red channel</option>
          <option value="Blue">Blue channel</option>
        </select>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
        <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <Columns className="w-3.5 h-3.5 text-slate-500" />
          Columns
        </button>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export
        </button>
      </div>
    </div>
  );
}