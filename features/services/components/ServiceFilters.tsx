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

const columnWidths = [24, 20, 36, 28, 18, 16, 20, 20, 24, 16, 18, 24];

const cellColors: Record<string, { fill: string; text: string }> = {
  "In progress": { fill: "FFE0F2FE", text: "FF075985" },
  "Needs review": { fill: "FFFEF3C7", text: "FF92400E" },
  "Requires customer action": { fill: "FFFCE7F3", text: "FF9D174D" },
  Pending: { fill: "FFF1F5F9", text: "FF334155" },
  Blocked: { fill: "FFFEE2E2", text: "FF991B1B" },
  Completed: { fill: "FFDCFCE7", text: "FF166534" },
  Delivered: { fill: "FFDCFCE7", text: "FF166534" },
  Unimodal: { fill: "FFE0F2FE", text: "FF075985" },
  Multimodal: { fill: "FFE0E7FF", text: "FF3730A3" },
  "Green channel": { fill: "FFDCFCE7", text: "FF166534" },
  "Yellow channel": { fill: "FFFEF3C7", text: "FF92400E" },
  "Red channel": { fill: "FFFEE2E2", text: "FF991B1B" },
  "Blue channel": { fill: "FFDBEAFE", text: "FF1E40AF" },
};

export function ServiceFilters({
  managerView = false,
  embedded = false,
}: {
  managerView?: boolean;
  embedded?: boolean;
}) {
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

  const exportServices = async () => {
    const rows = getFilteredServices();
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Services", {
      properties: { tabColor: { argb: "FF2563EB" }, defaultRowHeight: 24 },
      pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
      views: [{ state: "frozen", ySplit: 4 }],
    });
    const columnCount = exportColumns.length;

    worksheet.columns = exportColumns.map((column, index) => ({
      key: `column${index}`,
      width: columnWidths[index] ?? 18,
    }));
    worksheet.mergeCells(1, 1, 1, columnCount);
    worksheet.getCell("A1").value = managerView ? "MANAGER SERVICE REGISTER" : "SERVICE REGISTER";
    worksheet.getCell("A1").font = { name: "Aptos Display", size: 18, bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17324D" } };
    worksheet.getCell("A1").alignment = { vertical: "middle" };
    worksheet.getRow(1).height = 38;

    worksheet.mergeCells(2, 1, 2, columnCount);
    worksheet.getCell("A2").value = `Exported ${new Date().toLocaleString()}  |  ${rows.length} services`;
    worksheet.getCell("A2").font = { name: "Aptos", size: 10, color: { argb: "FF475569" } };
    worksheet.getCell("A2").alignment = { vertical: "middle" };
    worksheet.getRow(2).height = 24;
    worksheet.addRow([]);

    const headerRow = worksheet.addRow(exportColumns.map(({ label }) => label));
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.border = { bottom: { style: "medium", color: { argb: "FF1D4ED8" } } };
    });

    worksheet.addRows(rows.map((service) => exportColumns.map(({ value }) => value(service))));
    worksheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: columnCount },
    };

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < 5) return;
      row.eachCell((cell, columnNumber) => {
        cell.font = { name: "Aptos", size: 10, color: { argb: "FF1E293B" } };
        cell.alignment = { vertical: "middle", wrapText: columnNumber === 3 || columnNumber === 4 || columnNumber === 9 };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: rowNumber % 2 === 0 ? "FFF1F5F9" : "FFFFFFFF" },
        };
        cell.border = { bottom: { style: "hair", color: { argb: "FFE2E8F0" } } };

        const value = String(cell.value ?? "");
        const color = cellColors[value];
        if (color && [6, 7, 8].includes(columnNumber)) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color.fill } };
          cell.font = { name: "Aptos", size: 10, bold: true, color: { argb: color.text } };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer as BlobPart], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = managerView ? "manager-services.xlsx" : "services.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className={`flex flex-col items-center justify-between gap-3 border border-slate-200 bg-white p-4 shadow-sm lg:flex-row ${managerView ? "rounded-lg" : "rounded-xl"}`}>
      {/* Search Input & Select Dropdowns */}
      <div className={`grid w-full flex-1 items-center gap-2 lg:w-auto ${managerView ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-[minmax(200px,1.35fr)_repeat(3,minmax(125px,1fr))]" : "flex flex-wrap"}`}>
        <div className={`relative flex-1 ${managerView ? "min-w-0" : "min-w-65 lg:flex-initial"}`}>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            aria-label="Search services"
            placeholder="Search by service ID, reference, commodity or importer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full border border-slate-200 py-2 pl-9 pr-3 text-slate-800 placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-500 ${managerView ? "min-h-10 rounded-md text-sm" : "rounded-lg text-xs"}`}
          />
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <select
            aria-label="Filter services by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`appearance-none border border-slate-200 bg-white py-2 pl-8 pr-8 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 ${managerView ? "min-h-10 w-full rounded-md text-sm" : "cursor-pointer rounded-lg text-xs"}`}
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
          className={`border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 ${managerView ? "min-h-10 w-full rounded-md text-sm" : "cursor-pointer rounded-lg text-xs"}`}
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
          className={`border border-slate-200 bg-white px-3 py-2 font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 ${managerView ? "min-h-10 w-full rounded-md text-sm" : "cursor-pointer rounded-lg text-xs"}`}
        >
          <option value="ALL">All channels</option>
          <option value="Green channel">Green channel</option>
          <option value="Yellow channel">Yellow channel</option>
          <option value="Red channel">Red channel</option>
          <option value="Blue channel">Blue channel</option>
        </select>
      </div>

      <div className={`flex w-full items-center justify-end gap-2 lg:w-auto ${managerView ? "shrink-0" : ""}`}>
        <div className="relative">
          <button
            type="button"
            aria-controls="service-column-options"
            aria-label="Choose visible service columns"
            aria-expanded={columnsOpen}
            onClick={() => setColumnsOpen((open) => !open)}
            className={`flex min-h-10 items-center gap-1.5 border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 ${managerView ? "rounded-md text-sm" : "rounded-lg text-xs"}`}
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
          aria-label="Export filtered services as a formatted Excel workbook"
          onClick={exportServices}
          className={`flex min-h-10 items-center gap-1.5 border border-slate-200 px-3 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-50 ${managerView ? "rounded-md text-sm" : "rounded-lg text-xs"}`}
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          Export
        </button>
      </div>
    </div>
  );
}