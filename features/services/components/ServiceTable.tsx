"use client";

import React from "react";
import Link from "next/link";
import { useServiceStore } from "../service.store";
import { ServiceStatus, RiskChannel } from "../service.types";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Lock,
  CheckCircle2,
  RotateCcw,
  ArrowUpDown,
} from "lucide-react";

export function ServiceTable() {
  const getFilteredServices = useServiceStore((state) => state.getFilteredServices);
  const filteredData = getFilteredServices();

  const renderStatusBadge = (status: ServiceStatus) => {
    switch (status) {
      case "In progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <RotateCcw className="w-3 h-3 text-sky-600 animate-spin-slow" />
            {status}
          </span>
        );
      case "Needs review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            {status}
          </span>
        );
      case "Requires customer action":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            {status}
          </span>
        );
      case "Pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            {status}
          </span>
        );
      case "Blocked":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-3 h-3 text-rose-500" />
            {status}
          </span>
        );
      case "Completed":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {status}
          </span>
        );
    }
  };

  const renderRiskBadge = (channel: RiskChannel) => {
    switch (channel) {
      case "Green channel":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {channel}
          </span>
        );
      case "Yellow channel":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
            {channel}
          </span>
        );
      case "Red channel":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
            <ShieldX className="w-3.5 h-3.5 text-rose-600" />
            {channel}
          </span>
        );
      case "Blue channel":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
            {channel}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">SERVICE</th>
              <th className="py-3 px-4">IMPORTER</th>
              <th className="py-3 px-4">MODE</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">RISK</th>
              <th className="py-3 px-4">CASE EXECUTOR</th>
              <th className="py-3 px-4">ETA</th>
              <th className="py-3 px-4">SLA</th>
              <th className="py-3 px-4">
                <div className="flex items-center gap-1 cursor-pointer">
                  UPDATED <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-3.5 px-4">
                  <Link
                    href={`./service-reviews/${row.id}`}
                    className="font-semibold text-sky-700 hover:underline block"
                  >
                    {row.id}
                  </Link>
                  <span className="text-slate-500 text-[11px] block mt-0.5">
                    {row.title}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-slate-800 block">
                    {row.importerName}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                    {row.importerCode}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-700 font-medium">{row.mode}</td>
                <td className="py-3.5 px-4">{renderStatusBadge(row.status)}</td>
                <td className="py-3.5 px-4">{renderRiskBadge(row.riskChannel)}</td>
                <td className="py-3.5 px-4 text-slate-800 font-medium">
                  {row.caseExecutor}
                </td>
                <td className="py-3.5 px-4 text-slate-700">{row.eta}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`font-semibold ${
                      row.isOverdue
                        ? "text-rose-600"
                        : row.sla === "Closed"
                        ? "text-slate-400 font-normal"
                        : "text-amber-700"
                    }`}
                  >
                    {row.sla}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400">{row.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredData.length} of 6 services</span>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-400 bg-slate-50 cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-2 font-medium text-slate-700">Page 1 of 1</span>
          <button
            disabled
            className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-400 bg-slate-50 cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}