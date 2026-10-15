"use client";

import { useState } from "react";
import { useServiceStore } from "../service.store";
import { Search, Filter, Columns, Download } from "lucide-react";
import type { ServiceColumn, ServiceRecord } from "../service.types";

const columnOptions: Array<{ key: ServiceColumn; label: string }> = [
  { key: "service", label: "Service" },
  { key: "importer", label: "Importer" },
  { key: "mode", label: "Mode" },
  { key: "status", label: "Status" },
  { key: "risk", label: "Risk" },
  { key: "caseExecutor", label: "Case executor" },
  { key: "eta", label: "ETA" },
  { key: "sla", label: "SLA" },
  { key: "updated", label: "Updated" },
];

const exportColumns: Array<{ label: string; value: (service: ServiceRecord) => string }> = [
  { label: "Service", value: (service) => service.id },
  { label: "Reference", value: (service) => service.referenceNumber ?? "" },
  { label: "Title", value: (service) => service.title },
  { label: "Importer", value: (service) => service.importerName },
  { label: "Importer code", value: (service) => service.importerCode },
  { label: "Mode", value: (service) => service.mode },
  { label: "Status", value: (service) => service.status },
  { label: "Risk", value: (service) => service.riskChannel },
  { label: "Case executor", value: (service) => service.caseExecutor },
  { label: "ETA", value: (service) => service.eta },
  { label: "SLA", value: (service) => service.sla },
  { label: "Updated", value: (service) => service.updated },
];

const escapeCsv = (value: string): string => `"${value.replaceAll('"', '""')}"`;

export function ServiceFilters({ managerView = false }: { managerView?: boolean }) {
  const [columnsOpen, setColumnsOpen] = useState(false);
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    modeFilter,
    setModeFilter,
    channelFilter,
    setChannelFilter,
    visibleColumns,
    toggleColumn,
    getFilteredServices,
  } = useServiceStore();

  const exportServices = () => {
    const rows = getFilteredServices();
    const csv = [
      exportColumns.map(({ label }) => escapeCsv(label)).join(","),
      ...rows.map((service) =>
        exportColumns.map(({ value }) => escapeCsv(value(service))).join(","),
      ),
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = managerView ? "manager-services.csv" : "services.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
      {/* Search Input & Select Dropdowns */}
      <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto flex-1">
        <div className="relative min-w-[260px] flex-1 lg:flex-initial">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            aria-label="Search services"
            placeholder="Search by service ID, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            aria-label="Filter services by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer appearance-none"
          >
            <option value="ALL">All statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Under review">Under review</option>
            <option value="Approved">Approved</option>
            <option value="In progress">In progress</option>
            <option value="Needs review">Needs review</option>
            <option value="Requires customer action">Requires customer action</option>
            <option value="Pending">Pending</option>
            <option value="Blocked">Blocked</option>
            <option value="Completed">Completed</option>
            <option value="Rejected">Rejected</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Delivered">Delivered</option>
          </select>
          <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
        </div>

        {/* Mode Dropdown */}
        <select
          aria-label="Filter services by transport mode"
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
          aria-label="Filter services by risk channel"
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
        >
          <option value="ALL">All channels</option>
          <option value="Green channel">Green channel</option>
          <option value="Yellow channel">Yellow channel</option>
          <option value="Red channel">Red channel</option>
          <option value="Blue channel">Blue channel</option>
        </select>
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
        <div className="relative">
          <button
            type="button"
            aria-controls="service-column-options"
            aria-label="Choose visible service columns"
            aria-expanded={columnsOpen}
            onClick={() => setColumnsOpen((open) => !open)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Columns className="w-3.5 h-3.5 text-slate-500" />
            Columns
          </button>
          {columnsOpen && (
            <div id="service-column-options" className="absolute right-0 top-full z-20 mt-2 min-w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
              {columnOptions.map(({ key, label }) => (
                <label key={key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={visibleColumns.includes(key)}
                    onChange={() => toggleColumn(key)}
                    className="accent-blue-600"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label="Export filtered services as CSV"
          onClick={exportServices}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export
        </button>
      </div>
    </div>
  );
}